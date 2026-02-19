import { useSQLiteContext } from 'expo-sqlite';
import { Platform } from 'react-native';

const mockDb = {
    getAllAsync: async <T>(query: string, params?: any[]): Promise<T[]> => {
        if (query.includes('FROM books')) return [] as any;
        if (query.includes('FROM stats')) return [{ totalPoints: 0, booksRead: 0, currentStreak: 0, longestStreak: 0, lastReadDate: null }] as any;
        return [] as any;
    },
    runAsync: async (query: string, params?: any[]) => {
        return { lastInsertRowId: 1, changes: 1 };
    },
    execAsync: async (query: string) => {
    },
    getFirstAsync: async <T>(query: string, params?: any[]): Promise<T | null> => {
        if (query.includes('FROM stats')) return { totalPoints: 0, booksRead: 0, currentStreak: 0, longestStreak: 0, lastReadDate: null } as any;
        return null;
    }
};

export function useDatabase() {
    if (Platform.OS === 'web') {
        return mockDb;
    }
    return useSQLiteContext();
}
