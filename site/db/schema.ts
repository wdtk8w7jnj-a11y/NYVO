// Intentionally empty by default.
// Add Drizzle tables here when the site actually needs a database.
// See examples/d1/db/schema.ts for an opt-in example.
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const pilotControl = sqliteTable('pilot_control', {
  id: text('id').primaryKey(), day: text('day').notNull().default(''),
  used: integer('used').notNull().default(0), lockUntil: integer('lock_until').notNull().default(0),
  token: text('token'), lastCall: integer('last_call').notNull().default(0), blockedUntil: integer('blocked_until').notNull().default(0),
});
export const pilotCache = sqliteTable('pilot_cache', {
  key: text('key').primaryKey(), fetchedAt: integer('fetched_at').notNull(), expiresAt: integer('expires_at').notNull(), payload: text('payload').notNull(),
});
export const pilotFixtures = sqliteTable('pilot_fixtures', {
  id: integer('id').primaryKey(), league: integer('league').notNull(), season: integer('season').notNull(),
});

// Shared YouTube catalogue; no user credentials or private user records.
export const highlightControl = sqliteTable('highlight_control', {
 id: text('id').primaryKey(), day: text('day').notNull().default(''), used: integer('used').notNull().default(0),
 lockUntil: integer('lock_until').notNull().default(0), token: text('token'), blockedUntil: integer('blocked_until').notNull().default(0),
 lastRun: integer('last_run'), lastSuccess: integer('last_success'), error: text('error'),
});
export const highlightSources = sqliteTable('highlight_sources', {id:text('id').primaryKey(),payload:text('payload').notNull(),checkedAt:integer('checked_at').notNull()});
export const highlightJobs = sqliteTable('highlight_jobs', {id:integer('id').primaryKey(),payload:text('payload').notNull(),finishedAt:integer('finished_at').notNull(),nextCheck:integer('next_check').notNull(),checkedAt:integer('checked_at'),state:text('state').notNull().default('waiting')});
export const highlightVideos = sqliteTable('highlight_videos', {id:text('id').primaryKey(),matchId:integer('match_id').notNull(),payload:text('payload').notNull(),firstSeen:integer('first_seen').notNull(),checkedAt:integer('checked_at').notNull(),state:text('state').notNull().default('available')});
export const highlightReviews = sqliteTable('highlight_reviews', {id:text('id').primaryKey(),payload:text('payload').notNull(),checkedAt:integer('checked_at').notNull(),state:text('state').notNull().default('pending')});
