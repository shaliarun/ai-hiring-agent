import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import multer from "multer";
import { db, candidatesTable, jobsTable, activityTable } from "@workspace/db";
import {
  GetCandidateParams,
  UpdateCandidateParams,
  UpdateCandidateBody,
  DeleteCandidateParams,
  AddCandidateNoteParams,
  AddCandidateNoteBody,
  ListCandidatesQueryParams,
  UploadResumesBody,
} from "@workspace/api-zod";
import { parseResume, scoreCandidate } from "../lib/screening";
import { parseFileBuffer } from "../lib/file-parser";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const router: IRouter = Router();

router.get("/candidates", async (req, res): Promise<void> => {
  const queryParams = ListCandidatesQueryParams.safeParse(req.query);

  let candidates = await db.select().from(candidatesTable).orderBy(candidatesTable.createdAt);
  candidates = candidates.reverse();

  if (queryParams.success) {
    if (queryParams.data.status) {
      candidates = candidates.filter(c => c.status === queryParams.data.status);
    }
    if (queryParams.data.jobId != null) {
      candidates = candidates.filter(c => c.jobId === queryParams.data.jobId);
    }
    if (queryParams.data.shortlisted != null) {
      candidates = candidates.filter(c => c.shortlisted === queryParams.data.shortlisted);
    }
  }

  res.json(candidates);
});

router.get("/candidates/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetCandidateParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [candidate] = await db.select().from(candidatesTable).where(eq(candidatesTable.id, params.data.id));
  if (!candidate) {
    res.status(404).json({ error: "Candidate not found" });
    return;
  }

  res.json(candidate);
});

router.patch("/candidates/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateCandidateParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateCandidateBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [current] = await db.select().from(candidatesTable).where(eq(candidatesTable.id, params.data.id));
  if (!current) {
    res.status(404).json({ error: "Candidate not found" });
    return;
  }

  const [candidate] = await db
    .update(candidatesTable)
    .set(parsed.data)
    .where(eq(candidatesTable.id, params.data.id))
    .returning();

  if (parsed.data.status && parsed.data.status !== current.status) {
    const [job] = await db.select().from(jobsTable).where(eq(jobsTable.id, candidate.jobId));
    const statusLabels: Record<string, string> = {
      round1: "moved to 1st Round",
      round2: "moved to 2nd Round",
      final: "moved to Final Round",
      rejected: "was Rejected",
      hired: "was Hired",
    };
    const label = statusLabels[parsed.data.status];
    if (label) {
      await db.insert(activityTable).values({
        type: "status_change",
        description: `${candidate.name} ${label} for ${job?.title ?? "a job"}`,
        candidateName: candidate.name,
        jobTitle: job?.title,
      });
    }
  }

  res.json(candidate);
});

router.delete("/candidates/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteCandidateParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [candidate] = await db.delete(candidatesTable).where(eq(candidatesTable.id, params.data.id)).returning();
  if (!candidate) {
    res.status(404).json({ error: "Candidate not found" });
    return;
  }

  res.sendStatus(204);
});

router.post("/candidates/:id/notes", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = AddCandidateNoteParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = AddCandidateNoteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [candidate] = await db
    .update(candidatesTable)
    .set({ notes: parsed.data.notes })
    .where(eq(candidatesTable.id, params.data.id))
    .returning();

  if (!candidate) {
    res.status(404).json({ error: "Candidate not found" });
    return;
  }

  res.status(201).json(candidate);
});

router.post("/resumes/upload", async (req, res): Promise<void> => {
  const parsed = UploadResumesBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [job] = await db.select().from(jobsTable).where(eq(jobsTable.id, parsed.data.jobId));
  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }

  const created = [];
  for (const resume of parsed.data.resumes) {
    const parsedResume = parseResume(
      resume.resumeText,
      resume.name,
      resume.email,
      resume.phone ?? undefined,
    );

    const score = scoreCandidate({ ...parsedResume, resumeText: resume.resumeText, skills: parsedResume.skills }, job);

    const [candidate] = await db.insert(candidatesTable).values({
      jobId: parsed.data.jobId,
      name: resume.name,
      email: resume.email,
      phone: resume.phone ?? null,
      skills: parsedResume.skills,
      experienceYears: parsedResume.experienceYears,
      education: parsedResume.education,
      location: parsedResume.location,
      resumeText: resume.resumeText,
      matchScore: score.matchScore,
      matchedSkills: score.matchedSkills,
      rejectionReason: score.rejectionReason,
      shortlisted: score.shortlisted,
      status: "pending",
    }).returning();

    created.push(candidate);
  }

  await db.insert(activityTable).values({
    type: "resumes_uploaded",
    description: `${created.length} resume(s) uploaded for ${job.title}`,
    jobTitle: job.title,
  });

  res.status(201).json(created);
});

router.post("/resumes/parse", upload.array("files", 20), async (req, res): Promise<void> => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      res.status(400).json({ error: "No files uploaded" });
      return;
    }

    const results = [];
    for (const file of files) {
      try {
        const parsed = await parseFileBuffer(file.buffer, file.originalname, file.mimetype);
        results.push(parsed);
      } catch (err) {
        results.push({
          text: "",
          name: "",
          email: "",
          phone: "",
          fileName: file.originalname,
          error: "Failed to parse file",
        });
      }
    }

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: "File parsing failed" });
  }
});

export default router;
