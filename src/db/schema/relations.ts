import { relations } from "drizzle-orm";
import { professors } from "./professors.schema";
import { courses } from "./courses.schema";
import { chat_sessions } from "./chat_sessions.schema";

// Define database relations that were commented out to avoid circular imports

export const professorsRelations = relations(professors, ({ many }) => ({
  courses: many(courses),
}));

export const coursesRelations = relations(courses, ({ one, many }) => ({
  professor: one(professors, {
    fields: [courses.professor_id],
    references: [professors.id],
  }),
  chat_sessions: many(chat_sessions),
})); 