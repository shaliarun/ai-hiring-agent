# AI Hiring Agent

## Overview

AI-powered Employee Hiring Agent system with role-based access (HR, Department Manager, Hiring Manager), resume upload, AI screening engine, and candidate pipeline management.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Auth**: Role-based selection (HR / Manager / Hiring Manager) via localStorage

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Features

1. **Job Criteria Submission** — Department Managers create job postings with required/nice-to-have skills, experience range, education, location, salary
2. **Resume Upload** — HR uploads candidate resumes (text-based) attached to specific jobs
3. **AI Screening Engine** — Semantic skill matching with weighted scoring (Skills 50%, Experience 30%, Education 10%, Keywords 10%)
4. **Shortlisting Dashboard** — Filtered/sorted candidate views with match scores
5. **Hiring Manager Dashboard** — Status management (Pending → Round 1 → Round 2 → Final → Hired/Rejected), interview notes
6. **Export** — CSV export of candidate data
7. **Pipeline Analytics** — Dashboard with pipeline stage breakdown, recent activity feed

## Database Tables

- `jobs` — Job postings with criteria (required skills, experience range, etc.)
- `candidates` — Candidate records with parsed resume data, match scores, status
- `activity` — Audit trail of hiring actions

## Project Structure

- `artifacts/api-server/` — Express API server
- `artifacts/hiring-agent/` — React frontend (Vite)
- `lib/api-spec/` — OpenAPI specification
- `lib/api-client-react/` — Generated React Query hooks
- `lib/api-zod/` — Generated Zod schemas
- `lib/db/` — Database schema (Drizzle ORM)
