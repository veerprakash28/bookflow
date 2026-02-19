import { useDatabase } from './useDatabase';
import { useState, useCallback, useEffect } from 'react';

export type UserStats = {
    totalPoints: number;
    booksRead: number;
    currentStreak: number;
    longestStreak: number;
    lastReadDate: string | null;
};

export const useStats = () => {
    const db = useDatabase();
    const [stats, setStats] = useState<UserStats>({
        totalPoints: 0,
        booksRead: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastReadDate: null
    });

    const refreshStats = useCallback(async () => {
        try {
            const result = await db.getFirstAsync<UserStats>('SELECT * FROM stats WHERE id = ?', ['user_main']);
            if (result) setStats(result);
        } catch (e) {
            console.error("Error fetching stats", e);
        }
    }, [db]);

    const updateStreak = async () => {
        try {
            const result = await db.getFirstAsync<UserStats>('SELECT * FROM stats WHERE id = ?', ['user_main']);
            if (!result) return;

            const today = new Date().toISOString().split('T')[0];
            const lastRead = result.lastReadDate ? result.lastReadDate.split('T')[0] : null;

            if (lastRead === today) return; // Already logged today

            let newStreak = 1;
            if (lastRead) {
                const lastDate = new Date(lastRead);
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = yesterday.toISOString().split('T')[0];

                if (lastRead === yesterdayStr) {
                    newStreak = (result.currentStreak || 0) + 1;
                }
            }

            const newLongest = Math.max(newStreak, result.longestStreak || 0);

            await db.runAsync(
                `UPDATE stats SET currentStreak = ?, longestStreak = ?, lastReadDate = ? WHERE id = ?`,
                [newStreak, newLongest, new Date().toISOString(), 'user_main']
            );
        } catch (e) {
            console.error("Error updating streak", e);
        }
    };

    const addPoints = async (points: number) => {
        try {
            await db.runAsync('UPDATE stats SET totalPoints = MAX(0, totalPoints + ?) WHERE id = ?', [points, 'user_main']);
            if (points > 0) await updateStreak();
            await refreshStats();
        } catch (e) {
            console.error("Error adding points", e);
        }
    };

    const updateBooksRead = async (delta: number) => {
        try {
            await db.runAsync('UPDATE stats SET booksRead = MAX(0, booksRead + ?) WHERE id = ?', [delta, 'user_main']);
            await refreshStats();
        } catch (e) {
            console.error("Error updating books read", e);
        }
    }

    const resetStats = async () => {
        try {
            await db.runAsync('UPDATE stats SET totalPoints = 0, booksRead = 0, currentStreak = 0, longestStreak = 0, lastReadDate = NULL WHERE id = ?', ['user_main']);
            await refreshStats();
        } catch (e) {
            console.error("Error resetting stats", e);
        }
    }

    useEffect(() => {
        refreshStats();
    }, [refreshStats]);

    return { stats, addPoints, updateBooksRead, refreshStats, resetStats };
}
