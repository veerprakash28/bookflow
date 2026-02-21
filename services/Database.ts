import { SQLiteDatabase } from 'expo-sqlite';

export async function migrateDbIfNeeded(db: SQLiteDatabase) {
  // 1. Create base tables
  await db.execAsync('PRAGMA journal_mode = WAL');

  await db.runAsync(`
    CREATE TABLE IF NOT EXISTS books (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      author TEXT,
      coverUri TEXT,
      totalUnits INTEGER NOT NULL,
      unitsCompleted INTEGER NOT NULL DEFAULT 0,
      startDate TEXT,
      targetEndDate TEXT,
      status TEXT NOT NULL DEFAULT 'Reading',
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.runAsync(`
    CREATE TABLE IF NOT EXISTS stats (
      id TEXT PRIMARY KEY NOT NULL DEFAULT 'user_main',
      totalPoints INTEGER DEFAULT 0,
      booksRead INTEGER DEFAULT 0
    )
  `);

  await db.runAsync(`
    CREATE TABLE IF NOT EXISTS user_settings (
      id TEXT PRIMARY KEY NOT NULL DEFAULT 'user_main',
      name TEXT DEFAULT 'Guest User',
      title TEXT DEFAULT 'Reading Enthusiast'
    )
  `);

  // 2. Add columns if they don't exist (Migrations)
  try {
    await db.runAsync("ALTER TABLE stats ADD COLUMN currentStreak INTEGER DEFAULT 0");
  } catch (e) { /* Ignore */ }

  try {
    await db.runAsync("ALTER TABLE stats ADD COLUMN longestStreak INTEGER DEFAULT 0");
  } catch (e) { /* Ignore */ }

  try {
    await db.runAsync("ALTER TABLE stats ADD COLUMN lastReadDate TEXT");
  } catch (e) { /* Ignore */ }

  // Add scannedText column to books for OCR text persistence
  try {
    await db.runAsync("ALTER TABLE books ADD COLUMN scannedText TEXT DEFAULT ''");
  } catch (e) { /* Ignore - column may already exist */ }

  // Add columns for Book API / digital reader feature
  try {
    await db.runAsync("ALTER TABLE books ADD COLUMN coverUrl TEXT");
  } catch (e) { /* Ignore */ }

  try {
    await db.runAsync("ALTER TABLE books ADD COLUMN gutenbergId TEXT");
  } catch (e) { /* Ignore */ }

  try {
    await db.runAsync("ALTER TABLE books ADD COLUMN gutenbergTextUrl TEXT");
  } catch (e) { /* Ignore */ }

  try {
    await db.runAsync("ALTER TABLE books ADD COLUMN chapters TEXT"); // JSON string
  } catch (e) { /* Ignore */ }

  // 3. Insert default rows
  await db.runAsync("INSERT OR IGNORE INTO stats (id, totalPoints, booksRead, currentStreak, longestStreak, lastReadDate) VALUES ('user_main', 0, 0, 0, 0, NULL)");
  await db.runAsync("INSERT OR IGNORE INTO user_settings (id, name, title) VALUES ('user_main', 'Guest User', 'Reading Enthusiast')");

  console.log('Database migrated successfully');
}
