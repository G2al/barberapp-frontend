"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { endpoints } from "@/lib/api/endpoints";
import { authStorage } from "@/lib/auth/storage";
import { detachPushOnLogout } from "@/lib/push/notifications";
import type { AuthResponse, User } from "@/types";

type AuthContextValue = { user: User | null; loading: boolean; setSession: (response: AuthResponse) => void; refreshUser: () => Promise<void>; logout: () => Promise<void> };
const AuthContext = createContext<AuthContextValue | null>(null);

const unwrapUser = (data: User | { user: User }) => "user" in data ? data.user : data;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const logoutInProgress = useRef(false);
  const clear = useCallback(() => { authStorage.clear(); setUser(null); }, []);
  const refreshUser = useCallback(async () => { const token = authStorage.getToken(); const data = await endpoints.me(); if (logoutInProgress.current || !token || authStorage.getToken() !== token) return; const next = unwrapUser(data); authStorage.saveUser(next); setUser(next); }, []);

  useEffect(() => {
    const token = authStorage.getToken();
    Promise.resolve().then(async () => {
      if (!token) { setLoading(false); return; }
      setUser(authStorage.getUser());
      try { await refreshUser(); } catch { clear(); } finally { setLoading(false); }
    });
  }, [clear, refreshUser]);
  useEffect(() => {
    const unauthorized = () => { clear(); if (!logoutInProgress.current) router.replace("/login?session=expired"); };
    window.addEventListener("mottolas:unauthorized", unauthorized);
    return () => window.removeEventListener("mottolas:unauthorized", unauthorized);
  }, [clear, router]);

  const logout = useCallback(async () => {
    if (logoutInProgress.current) return;
    logoutInProgress.current = true;
    const token = authStorage.getToken();
    try {
      await detachPushOnLogout();
      if (authStorage.getToken() === token) await endpoints.logout();
    } finally {
      if (!authStorage.getToken() || authStorage.getToken() === token) clear();
      logoutInProgress.current = false;
    }
  }, [clear]);
  const value = useMemo<AuthContextValue>(() => ({ user, loading, setSession: (response) => { authStorage.save(response.token, response.user); setUser(response.user); }, refreshUser, logout }), [loading, logout, refreshUser, user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() { const value = useContext(AuthContext); if (!value) throw new Error("useAuth deve essere usato dentro AuthProvider"); return value; }
