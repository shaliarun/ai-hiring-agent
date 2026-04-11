import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Role = "HR" | "Manager" | "Hiring Manager" | null;

interface AuthContextType {
  role: Role;
  setRole: (role: Role) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role>(() => {
    return (localStorage.getItem("hiring-agent-role") as Role) || null;
  });

  const setRole = (newRole: Role) => {
    if (newRole) {
      localStorage.setItem("hiring-agent-role", newRole);
    } else {
      localStorage.removeItem("hiring-agent-role");
    }
    setRoleState(newRole);
  };

  const logout = () => {
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ role, setRole, logout }}>
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
