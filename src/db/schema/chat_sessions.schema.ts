import { pgTable, uuid, varchar, text, timestamp, integer } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { courses } from "./courses.schema";

export const chat_sessions = pgTable("chat_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  // Course Association
  course_id: uuid("course_id")
    .notNull()
    .references(() => courses.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
  
  // Student Information
  student_canvas_id: varchar("student_canvas_id", { length: 255 }).notNull(),
  student_name: varchar("student_name", { length: 255 }).notNull(),
  
  // Session Data
  session_title: varchar("session_title", { length: 255 }).default("Chat Session"),
  messages: text("messages").notNull(), // JSON array of messages
  message_count: integer("message_count").default(0),
  
  // Timestamps
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  last_message_at: timestamp("last_message_at", { withTimezone: true }).defaultNow(),
});

// Define relations
export const chatSessionsRelations = relations(chat_sessions, ({ one }) => ({
  course: one(courses, {
    fields: [chat_sessions.course_id],
    references: [courses.id],
  }),
}));

// Types
export type ChatSession = typeof chat_sessions.$inferSelect;
export type NewChatSession = typeof chat_sessions.$inferInsert; 