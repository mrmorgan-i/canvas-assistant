import { pgTable, uuid, varchar, timestamp } from "drizzle-orm/pg-core";
// import { relations } from "drizzle-orm"; // Relations defined in relations.ts

export const professors = pgTable("professors", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  // LTI User Information
  lti_user_id: varchar("lti_user_id", { length: 255 }).notNull().unique(),
  canvas_user_id: varchar("canvas_user_id", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  
  // App Configuration
  last_login: timestamp("last_login", { withTimezone: true }),
  
  // Timestamps
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Note: Relations defined in src/db/schema/relations.ts to avoid circular imports

// Types
export type Professor = typeof professors.$inferSelect;
export type NewProfessor = typeof professors.$inferInsert; 