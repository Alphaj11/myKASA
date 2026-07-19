"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { api, apiErrorMessage } from "@/lib/api";
import type { User, UserRole } from "@/types";

interface RegisterPayload {
  email: string;
  full_name: string;
  password: string;
  phone?: string;
  role: UserRole;
}

export function homeForRole(role: UserRole): string {
  if (role === "ADMIN") return "/admin";
  if (role === "LOCATAIRE") return "/locataire";
  return "/dashboard";
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = window.localStorage.getItem("localtrack_token");
    if (!token) {
      setIsLoading(false);
      return;
    }
    api
      .get<User>("/api/auth/me")
      .then((res) => setUser(res.data))
      .catch(() => {
        window.localStorage.removeItem("localtrack_token");
      })
      .finally(() => setIsLoading(false));
  }, []);

  function persistSession(token: string, refreshToken: string, userData: User) {
    window.localStorage.setItem("localtrack_token", token);
    window.localStorage.setItem("localtrack_refresh_token", refreshToken);
    setUser(userData);
  }

  async function login(email: string, password: string) {
    const form = new URLSearchParams();
    form.set("username", email);
    form.set("password", password);
    try {
      const res = await api.post("/api/auth/login", form, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      persistSession(res.data.access_token, res.data.refresh_token, res.data.user);
      redirectAfterLogin(res.data.user.role);
    } catch (error) {
      throw new Error(apiErrorMessage(error));
    }
  }

  async function register(payload: RegisterPayload) {
    try {
      const res = await api.post("/api/auth/register", payload);
      persistSession(res.data.access_token, res.data.refresh_token, res.data.user);
      redirectAfterLogin(res.data.user.role);
    } catch (error) {
      throw new Error(apiErrorMessage(error));
    }
  }

  function redirectAfterLogin(role: UserRole) {
    router.push(homeForRole(role));
  }

  function logout() {
    window.localStorage.removeItem("localtrack_token");
    window.localStorage.removeItem("localtrack_refresh_token");
    setUser(null);
    router.push("/login");
  }

  async function refreshUser() {
    const res = await api.get<User>("/api/auth/me");
    setUser(res.data);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
