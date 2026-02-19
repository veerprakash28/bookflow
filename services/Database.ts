import { SQLiteDatabase } from 'expo-sqlite';

export async function migrateDbIfNeeded(db: SQLiteDatabase) {
  const DATABASE_VERSION = 1;
  // db.execAsync is available in newer versions? Or runAsync/getAllAsync
  // Check documentation for 14+. usually execAsync for blocks.

  // Create books table
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS books (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      author TEXT,
      coverUri TEXT,
      totalUnits INTEGER NOT NULL, -- Total pages or chapters
      unitsCompleted INTEGER NOT NULL DEFAULT 0,
      startDate TEXT,
      targetEndDate TEXT,
      status TEXT NOT NULL DEFAULT 'Reading', -- Reading, Completed, Paused
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS stats (
      id TEXT PRIMARY KEY NOT NULL DEFAULT 'user_main',
      totalPoints INTEGER DEFAULT 0,
      booksRead INTEGER DEFAULT 0,
      currentStreak INTEGER DEFAULT 0,
      longestStreak INTEGER DEFAULT 0,
      lastReadDate TEXT
    );

    CREATE TABLE IF NOT EXISTS user_settings (
      id TEXT PRIMARY KEY NOT NULL DEFAULT 'user_main',
      name TEXT DEFAULT 'Guest User',
      title TEXT DEFAULT 'Reading Enthusiast'
    );

    INSERT OR IGNORE INTO stats (id, totalPoints, booksRead, currentStreak, longestStreak, lastReadDate) VALUES ('user_main', 0, 0, 0, 0, NULL);
    INSERT OR IGNORE INTO user_settings (id, name, title) VALUES ('user_main', 'Guest User', 'Reading Enthusiast');

    -- Migrations for existing databases
    try {
        await db.execAsync("ALTER TABLE stats ADD COLUMN currentStreak INTEGER DEFAULT 0;");
    } catch (e) { /* Column likely exists */ }
    try {
        await db.execAsync("ALTER TABLE stats ADD COLUMN longestStreak INTEGER DEFAULT 0;");
    } catch (e) { /* Column likely exists */ }
    try {
        await db.execAsync("ALTER TABLE stats ADD COLUMN lastReadDate TEXT;");
    } catch (e) { /* Column likely exists */ }
  `);

  // Future migrations can go here
  console.log('Database migrated successfully');
}
