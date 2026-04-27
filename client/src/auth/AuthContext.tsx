import React, { createContext, useContext, useMemo, useState } from "react";
import type { Role, User } from "../types";
import { api } from "../lib/api";
import { getAccessToken, getStoredUser, setAccessToken, setStoredUser } from "../lib/storage";

type AuthState = {
  accessToken: string | null;
  user: User | null;
};

type AuthContextValue = AuthState & {
  isAuthenticated: boolean;
  role: Role | null;
  login: (args: { email: string; password: string }) => Promise<void>;
  register: (args: { name: string; email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function toUser(value: unknown): User | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Partial<User>;
  if (!v.id || !v.email || !v.name || !v.role) return null;
  return v as User;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessTokenState] = useState<string | null>(() => getAccessToken());
  const [user, setUserState] = useState<User | null>(() => toUser(getStoredUser()));

  const value = useMemo<AuthContextValue>(() => {
    const isAuthenticated = Boolean(accessToken && user);
    const role = user?.role ?? null;

    async function login(args: { email: string; password: string }) {
      const res = await api.post("/api/auth/login", args);
      const data = res.data as { success: boolean; data?: { accessToken: string; user: User }; message?: string };
      if (!data.success || !data.data) throw new Error(data.message ?? "Login failed");
      setAccessToken(data.data.accessToken);
      setStoredUser(data.data.user);
      setAccessTokenState(data.data.accessToken);
      setUserState(data.data.user);
    }

    async function register(args: { name: string; email: string; password: string }) {
      const res = await api.post("/api/auth/register", args);
      const data = res.data as { success: boolean; data?: { accessToken: string; user: User }; message?: string };
      if (!data.success || !data.data) throw new Error(data.message ?? "Register failed");
      setAccessToken(data.data.accessToken);
      setStoredUser(data.data.user);
      setAccessTokenState(data.data.accessToken);
      setUserState(data.data.user);
    }

    async function logout() {
      try {
        await api.post("/api/auth/logout");
      } finally {
        setAccessToken(null);
        setStoredUser(null);
        setAccessTokenState(null);
        setUserState(null);
      }
    }

    return { accessToken, user, isAuthenticated, role, login, register, logout };
  }, [accessToken, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

