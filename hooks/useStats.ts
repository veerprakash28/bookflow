import { useSQLiteContext } from 'expo-sqlite';
import { useState, useCallback, useEffect } from 'react';

export type UserStats = {
    totalPoints: number;
    booksRead: number;
};

export const useStats = () => {
    const db = useSQLiteContext();
    const [stats, setStats] = useState<UserStats>({ totalPoints: 0, booksRead: 0 });

    const refreshStats = useCallback(async () => {
        try {
            const result = await db.getFirstAsync<UserStats>('SELECT * FROM stats WHERE id = ?', ['user_main']);
            if (result) setStats(result);
        } catch (e) {
            console.error("Error fetching stats", e);
        }
    }, [db]);

    const addPoints = async (points: number) => {
        try {
            await db.runAsync('UPDATE stats SET totalPoints = MAX(0, totalPoints + ?) WHERE id = ?', [points, 'user_main']);
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
            await db.runAsync('UPDATE stats SET totalPoints = 0, booksRead = 0 WHERE id = ?', ['user_main']);
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
