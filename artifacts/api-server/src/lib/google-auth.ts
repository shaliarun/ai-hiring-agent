import { google } from "googleapis";
import fs from "fs";
import path from "path";

const TOKEN_FILE = path.join(process.cwd(), ".google-token.json");

export function getOAuth2Client() {
  const redirectUri = process.env.GOOGLE_REDIRECT_URI ||
    (process.env.REPLIT_DEV_DOMAIN
      ? `https://${process.env.REPLIT_DEV_DOMAIN}/api/gmail/callback`
      : "http://localhost:3000/api/gmail/callback");

  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri,
  );
  return client;
}

export function getAuthUrl(): string {
  const client = getOAuth2Client();
  return client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/drive.file",
    ],
    prompt: "consent",
  });
}

export function saveTokens(tokens: object): void {
  fs.writeFileSync(TOKEN_FILE, JSON.stringify(tokens));
}

export function loadTokens(): Record<string, string> | null {
  if (process.env.GOOGLE_REFRESH_TOKEN) {
    return { refresh_token: process.env.GOOGLE_REFRESH_TOKEN };
  }
  try {
    if (fs.existsSync(TOKEN_FILE)) {
      return JSON.parse(fs.readFileSync(TOKEN_FILE, "utf-8"));
    }
  } catch {
    // ignore
  }
  return null;
}

export async function getAuthorizedClient() {
  const tokens = loadTokens();
  if (!tokens) return null;
  const client = getOAuth2Client();
  client.setCredentials(tokens);
  return client;
}

export function isConfigured(): boolean {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}
