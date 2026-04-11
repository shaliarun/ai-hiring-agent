import { create } from 'zustand';

type Role = 'HR' | 'Manager' | 'Hiring Manager' | null;

interface AuthState {
  role: Role;
  setRole: (role: Role) => void;
  logout: () => void;
}

const savedRole = localStorage.getItem('hiring-agent-role') as Role;

export const useAuth = create<AuthState>((set) => ({
  role: savedRole,
  setRole: (role) => {
    if (role) {
      localStorage.setItem('hiring-agent-role', role);
    } else {
      localStorage.removeItem('hiring-agent-role');
    }
    set({ role });
  },
  logout: () => {
    localStorage.removeItem('hiring-agent-role');
    set({ role: null });
  },
}));
