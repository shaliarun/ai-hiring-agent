import { createContext, useContext, useEffect, useState, ReactNode } from "react";

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const trimmed = username.trim();
    const name = trimmed.includes("@")
      ? trimmed.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
      : "HR Admin";
    const authUser: AuthUser = {
      token: `dummy-${Date.now()}`,
      role: "HR",
      name,
      username: trimmed,
    };
    setUser(authUser);
    return { success: true };
  };

  const logout = () => {
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
