import type { Job, Candidate } from "@workspace/db";
import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  timeout: 60000,
});

export interface ParsedResume {
  name: string;
  email: string;
  phone?: string;
  skills: string[];
  experienceYears: number | null;
  education: string | null;
  location: string | null;
}

export function parseResume(resumeText: string, name: string, email: string, phone?: string): ParsedResume {
  const skills = extractSkillsFromText(resumeText);
  const experienceYears = extractExperienceFromText(resumeText);

  const educationPatterns = [
    /\b(bachelor|b\.?s\.?|b\.?e\.?|b\.?tech|master|m\.?s\.?|m\.?e\.?|m\.?tech|phd|ph\.?d|mba|associate|diploma)\b/gi,
  ];

  let education: string | null = null;
  for (const pattern of educationPatterns) {
    const match = pattern.exec(resumeText);
    if (match) {
      education = match[0].charAt(0).toUpperCase() + match[0].slice(1).toLowerCase();
      break;
    }
  }

  const locationPattern = /(?:location|based in|from|city)[:\s]+([A-Za-z\s,]+?)(?:\n|$)/i;
  const locationMatch = locationPattern.exec(resumeText);
  const location = locationMatch ? locationMatch[1].trim() : null;

  return { name, email, phone, skills, experienceYears, education, location };
}

export interface ScreeningScore {
  matchScore: number;
  matchedSkills: string[];
  rejectionReason: string | null;
  shortlisted: boolean;
}

export async function scoreCandidateWithAI(candidate: Partial<Candidate>, job: Job): Promise<ScreeningScore> {
  const jobDescription = buildJobContext(job);
  const resumeContent = buildCandidateContext(candidate);

  const systemPrompt = `You are an expert HR recruiter. Evaluate resume vs job posting. Score 0-100.

Scoring weights: Skills Match 40%, Experience Relevance 25%, Domain Fit 15%, Education 10%, Keywords 10%.

Score guide: 80-100=excellent match, 60-79=good match, 40-59=partial match, 0-39=poor match.
Be rigorous: a UX designer for an ML Engineer role scores <30. Relevance > tenure.

Respond ONLY with JSON (no markdown):
{"matchScore":<0-100>,"matchedSkills":[<matched skills>],"reasoning":"<1-2 sentences>","rejectionReason":<null or "reason">}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 8192,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `## Job Posting\n${jobDescription}\n\n## Candidate Resume\n${resumeContent}`,
        },
      ],
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) {
      return fallbackScoring(candidate, job);
    }

    const cleaned = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const parsed = JSON.parse(cleaned);

    const matchScore = Math.min(100, Math.max(0, Math.round(parsed.matchScore || 0)));
    const matchedSkills = Array.isArray(parsed.matchedSkills) ? parsed.matchedSkills : [];
    const shortlisted = matchScore >= 70;
    const rejectionReason = shortlisted ? null : (parsed.rejectionReason || parsed.reasoning || "Overall match score below 70% shortlisting threshold");

    return { matchScore, matchedSkills, rejectionReason, shortlisted };
  } catch (error: any) {
    process.stderr.write(`AI screening error: ${error?.message || error}\n`);
    if (error?.stack) process.stderr.write(`Stack: ${error.stack}\n`);
    return fallbackScoring(candidate, job);
  }
}

function buildJobContext(job: Job): string {
  const parts: string[] = [];
  parts.push(`**Title:** ${job.title}`);
  parts.push(`**Department:** ${job.department}`);
  if (job.description) parts.push(`**Description:** ${job.description}`);
  if (job.location) parts.push(`**Location:** ${job.location}`);

  const reqSkills = (job.requiredSkills as string[]) || [];
  if (reqSkills.length > 0) parts.push(`**Required Skills:** ${reqSkills.join(", ")}`);

  const niceSkills = (job.niceToHaveSkills as string[]) || [];
  if (niceSkills.length > 0) parts.push(`**Nice-to-Have Skills:** ${niceSkills.join(", ")}`);

  const keywords = (job.keywords as string[]) || [];
  if (keywords.length > 0) parts.push(`**Keywords:** ${keywords.join(", ")}`);

  if (job.experienceMin != null || job.experienceMax != null) {
    const range = [job.experienceMin ?? 0, job.experienceMax ?? "∞"].join(" - ");
    parts.push(`**Experience Required:** ${range} years`);
  }
  if (job.education) parts.push(`**Education:** ${job.education}`);
  if (job.salaryMin != null || job.salaryMax != null) {
    parts.push(`**Salary Range:** $${job.salaryMin?.toLocaleString() ?? "?"} - $${job.salaryMax?.toLocaleString() ?? "?"}`);
  }

  return parts.join("\n");
}

function buildCandidateContext(candidate: Partial<Candidate>): string {
  const parts: string[] = [];
  if (candidate.name) parts.push(`**Name:** ${candidate.name}`);
  if (candidate.email) parts.push(`**Email:** ${candidate.email}`);

  const skills = (candidate.skills as string[]) || [];
  if (skills.length > 0) parts.push(`**Listed Skills:** ${skills.join(", ")}`);

  if (candidate.experienceYears != null) parts.push(`**Experience:** ${candidate.experienceYears} years`);
  if (candidate.education) parts.push(`**Education:** ${candidate.education}`);
  if (candidate.location) parts.push(`**Location:** ${candidate.location}`);

  if (candidate.resumeText) {
    const truncated = candidate.resumeText.length > 2000
      ? candidate.resumeText.substring(0, 2000) + "\n[... resume truncated ...]"
      : candidate.resumeText;
    parts.push(`\n**Full Resume Text:**\n${truncated}`);
  }

  return parts.join("\n");
}

function fallbackScoring(candidate: Partial<Candidate>, job: Job): ScreeningScore {
  const candidateSkills = (candidate.skills as string[]) || [];
  const requiredSkills = (job.requiredSkills as string[]) || [];

  const matchedSkills: string[] = [];
  for (const req of requiredSkills) {
    const reqLower = req.toLowerCase();
    if (candidateSkills.some(cs => cs.toLowerCase().includes(reqLower) || reqLower.includes(cs.toLowerCase()))) {
      matchedSkills.push(req);
    }
  }

  const matchScore = requiredSkills.length > 0
    ? Math.round((matchedSkills.length / requiredSkills.length) * 100)
    : 50;

  const shortlisted = matchScore >= 70;
  const rejectionReason = shortlisted ? null : "Insufficient skill match for this position";

  return { matchScore, matchedSkills, rejectionReason, shortlisted };
}

function extractExperienceFromText(text: string): number | null {
  const patterns = [
    /(\d+)\+?\s*years?\s+(?:of\s+)?(?:experience|exp)/gi,
    /(?:experience|exp)[:\s]+(\d+)\+?\s*years?/gi,
    /(\d+)\s*-\s*\d+\s*years?\s+(?:of\s+)?(?:experience|exp)/gi,
  ];

  for (const pattern of patterns) {
    const match = pattern.exec(text);
    if (match) {
      return parseInt(match[1], 10);
    }
  }
  return null;
}

function extractSkillsFromText(text: string): string[] {
  const commonSkills = [
    "react", "reactjs", "node", "nodejs", "python", "javascript", "typescript",
    "java", "c++", "go", "rust", "swift", "kotlin", "aws", "azure", "gcp",
    "sql", "postgresql", "mysql", "mongodb", "redis", "docker", "kubernetes",
    "machine learning", "deep learning", "tensorflow", "pytorch", "scikit-learn",
    "django", "flask", "fastapi", "spring", "express", "nextjs", "vuejs", "angular",
    "html", "css", "tailwind", "graphql", "rest", "microservices", "devops",
    "agile", "scrum", "leadership", "communication", "project management",
    "git", "linux", "bash", "ci/cd", "terraform", "ansible",
    "ux design", "ui design", "figma", "sketch", "adobe xd", "wireframing",
    "prototyping", "design thinking", "user research", "usability testing",
    "accessibility", "responsive design", "design systems", "interaction design",
  ];

  const lower = text.toLowerCase();
  const found: string[] = [];

  for (const skill of commonSkills) {
    if (lower.includes(skill)) {
      found.push(skill.charAt(0).toUpperCase() + skill.slice(1));
    }
  }

  return [...new Set(found)];
}

export { scoreCandidateWithAI as scoreCandidate };
