import { pgTable, uuid, varchar, text, timestamp, boolean } from "drizzle-orm/pg-core";
// import { relations } from "drizzle-orm"; // Relations defined in relations.ts
import { professors } from "./professors.schema";

export const courses = pgTable("courses", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  // Canvas Course Information
  canvas_course_id: varchar("canvas_course_id", { length: 255 }).notNull().unique(),
  course_name: varchar("course_name", { length: 255 }).notNull(),
  course_code: varchar("course_code", { length: 100 }),
  
  // Professor Association
  professor_id: uuid("professor_id")
    .notNull()
    .references(() => professors.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
  
  // LTI Configuration
  deployment_id: varchar("deployment_id", { length: 255 }).notNull(),
  
  // App Status
  is_active: boolean("is_active").default(true),
  assistant_name: varchar("assistant_name", { length: 255 }).default("AI Assistant"),
  
  // OpenAI Configuration (per-course)
  openai_api_key: text("openai_api_key"), // Encrypted
  system_instructions: text("system_instructions"),
  model: varchar("model", { length: 100 }).default("gpt-4"),
  max_tokens: varchar("max_tokens", { length: 10 }).default("1000"),
  temperature: varchar("temperature", { length: 5 }).default("0.7"),
  is_setup_complete: boolean("is_setup_complete").default(false),
  
  // File Storage
  knowledge_base_files: text("knowledge_base_files"), // JSON array of file references
  
  // Timestamps
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Note: Relations defined in src/db/schema/relations.ts to avoid circular imports

// Types
export type Course = typeof courses.$inferSelect;
export type NewCourse = typeof courses.$inferInsert; 