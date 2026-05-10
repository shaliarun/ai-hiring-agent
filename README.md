# HiringAgent — AI-Powered HR Hiring Platform

An AI-powered employee hiring platform with role-based access, resume upload/parsing, ChatGPT AI screening, candidate pipeline management, Gmail integration, and hiring analytics.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Local Setup](#local-setup)
- [Environment Variables](#environment-variables)
- [Running the App](#running-the-app)
- [Default Login Credentials](#default-login-credentials)
- [Project Structure](#project-structure)
- [Database](#database)
- [GitHub Setup](#github-setup)
- [Deployment](#deployment)

---

## Features

- **Login & Role-Based Access** — HR Team, Department Manager, Hiring Manager
- **Job Postings** — Create and manage job listings with skill requirements, salary, location
- **Resume Upload** — Drag-and-drop upload (PDF, Word, Excel, PowerPoint); AI auto-extracts name, email, phone
- **AI Screening Engine** — ChatGPT (GPT-5.2) powered resume scoring with weighted criteria (Skills 40%, Experience 25%, Domain Fit 15%, Education 10%, Keywords 10%)
- **Candidate Pipeline** — Status management: Pending → Round 1 → Round 2 → Final → Hired / Rejected
- **Import from Gmail** — Automatically finds resume emails matching a job title and imports attachments
- **Google Drive Backup** — Saves imported resumes into a job-specific Drive folder
- **Email Templates** — Send shortlist, rejection, interview invite, and offer emails directly from the platform
- **Analytics Dashboard** — Pipeline stage breakdown and recent activity feed
- **XLSX Export** — Download candidate data as a spreadsheet
- **Resume Download** — Download original uploaded file in its native format

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite + Tailwind CSS + shadcn/ui |
| Backend | Node.js 24 + Express 5 |
| Database | PostgreSQL + Drizzle ORM |
| AI | OpenAI GPT (via Replit AI Integration) |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Email | Nodemailer + Gmail SMTP |
| Gmail/Drive | Google APIs (googleapis) |
| Monorepo | pnpm workspaces |
| Language | TypeScript 5.9 |

---

## Prerequisites

Make sure the following are installed on your machine:

- **Node.js** v18 or higher (v24 recommended) — [nodejs.org](https://nodejs.org)
- **pnpm** v9 or higher — install with `npm install -g pnpm`
- **PostgreSQL** v14 or higher — [postgresql.org](https://www.postgresql.org/download/)
- **Git** — [git-scm.com](https://git-scm.com)

---

## Local Setup

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/hiring-agent.git
cd hiring-agent
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Set Up Environment Variables

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

Edit `.env` with your configuration (see [Environment Variables](#environment-variables) below).

### 4. Set Up the Database

Create a PostgreSQL database:

```sql
CREATE DATABASE hiring_agent;
```

Then push the schema:

```bash
pnpm --filter @workspace/db run push
```

### 5. Start the Application

Run both the API server and frontend in separate terminals:

**Terminal 1 — API Server:**
```bash
pnpm --filter @workspace/api-server run dev
```
Runs on `http://localhost:8080`

**Terminal 2 — Frontend:**
```bash
pnpm --filter @workspace/hiring-agent run dev
```
Runs on `http://localhost:5173`

Open `http://localhost:5173` in your browser.

---

## Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# ── Database ───────────────────────────────────────────
DATABASE_URL=postgresql://username:password@localhost:5432/hiring_agent

# ── Auth ───────────────────────────────────────────────
SESSION_SECRET=your-super-secret-key-change-this

# ── OpenAI (AI Screening) ──────────────────────────────
# Get from: https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-...

# ── Email (Gmail SMTP) ─────────────────────────────────
# The Gmail address emails are sent FROM
GMAIL_USER=yourname@gmail.com
# App Password (NOT your regular Gmail password)
# Generate at: https://myaccount.google.com/apppasswords
GMAIL_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx

# ── Google OAuth (Gmail Import + Drive) ────────────────
# Create at: https://console.cloud.google.com → APIs & Services → Credentials
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-client-secret
# Set this to your app's URL + /api/gmail/callback
GOOGLE_REDIRECT_URI=http://localhost:8080/api/gmail/callback

# ── Custom Users (optional) ────────────────────────────
# Override default login accounts (JSON array)
# HIRING_USERS=[{"username":"hr@acme.com","password":"Pass@123","role":"HR","name":"HR Admin"}]
```

### Getting a Gmail App Password

1. Go to [myaccount.google.com](https://myaccount.google.com)
2. Security → 2-Step Verification (must be enabled)
3. Security → App passwords
4. Select "Mail" → Generate
5. Copy the 16-character password into `GMAIL_APP_PASSWORD`

### Setting Up Google OAuth (for Gmail Import)

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project
3. Enable **Gmail API** and **Google Drive API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Add Authorized redirect URI: `http://localhost:8080/api/gmail/callback`
7. Copy the Client ID and Client Secret into your `.env`

---

## Running the App

| Command | Description |
|---------|-------------|
| `pnpm install` | Install all dependencies |
| `pnpm --filter @workspace/db run push` | Apply DB schema (run after any schema change) |
| `pnpm --filter @workspace/api-server run dev` | Start API server in dev mode |
| `pnpm --filter @workspace/hiring-agent run dev` | Start frontend in dev mode |
| `pnpm run build` | Build all packages for production |
| `pnpm run typecheck` | Run TypeScript checks across all packages |
| `pnpm --filter @workspace/api-spec run codegen` | Regenerate API hooks from OpenAPI spec |

---

## Default Login Credentials

The platform ships with three default accounts. These can be overridden using the `HIRING_USERS` environment variable.

| Email | Password | Role |
|-------|----------|------|
| `hr@company.com` | `HR@2024` | HR Team |
| `manager@company.com` | `Manager@2024` | Department Manager |
| `hiring@company.com` | `Hiring@2024` | Hiring Manager |

> **Note:** Any email/password will also work for basic access (defaults to HR role).

### Role Permissions

| Feature | HR Team | Dept. Manager | Hiring Manager |
|---------|---------|---------------|----------------|
| Dashboard | ✅ | ✅ | ✅ |
| Job Postings | ✅ | ✅ | ✅ |
| Candidates | ✅ | ✅ | ✅ |
| HR Portal (Upload/Import) | ✅ | ❌ | ❌ |

---

## Project Structure

```
hiring-agent/
├── artifacts/
│   ├── api-server/          # Express API server
│   │   └── src/
│   │       ├── routes/      # API routes (jobs, candidates, auth, gmail)
│   │       └── lib/         # Screening, file parsing, auth helpers
│   ├── hiring-agent/        # React frontend (Vite)
│   │   └── src/
│   │       ├── pages/       # Dashboard, Jobs, Candidates, HR Portal
│   │       ├── components/  # UI components, email dialog, gmail import
│   │       └── lib/         # Auth context, API client
│   └── mockup-sandbox/      # Component preview (dev only)
├── lib/
│   ├── api-spec/            # OpenAPI specification (source of truth)
│   ├── api-client-react/    # Generated React Query hooks
│   ├── api-zod/             # Generated Zod validation schemas
│   └── db/                  # Drizzle ORM schema & migrations
├── scripts/                 # Utility scripts
├── package.json             # Root workspace config
└── pnpm-workspace.yaml      # pnpm workspace definition
```

---

## Database

The app uses **PostgreSQL** with **Drizzle ORM**.

### Schema Tables

| Table | Description |
|-------|-------------|
| `jobs` | Job postings with criteria (skills, salary, location) |
| `candidates` | Candidate records with AI scores, status, resume file |
| `activity` | Audit trail of all hiring actions |

### Applying Schema Changes

After modifying `lib/db/src/schema/`:

```bash
pnpm --filter @workspace/db run push
```

---

## GitHub Setup

### Push to GitHub

```bash
# Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit"

# Create a repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/hiring-agent.git
git branch -M main
git push -u origin main
```

### Clone and Run on Another Machine

```bash
git clone https://github.com/YOUR_USERNAME/hiring-agent.git
cd hiring-agent
pnpm install
cp .env.example .env
# Fill in .env values, then:
pnpm --filter @workspace/db run push
pnpm --filter @workspace/api-server run dev
# In another terminal:
pnpm --filter @workspace/hiring-agent run dev
```

---

## Deployment

### Replit (Recommended)

The project is already configured for Replit deployment. Click **Deploy** in the Replit interface — it handles build, hosting, TLS, and health checks automatically.

### Manual / VPS Deployment

1. Build all packages:
   ```bash
   pnpm run build
   ```

2. Set `NODE_ENV=production` and all required environment variables on your server.

3. Start the API server:
   ```bash
   node --enable-source-maps artifacts/api-server/dist/index.mjs
   ```

4. Serve the built frontend (`artifacts/hiring-agent/dist/`) using **nginx** or any static file server, and proxy `/api` requests to the API server port.

### Nginx Proxy Example

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Serve frontend
    location / {
        root /path/to/hiring-agent/artifacts/hiring-agent/dist;
        try_files $uri $uri/ /index.html;
    }

    # Proxy API
    location /api {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## Troubleshooting

**`pnpm: command not found`**
```bash
npm install -g pnpm
```

**Database connection error**
- Ensure PostgreSQL is running: `pg_ctl status`
- Check `DATABASE_URL` in your `.env` matches your DB credentials

**AI screening returns empty results**
- Verify `OPENAI_API_KEY` is set and has sufficient credits

**Emails not sending**
- Confirm `GMAIL_APP_PASSWORD` is a 16-char App Password, not your Gmail login password
- Make sure 2-Step Verification is enabled on your Google account

**Gmail import not working**
- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set
- Check that the redirect URI in Google Cloud Console exactly matches `GOOGLE_REDIRECT_URI`

---

## License

MIT
