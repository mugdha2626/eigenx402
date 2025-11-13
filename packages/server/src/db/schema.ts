/**
 * Database schema using Drizzle ORM
 */

import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const jobs = sqliteTable('jobs', {
  id: text('id').primaryKey(),
  prompt: text('prompt').notNull(),
  model: text('model').notNull(),
  seed: integer('seed').notNull(),
  txHash: text('tx_hash'),
  imageDigest: text('image_digest'),
  proofJson: text('proof_json'),
  status: text('status', { enum: ['pending_payment', 'completed', 'failed'] })
    .notNull()
    .default('pending_payment'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date())
});

export type Job = typeof jobs.$inferSelect;
export type NewJob = typeof jobs.$inferInsert;
