import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { getApiBase } from "@/lib/api-url";

export type Role = "HR" | "Manager" | "Hiring Manager" | null;

interface AuthUser {
  token: string;
  role: Role;
  name: string;
  username: string;
}

interface AuthContextType {
  user: AuthUser | null;
  role: Role;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = "hiring-agent-user";
const BASE = getApiBase();

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed: AuthUser = JSON.parse(stored);
        fetch(`${BASE}/api/auth/verify`, {
          headers: { Authorization: `Bearer ${parsed.token}` },
        })
          .then((r) => r.json())
          .then((data) => {
            if (data.valid) {
              setUser(parsed);
            } else {
              localStorage.removeItem(STORAGE_KEY);
            }
          })
          .catch(() => {
            setUser(parsed);
          })
          .finally(() => setIsLoading(false));
      } catch {
        localStorage.removeItem(STORAGE_KEY);
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`${BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "Login failed" };
      }
      const authUser: AuthUser = {
        token: data.token,
        role: data.role,
        name: data.name,
        username: data.username,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser));
      setUser(authUser);
      return { success: true };
    } catch {
      return { success: false, error: "Network error. Please try again." };
    }
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, role: user?.role ?? null, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
