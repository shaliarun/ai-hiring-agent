import { pgTable, text, serial, timestamp, integer, real, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const candidatesTable = pgTable("candidates", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  skills: jsonb("skills").notNull().$type<string[]>().default([]),
  experienceYears: real("experience_years"),
  education: text("education"),
  location: text("location"),
  resumeText: text("resume_text"),
  resumeFileName: text("resume_file_name"),
  resumeFileData: text("resume_file_data"),
  resumeFileMime: text("resume_file_mime"),
  matchScore: real("match_score"),
  matchedSkills: jsonb("matched_skills").notNull().$type<string[]>().default([]),
  rejectionReason: text("rejection_reason"),
  shortlisted: boolean("shortlisted").notNull().default(false),
  status: text("status").notNull().default("pending"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertCandidateSchema = createInsertSchema(candidatesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCandidate = z.infer<typeof insertCandidateSchema>;
export type Candidate = typeof candidatesTable.$inferSelect;
