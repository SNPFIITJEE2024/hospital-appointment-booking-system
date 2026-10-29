import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export type Role = 'patient' | 'admin';

export interface AuthUser {
  role: Role;
  name: string;
  email: string;
  token: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loginAsPatient: () => void;
  loginAsAdmin: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = 'hab_auth_v1';

const PATIENT_USER: AuthUser = {
  role: 'patient',
  name: 'John Doe',
  email: 'john.doe@patient.demo',
  token: btoa(JSON.stringify({ role: 'patient', email: 'john.doe@patient.demo', iat: Date.now() })),
};

const ADMIN_USER: AuthUser = {
  role: 'admin',
  name: 'Dr. Admin',
  email: 'admin@hospital.demo',
  token: btoa(JSON.stringify({ role: 'admin', email: 'admin@hospital.demo', iat: Date.now() })),
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  function persist(u: AuthUser | null) {
    setUser(u);
    if (u) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    else sessionStorage.removeItem(STORAGE_KEY);
  }

  const value: AuthContextValue = {
    user,
    loginAsPatient: () => persist(PATIENT_USER),
    loginAsAdmin: () => persist(ADMIN_USER),
    logout: () => persist(null),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
