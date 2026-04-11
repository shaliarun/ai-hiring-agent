import { Router, type IRouter } from "express";
import { count, avg, eq, sql } from "drizzle-orm";
import { db, jobsTable, candidatesTable, activityTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  const [jobStats] = await db
    .select({
      totalJobs: count(),
      openJobs: count(sql`CASE WHEN ${jobsTable.status} = 'open' THEN 1 END`),
    })
    .from(jobsTable);

  const [candidateStats] = await db
    .select({
      total: count(),
      shortlisted: count(sql`CASE WHEN ${candidatesTable.shortlisted} = true THEN 1 END`),
      inProgress: count(sql`CASE WHEN ${candidatesTable.status} IN ('round1','round2','final') THEN 1 END`),
      hired: count(sql`CASE WHEN ${candidatesTable.status} = 'hired' THEN 1 END`),
      rejected: count(sql`CASE WHEN ${candidatesTable.status} = 'rejected' THEN 1 END`),
      avgScore: avg(candidatesTable.matchScore),
    })
    .from(candidatesTable);

  res.json({
    totalJobs: Number(jobStats?.totalJobs ?? 0),
    openJobs: Number(jobStats?.openJobs ?? 0),
    totalCandidates: Number(candidateStats?.total ?? 0),
    shortlisted: Number(candidateStats?.shortlisted ?? 0),
    inProgress: Number(candidateStats?.inProgress ?? 0),
    hired: Number(candidateStats?.hired ?? 0),
    rejected: Number(candidateStats?.rejected ?? 0),
    avgMatchScore: candidateStats?.avgScore ? parseFloat(String(candidateStats.avgScore)) : null,
  });
});

router.get("/dashboard/pipeline", async (_req, res): Promise<void> => {
  const stages = [
    { stage: "pending", label: "Pending Review" },
    { stage: "round1", label: "1st Round" },
    { stage: "round2", label: "2nd Round" },
    { stage: "final", label: "Final Round" },
    { stage: "rejected", label: "Rejected" },
    { stage: "hired", label: "Hired" },
  ];

  const counts = await db
    .select({ status: candidatesTable.status, count: count() })
    .from(candidatesTable)
    .groupBy(candidatesTable.status);

  const countMap = new Map(counts.map(c => [c.status, Number(c.count)]));

  const result = stages.map(s => ({
    stage: s.stage,
    label: s.label,
    count: countMap.get(s.stage) ?? 0,
  }));

  res.json(result);
});

router.get("/dashboard/recent-activity", async (_req, res): Promise<void> => {
  const activity = await db
    .select()
    .from(activityTable)
    .orderBy(activityTable.createdAt)
    .limit(20);

  res.json(activity.reverse());
});

export default router;
