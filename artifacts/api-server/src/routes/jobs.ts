import { Router, type IRouter } from "express";
import { eq, count, and, sql } from "drizzle-orm";
import { db, jobsTable, candidatesTable, activityTable } from "@workspace/db";
import { logger } from "../lib/logger";
import {
  CreateJobBody,
  UpdateJobBody,
  GetJobParams,
  UpdateJobParams,
  DeleteJobParams,
  ListJobCandidatesParams,
  ListJobCandidatesQueryParams,
  ScreenJobCandidatesParams,
} from "@workspace/api-zod";
import { scoreCandidate, parseResume } from "../lib/screening";

const router: IRouter = Router();

router.get("/jobs", async (req, res): Promise<void> => {
  const jobs = await db.select().from(jobsTable).orderBy(jobsTable.createdAt);

  const candidateCounts = await db
    .select({ jobId: candidatesTable.jobId, total: count(), shortlisted: count(sql`CASE WHEN ${candidatesTable.shortlisted} = true THEN 1 END`) })
    .from(candidatesTable)
    .groupBy(candidatesTable.jobId);

  const countMap = new Map(candidateCounts.map(c => [c.jobId, { candidateCount: Number(c.total), shortlistedCount: Number(c.shortlisted) }]));

  const result = jobs.map(job => ({
    ...job,
    candidateCount: countMap.get(job.id)?.candidateCount ?? 0,
    shortlistedCount: countMap.get(job.id)?.shortlistedCount ?? 0,
  }));

  res.json(result);
});

router.post("/jobs", async (req, res): Promise<void> => {
  const parsed = CreateJobBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  try {
    const [job] = await db.insert(jobsTable).values({
      title: parsed.data.title,
      department: parsed.data.department,
      description: parsed.data.description ?? null,
      requiredSkills: parsed.data.requiredSkills ?? [],
      niceToHaveSkills: parsed.data.niceToHaveSkills ?? [],
      keywords: parsed.data.keywords ?? [],
      experienceMin: parsed.data.experienceMin ?? null,
      experienceMax: parsed.data.experienceMax ?? null,
      education: parsed.data.education ?? null,
      location: parsed.data.location ?? null,
      salaryMin: parsed.data.salaryMin ?? null,
      salaryMax: parsed.data.salaryMax ?? null,
      status: "open",
    }).returning();

    await db.insert(activityTable).values({
      type: "job_created",
      description: `New job posted: ${job.title} in ${job.department}`,
      jobTitle: job.title,
    });

    res.status(201).json({ ...job, candidateCount: 0, shortlistedCount: 0 });
  } catch (error) {
    logger.error({ error }, "Failed to create job");
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to create job",
    });
  }
});

router.get("/jobs/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetJobParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [job] = await db.select().from(jobsTable).where(eq(jobsTable.id, params.data.id));
  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }

  const [counts] = await db
    .select({ total: count(), shortlisted: count(sql`CASE WHEN ${candidatesTable.shortlisted} = true THEN 1 END`) })
    .from(candidatesTable)
    .where(eq(candidatesTable.jobId, job.id));

  res.json({
    ...job,
    candidateCount: Number(counts?.total ?? 0),
    shortlistedCount: Number(counts?.shortlisted ?? 0),
  });
});

router.patch("/jobs/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateJobParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateJobBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [job] = await db.update(jobsTable).set(parsed.data).where(eq(jobsTable.id, params.data.id)).returning();
  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }

  const [counts] = await db
    .select({ total: count(), shortlisted: count(sql`CASE WHEN ${candidatesTable.shortlisted} = true THEN 1 END`) })
    .from(candidatesTable)
    .where(eq(candidatesTable.jobId, job.id));

  res.json({
    ...job,
    candidateCount: Number(counts?.total ?? 0),
    shortlistedCount: Number(counts?.shortlisted ?? 0),
  });
});

router.delete("/jobs/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteJobParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [job] = await db.delete(jobsTable).where(eq(jobsTable.id, params.data.id)).returning();
  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }

  res.sendStatus(204);
});

router.get("/jobs/:id/candidates", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = ListJobCandidatesParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const queryParams = ListJobCandidatesQueryParams.safeParse(req.query);

  let query = db.select().from(candidatesTable).where(eq(candidatesTable.jobId, params.data.id));

  const candidates = await query.orderBy(candidatesTable.matchScore);

  let filtered = candidates.reverse();

  if (queryParams.success) {
    if (queryParams.data.status) {
      filtered = filtered.filter(c => c.status === queryParams.data.status);
    }
    if (queryParams.data.minScore != null) {
      filtered = filtered.filter(c => (c.matchScore ?? 0) >= queryParams.data.minScore!);
    }
    if (queryParams.data.shortlisted != null) {
      filtered = filtered.filter(c => c.shortlisted === queryParams.data.shortlisted);
    }
  }

  res.json(filtered);
});

router.post("/jobs/:id/screen", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = ScreenJobCandidatesParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [job] = await db.select().from(jobsTable).where(eq(jobsTable.id, params.data.id));
  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }

  const pendingCandidates = await db
    .select()
    .from(candidatesTable)
    .where(and(eq(candidatesTable.jobId, params.data.id), eq(candidatesTable.status, "pending")));

  const updatedCandidates = [];
  for (const candidate of pendingCandidates) {
    const score = await scoreCandidate(candidate, job);
    const [updated] = await db
      .update(candidatesTable)
      .set({
        matchScore: score.matchScore,
        matchedSkills: score.matchedSkills,
        rejectionReason: score.rejectionReason,
        shortlisted: score.shortlisted,
      })
      .where(eq(candidatesTable.id, candidate.id))
      .returning();
    updatedCandidates.push(updated);
  }

  const shortlisted = updatedCandidates.filter(c => c.shortlisted);

  if (shortlisted.length > 0) {
    await db.insert(activityTable).values({
      type: "screening_complete",
      description: `AI screening complete for ${job.title}: ${shortlisted.length} of ${pendingCandidates.length} candidates shortlisted`,
      jobTitle: job.title,
    });
  }

  res.json({
    screened: pendingCandidates.length,
    shortlisted: shortlisted.length,
    candidates: updatedCandidates,
  });
});

export default router;
