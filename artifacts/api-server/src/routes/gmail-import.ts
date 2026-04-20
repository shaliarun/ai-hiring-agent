import { Router } from "express";
import { google } from "googleapis";
import { db, jobsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { parseFileBuffer } from "../lib/file-parser";
import {
  getAuthUrl,
  getAuthorizedClient,
  isConfigured,
  loadTokens,
  saveTokens,
} from "../lib/google-auth";

const router = Router();

router.get("/gmail/auth-status", async (_req, res): Promise<void> => {
  const configured = isConfigured();
  const tokens = loadTokens();
  res.json({ configured, connected: !!tokens });
});

router.get("/gmail/auth-url", (_req, res): Promise<void> => {
  if (!isConfigured()) {
    res.status(400).json({ error: "Google OAuth credentials not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET." });
    return Promise.resolve();
  }
  const url = getAuthUrl();
  res.json({ url });
  return Promise.resolve();
});

router.get("/gmail/callback", async (req, res): Promise<void> => {
  const { code, error } = req.query;
  if (error) {
    res.send(`<html><body><h2>Authorization failed: ${error}</h2><p>You can close this tab.</p></body></html>`);
    return;
  }
  if (!code || typeof code !== "string") {
    res.status(400).send("<html><body><h2>No authorization code received.</h2></body></html>");
    return;
  }
  try {
    const client = (await import("../lib/google-auth")).getOAuth2Client();
    const { tokens } = await client.getToken(code);
    saveTokens(tokens);
    res.send(`
      <html>
        <body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#f9fafb;">
          <div style="text-align:center;padding:2rem;border:1px solid #e5e7eb;border-radius:12px;max-width:400px;">
            <div style="font-size:3rem;margin-bottom:1rem;">✅</div>
            <h2 style="margin:0 0 0.5rem;color:#111827;">Gmail Connected!</h2>
            <p style="color:#6b7280;margin:0;">Your Gmail account has been connected successfully. You can close this tab and return to the hiring platform.</p>
            <script>setTimeout(() => window.close(), 2000);</script>
          </div>
        </body>
      </html>
    `);
  } catch (err: any) {
    res.status(500).send(`<html><body><h2>Error: ${err?.message}</h2><p>Please try again.</p></body></html>`);
  }
});

router.post("/gmail/disconnect", (_req, res): void => {
  try {
    const fs = require("fs");
    const path = require("path");
    const tokenFile = path.join(process.cwd(), ".google-token.json");
    if (fs.existsSync(tokenFile)) fs.unlinkSync(tokenFile);
    res.json({ success: true });
  } catch {
    res.json({ success: true });
  }
});

router.post("/gmail/import", async (req, res): Promise<void> => {
  const { jobId } = req.body;

  if (!jobId) {
    res.status(400).json({ error: "jobId is required" });
    return;
  }

  const authClient = await getAuthorizedClient();
  if (!authClient) {
    res.status(401).json({ error: "Not connected to Gmail. Please connect your Google account first." });
    return;
  }

  const [job] = await db.select().from(jobsTable).where(eq(jobsTable.id, parseInt(jobId)));
  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }

  const gmail = google.gmail({ version: "v1", auth: authClient });
  const drive = google.drive({ version: "v3", auth: authClient });

  const jobTitle = job.title || "";
  const keywords = jobTitle.split(/\s+/).filter((w: string) => w.length > 2).join(" OR ");
  const query = `(${keywords}) (resume OR cv OR application OR "job application" OR "applying for") has:attachment`;

  process.stdout.write(`Gmail import: searching with query: ${query}\n`);

  const searchRes = await gmail.users.messages.list({
    userId: "me",
    q: query,
    maxResults: 20,
  });

  const messages = searchRes.data.messages || [];
  process.stdout.write(`Gmail import: found ${messages.length} emails\n`);

  if (messages.length === 0) {
    res.json({ imported: 0, resumes: [], message: `No emails found matching "${job.title}"` });
    return;
  }

  let driveFolderId: string | null = null;
  try {
    const folderName = `${job.title} - Resumes`;
    const existingFolder = await drive.files.list({
      q: `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`,
      fields: "files(id, name)",
    });

    if (existingFolder.data.files && existingFolder.data.files.length > 0) {
      driveFolderId = existingFolder.data.files[0].id!;
    } else {
      const createdFolder = await drive.files.create({
        requestBody: { name: folderName, mimeType: "application/vnd.google-apps.folder" },
        fields: "id",
      });
      driveFolderId = createdFolder.data.id!;
    }
    process.stdout.write(`Gmail import: Drive folder ID: ${driveFolderId}\n`);
  } catch (driveErr: any) {
    process.stderr.write(`Gmail import: Drive folder error: ${driveErr?.message}\n`);
  }

  const parsedResumes: Array<{
    name: string;
    email: string;
    phone: string;
    resumeText: string;
    fileName: string;
    fileData: string;
    fileMime: string;
    emailSubject: string;
    emailFrom: string;
  }> = [];

  const RESUME_MIME_TYPES = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ];

  const seenAttachments = new Set<string>();

  for (const msg of messages) {
    try {
      const fullMsg = await gmail.users.messages.get({
        userId: "me",
        id: msg.id!,
        format: "full",
      });

      const headers = fullMsg.data.payload?.headers || [];
      const subjectHeader = headers.find((h: any) => h.name?.toLowerCase() === "subject");
      const fromHeader = headers.find((h: any) => h.name?.toLowerCase() === "from");
      const emailSubject = subjectHeader?.value || "";
      const emailFrom = fromHeader?.value || "";

      const parts = flattenParts(fullMsg.data.payload);
      const attachmentParts = parts.filter((p: any) =>
        p.filename &&
        p.filename.length > 0 &&
        RESUME_MIME_TYPES.includes(p.mimeType || "")
      );

      for (const part of attachmentParts) {
        const dedupeKey = `${part.filename}-${part.body?.attachmentId}`;
        if (seenAttachments.has(dedupeKey)) continue;
        seenAttachments.add(dedupeKey);

        try {
          const attachmentRes = await gmail.users.messages.attachments.get({
            userId: "me",
            messageId: msg.id!,
            id: part.body!.attachmentId!,
          });

          const base64Data = attachmentRes.data.data!;
          const buffer = Buffer.from(base64Data, "base64url");
          const mimeType = part.mimeType || "application/octet-stream";
          const fileName = part.filename || "resume";

          if (driveFolderId) {
            try {
              const { Readable } = await import("stream");
              await drive.files.create({
                requestBody: { name: fileName, parents: [driveFolderId] },
                media: { mimeType, body: Readable.from(buffer) },
                fields: "id",
              });
            } catch (uploadErr: any) {
              process.stderr.write(`Drive upload error for ${fileName}: ${uploadErr?.message}\n`);
            }
          }

          try {
            const parsed = await parseFileBuffer(buffer, fileName, mimeType);
            parsedResumes.push({
              name: parsed.name || extractNameFromEmail(emailFrom),
              email: parsed.email || extractEmailAddress(emailFrom),
              phone: parsed.phone || "",
              resumeText: parsed.text || "",
              fileName,
              fileData: buffer.toString("base64"),
              fileMime: mimeType,
              emailSubject,
              emailFrom,
            });
          } catch (parseErr: any) {
            process.stderr.write(`Parse error for ${fileName}: ${parseErr?.message}\n`);
          }
        } catch (attachErr: any) {
          process.stderr.write(`Attachment download error: ${attachErr?.message}\n`);
        }
      }
    } catch (msgErr: any) {
      process.stderr.write(`Message fetch error: ${msgErr?.message}\n`);
    }
  }

  res.json({
    imported: parsedResumes.length,
    resumes: parsedResumes,
    driveFolderId,
    message: parsedResumes.length > 0
      ? `Found ${parsedResumes.length} resume(s) from ${messages.length} matching email(s)`
      : `Scanned ${messages.length} emails but found no resume attachments`,
  });
});

function flattenParts(payload: any): any[] {
  if (!payload) return [];
  const parts: any[] = [];
  if (payload.parts) {
    for (const part of payload.parts) {
      parts.push(...flattenParts(part));
    }
  } else {
    parts.push(payload);
  }
  return parts;
}

function extractEmailAddress(from: string): string {
  const match = from.match(/<([^>]+)>/);
  return match ? match[1] : from.trim();
}

function extractNameFromEmail(from: string): string {
  const match = from.match(/^([^<]+)</);
  if (match) return match[1].trim().replace(/^["']|["']$/g, "");
  const email = extractEmailAddress(from);
  return email.split("@")[0].replace(/[._]/g, " ");
}

export default router;
