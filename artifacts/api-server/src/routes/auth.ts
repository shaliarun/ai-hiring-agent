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

  const users = getUsers();
  const user = users.find(
    (u) => u.username.toLowerCase() === username.toLowerCase().trim()
  );

  if (!user) {
    res.status(401).json({ error: "Invalid username or password" });
    return;
  }

  let valid = false;
  if (user.password.startsWith("$2")) {
    valid = await bcrypt.compare(password, user.password);
  } else {
    valid = password === user.password;
  }

  if (!valid) {
    res.status(401).json({ error: "Invalid username or password" });
    return;
  }

  const token = jwt.sign(
    { username: user.username, role: user.role, name: user.name },
    getSecret(),
    { expiresIn: "7d" }
  );

  res.json({ token, role: user.role, name: user.name, username: user.username });
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
