/**
 * Database initialization and client
 */

import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from './schema';
import { config } from '../config';

// Extract file path from DATABASE_URL (format: file:./dev.db)
const dbPath = config.databaseUrl.replace('file:', '');

// Initialize SQLite
const sqlite = new Database(dbPath);

// Create Drizzle client
export const db = drizzle(sqlite, { schema });

/**
 * Initialize database (create tables if they don't exist)
 */
export function initDatabase() {
  // Create tables using raw SQL (simpler than migrations for demo)
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      prompt TEXT NOT NULL,
      model TEXT NOT NULL,
      seed INTEGER NOT NULL,
      tx_hash TEXT,
      image_digest TEXT,
      proof_json TEXT,
      status TEXT NOT NULL DEFAULT 'pending_payment',
      created_at INTEGER NOT NULL
    );
  `);

  console.log('[DB] Database initialized');
}
