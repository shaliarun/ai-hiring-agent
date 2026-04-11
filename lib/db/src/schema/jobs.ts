import { pgTable, text, serial, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const jobsTable = pgTable("jobs", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  department: text("department").notNull(),
  requiredSkills: jsonb("required_skills").notNull().$type<string[]>().default([]),
  niceToHaveSkills: jsonb("nice_to_have_skills").notNull().$type<string[]>().default([]),
  keywords: jsonb("keywords").notNull().$type<string[]>().default([]),
  experienceMin: integer("experience_min"),
  experienceMax: integer("experience_max"),
  education: text("education"),
  location: text("location"),
  salaryMin: integer("salary_min"),
  salaryMax: integer("salary_max"),
  status: text("status").notNull().default("open"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertJobSchema = createInsertSchema(jobsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertJob = z.infer<typeof insertJobSchema>;
export type Job = typeof jobsTable.$inferSelect;
