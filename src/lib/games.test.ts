import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDatabase } from '../../db/test-helpers';
import { categories, publishers, games } from '../../db/schema';
import type { Database } from './db';
import {
    getAllGames,
    getAllGameIds,
    getGameById,
    getRelatedGamesByCategory,
} from './games';

async function seedGames(db: Database, count: number): Promise<void> {
    const [category] = await db
        .insert(categories)
        .values({ name: 'Strategy', description: 'cat' })
        .returning({ id: categories.id });
    const [publisher] = await db
        .insert(publishers)
        .values({ name: 'Pub One', description: 'pub' })
        .returning({ id: publishers.id });

    // Insert titles in reverse-alphabetical order to prove ordering is applied.
    for (let i = count; i >= 1; i--) {
        await db.insert(games).values({
            title: `Game ${String(i).padStart(2, '0')}`,
            description: `Description ${i}`,
            starRating: 4.2,
            categoryId: category.id,
            publisherId: publisher.id,
        });
    }
}

describe('games data-access helpers', () => {
    let db: Database;

    beforeEach(async () => {
        db = await createTestDatabase();
    });

    it('returns all games ordered by title', async () => {
        await seedGames(db, 3);
        const all = await getAllGames(db);
        expect(all.map((g) => g.title)).toEqual(['Game 01', 'Game 02', 'Game 03']);
        expect(all[0].category).toEqual({ id: expect.any(Number), name: 'Strategy' });
        expect(all[0].publisher).toEqual({ id: expect.any(Number), name: 'Pub One' });
    });

    it('returns all game ids ordered by title', async () => {
        await seedGames(db, 3);
        const ids = await getAllGameIds(db);
        const all = await getAllGames(db);
        expect(ids).toEqual(all.map((g) => g.id));
    });

    it('fetches a single game by id', async () => {
        await seedGames(db, 2);
        const ids = await getAllGameIds(db);
        const game = await getGameById(db, ids[0]);
        expect(game?.title).toBe('Game 01');
    });

    it('returns null for a non-existent game', async () => {
        await seedGames(db, 2);
        expect(await getGameById(db, 99999)).toBeNull();
    });

    it('returns related games in the same category excluding the current game', async () => {
        const [strategy] = await db
            .insert(categories)
            .values({ name: 'Strategy', description: 'Strategy games' })
            .returning({ id: categories.id });
        const [puzzle] = await db
            .insert(categories)
            .values({ name: 'Puzzle', description: 'Puzzle games' })
            .returning({ id: categories.id });
        const [publisher] = await db
            .insert(publishers)
            .values({ name: 'Pub One', description: 'pub' })
            .returning({ id: publishers.id });

        const insertedGames = await db
            .insert(games)
            .values([
                {
                    title: 'Alpha Strategy',
                    description: 'A',
                    starRating: 4.1,
                    categoryId: strategy.id,
                    publisherId: publisher.id,
                },
                {
                    title: 'Beta Strategy',
                    description: 'B',
                    starRating: 4.2,
                    categoryId: strategy.id,
                    publisherId: publisher.id,
                },
                {
                    title: 'Gamma Strategy',
                    description: 'C',
                    starRating: 4.3,
                    categoryId: strategy.id,
                    publisherId: publisher.id,
                },
                {
                    title: 'Puzzle Quest',
                    description: 'P',
                    starRating: 4.0,
                    categoryId: puzzle.id,
                    publisherId: publisher.id,
                },
            ])
            .returning({ id: games.id, title: games.title });

        const currentGame = insertedGames.find((game) => game.title === 'Beta Strategy');
        expect(currentGame).toBeDefined();
        if (!currentGame) {
            throw new Error('Expected current game fixture to exist');
        }

        const related = await getRelatedGamesByCategory(db, strategy.id, currentGame.id);
        expect(related.map((game) => game.title)).toEqual(['Alpha Strategy', 'Gamma Strategy']);
    });

    it('returns an empty array when there are no related games in the same category', async () => {
        await seedGames(db, 1);
        const ids = await getAllGameIds(db);
        const game = await getGameById(db, ids[0]);

        const related = await getRelatedGamesByCategory(db, game?.category?.id ?? null, ids[0]);
        expect(related).toEqual([]);
    });

    it('returns an empty array when category is null', async () => {
        const related = await getRelatedGamesByCategory(db, null, 1);
        expect(related).toEqual([]);
    });
});
