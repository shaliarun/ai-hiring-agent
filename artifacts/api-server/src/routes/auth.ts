import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const router = Router();

interface UserAccount {
  username: string;
  password: string;
  role: "HR" | "Manager" | "Hiring Manager";
  name: string;
}

function getUsers(): UserAccount[] {
  if (process.env.HIRING_USERS) {
    try {
      return JSON.parse(process.env.HIRING_USERS);
    } catch {
      process.stderr.write("Invalid HIRING_USERS env var format\n");
    }
  }
  return [
    { username: "hr@company.com", password: "HR@2024", role: "HR", name: "HR Admin" },
    { username: "manager@company.com", password: "Manager@2024", role: "Manager", name: "Department Manager" },
    { username: "hiring@company.com", password: "Hiring@2024", role: "Hiring Manager", name: "Hiring Manager" },
  ];
}

function getSecret(): string {
  return process.env.SESSION_SECRET || "hiring-agent-secret-key";
}

router.post("/auth/login", async (req, res): Promise<void> => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: "Username and password are required" });
    return;
  }

  const trimmed = username.trim();
  const name = trimmed.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());

  const users = getUsers();
  const matchedUser = users.find(
    (u) => u.username.toLowerCase() === trimmed.toLowerCase()
  );

  const role = matchedUser?.role ?? "HR";
  const displayName = matchedUser?.name ?? name;

  const token = jwt.sign(
    { username: trimmed, role, name: displayName },
    getSecret(),
    { expiresIn: "7d" }
  );

  res.json({ token, role, name: displayName, username: trimmed });
});

router.get("/auth/verify", (req, res): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ valid: false });
    return;
  }
  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, getSecret()) as {
      username: string;
      role: string;
      name: string;
    };
    res.json({ valid: true, role: payload.role, name: payload.name, username: payload.username });
  } catch {
    res.status(401).json({ valid: false });
  }
});

export default router;
