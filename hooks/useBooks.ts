import { useDatabase } from './useDatabase';
import { useState, useCallback, useEffect } from 'react';

export type Book = {
    id: string;
    title: string;
    author?: string; // Made optional locally, though DB allows specific types
    coverUri?: string;
    coverUrl?: string;
    gutenbergId?: string;
    gutenbergTextUrl?: string;
    totalUnits: number;
    unitsCompleted: number;
    startDate?: string;
    targetEndDate?: string;
    status: 'Reading' | 'Completed' | 'Paused';
};

export function useBooks() {
    const db = useDatabase();
    const [books, setBooks] = useState<Book[]>([]);

    const refreshBooks = useCallback(async () => {
        try {
            const result = await db.getAllAsync<Book>('SELECT * FROM books ORDER BY createdAt DESC');
            setBooks(result);
        } catch (error) {
            console.error("Error fetching books", error);
        }
    }, [db]);

    const addBook = async (book: Omit<Book, 'id' | 'status'>) => {
        const id = Date.now().toString(); // Simple ID for now
        await db.runAsync(
            `INSERT INTO books (id, title, author, coverUri, totalUnits, unitsCompleted, status, startDate, targetEndDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, book.title, book.author ?? null, book.coverUri ?? null, book.totalUnits, book.unitsCompleted, 'Reading', book.startDate ?? null, book.targetEndDate ?? null]
        );
        await refreshBooks();
    };

    useEffect(() => {
        refreshBooks();
    }, [refreshBooks]);

    return { books, addBook, refreshBooks };
}
