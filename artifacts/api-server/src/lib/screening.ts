import type { Job, Candidate } from "@workspace/db";

const SKILL_SYNONYMS: Record<string, string[]> = {
  "react": ["reactjs", "react.js", "frontend development", "front-end", "spa", "jsx"],
  "node": ["nodejs", "node.js", "server-side javascript", "backend javascript"],
  "python": ["py", "django", "flask", "fastapi"],
  "typescript": ["ts", "typed javascript"],
  "javascript": ["js", "es6", "ecmascript"],
  "aws": ["amazon web services", "cloud", "s3", "ec2", "lambda"],
  "sql": ["postgresql", "postgres", "mysql", "database", "rdbms"],
  "mongodb": ["mongo", "nosql", "document database"],
  "docker": ["containerization", "containers", "kubernetes", "k8s"],
  "machine learning": ["ml", "ai", "deep learning", "neural networks", "tensorflow", "pytorch"],
  "java": ["spring", "spring boot", "jvm"],
  "devops": ["ci/cd", "jenkins", "github actions", "deployment", "infrastructure"],
  "agile": ["scrum", "kanban", "sprint", "jira"],
  "communication": ["verbal communication", "written communication", "presentation"],
  "leadership": ["team lead", "management", "mentoring", "people management"],
};

function normalizeSkill(skill: string): string {
  return skill.toLowerCase().trim();
}

function skillsMatch(candidateSkill: string, requiredSkill: string): boolean {
  const cs = normalizeSkill(candidateSkill);
  const rs = normalizeSkill(requiredSkill);

  if (cs === rs) return true;
  if (cs.includes(rs) || rs.includes(cs)) return true;

  const synonyms = SKILL_SYNONYMS[rs] || [];
  if (synonyms.some(s => cs.includes(s) || s.includes(cs))) return true;

  const candidateSynonyms = SKILL_SYNONYMS[cs] || [];
  if (candidateSynonyms.some(s => s === rs || s.includes(rs) || rs.includes(s))) return true;

  return false;
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
    /\b(bachelor|b\.?s\.?|b\.?e\.?|b\.?tech|master|m\.?s\.?|m\.?e\.?|m\.?tech|phd|ph\.?d|mba|associate)\b/gi,
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

  return {
    name,
    email,
    phone,
    skills,
    experienceYears,
    education,
    location,
  };
}

export interface ScreeningScore {
  matchScore: number;
  matchedSkills: string[];
  rejectionReason: string | null;
  shortlisted: boolean;
}

export function scoreCandidate(candidate: Partial<Candidate>, job: Job): ScreeningScore {
  const candidateSkills = (candidate.skills as string[]) || [];
  const experienceYears = candidate.experienceYears || 0;
  const requiredSkills = (job.requiredSkills as string[]) || [];
  const niceToHaveSkills = (job.niceToHaveSkills as string[]) || [];
  const keywords = (job.keywords as string[]) || [];

  let skillScore = 0;
  const matchedSkills: string[] = [];

  if (requiredSkills.length > 0) {
    let matched = 0;
    for (const required of requiredSkills) {
      const match = candidateSkills.find(cs => skillsMatch(cs, required));
      if (match) {
        matched++;
        matchedSkills.push(required);
      }
    }
    skillScore = (matched / requiredSkills.length) * 100;
  } else {
    skillScore = 60;
  }

  let niceScore = 0;
  if (niceToHaveSkills.length > 0) {
    let niceMatched = 0;
    for (const nice of niceToHaveSkills) {
      if (candidateSkills.find(cs => skillsMatch(cs, nice))) {
        niceMatched++;
      }
    }
    niceScore = (niceMatched / niceToHaveSkills.length) * 100;
  }

  let experienceScore = 0;
  if (job.experienceMin != null || job.experienceMax != null) {
    const min = job.experienceMin ?? 0;
    const max = job.experienceMax ?? 100;
    if (experienceYears >= min && experienceYears <= max) {
      experienceScore = 100;
    } else if (experienceYears < min) {
      const deficit = min - experienceYears;
      experienceScore = Math.max(0, 100 - deficit * 20);
    } else {
      experienceScore = 85;
    }
  } else {
    experienceScore = 70;
  }

  let keywordScore = 0;
  if (keywords.length > 0 && candidate.resumeText) {
    const resumeLower = candidate.resumeText.toLowerCase();
    const matched = keywords.filter(k => resumeLower.includes(k.toLowerCase()));
    keywordScore = (matched.length / keywords.length) * 100;
  } else {
    keywordScore = 50;
  }

  const WEIGHTS = { skills: 0.50, experience: 0.30, education: 0.10, keywords: 0.10 };

  let educationScore = 50;
  if (job.education && candidate.education) {
    const jEd = job.education.toLowerCase();
    const cEd = candidate.education.toLowerCase();
    if (cEd.includes("phd") || cEd.includes("ph.d")) {
      educationScore = 100;
    } else if (cEd.includes("master") || cEd.includes("mba")) {
      educationScore = jEd.includes("master") || jEd.includes("phd") ? 90 : 100;
    } else if (cEd.includes("bachelor") || cEd.includes("b.s") || cEd.includes("b.e")) {
      educationScore = jEd.includes("bachelor") ? 85 : 60;
    } else {
      educationScore = 50;
    }
  }

  const finalScore = Math.round(
    skillScore * WEIGHTS.skills +
    experienceScore * WEIGHTS.experience +
    educationScore * WEIGHTS.education +
    keywordScore * WEIGHTS.keywords
  );

  const clampedScore = Math.min(100, Math.max(0, finalScore));

  let rejectionReason: string | null = null;
  const shortlisted = clampedScore >= 60;

  if (!shortlisted) {
    const reasons: string[] = [];
    if (skillScore < 40) {
      const missingSkills = requiredSkills.filter(rs => !candidateSkills.find(cs => skillsMatch(cs, rs)));
      if (missingSkills.length > 0) {
        reasons.push(`Missing required skills: ${missingSkills.slice(0, 3).join(", ")}`);
      }
    }
    if (job.experienceMin != null && experienceYears < job.experienceMin) {
      reasons.push(`Insufficient experience (${experienceYears}y, required ${job.experienceMin}y+)`);
    }
    if (reasons.length === 0) {
      reasons.push("Overall match score below shortlisting threshold");
    }
    rejectionReason = reasons.join(". ");
  }

  return {
    matchScore: clampedScore,
    matchedSkills,
    rejectionReason,
    shortlisted,
  };
}
