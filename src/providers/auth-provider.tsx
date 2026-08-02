"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { endpoints } from "@/lib/api/endpoints";
import { authStorage } from "@/lib/auth/storage";
import type { AuthResponse, User } from "@/types";

type AuthContextValue = { user: User | null; loading: boolean; setSession: (response: AuthResponse) => void; refreshUser: () => Promise<void>; logout: () => Promise<void> };
const AuthContext = createContext<AuthContextValue | null>(null);

const unwrapUser = (data: User | { user: User }) => "user" in data ? data.user : data;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const clear = useCallback(() => { authStorage.clear(); setUser(null); }, []);
  const refreshUser = useCallback(async () => { const data = await endpoints.me(); const next = unwrapUser(data); authStorage.saveUser(next); setUser(next); }, []);

  useEffect(() => {
    const token = authStorage.getToken();
    Promise.resolve().then(async () => {
      if (!token) { setLoading(false); return; }
      setUser(authStorage.getUser());
      try { await refreshUser(); } catch { clear(); } finally { setLoading(false); }
    });
  }, [clear, refreshUser]);
  useEffect(() => {
    const unauthorized = () => { clear(); router.replace("/login?session=expired"); };
    window.addEventListener("barberapp:unauthorized", unauthorized);
    return () => window.removeEventListener("barberapp:unauthorized", unauthorized);
  }, [clear, router]);

  const value = useMemo<AuthContextValue>(() => ({ user, loading, setSession: (response) => { authStorage.save(response.token, response.user); setUser(response.user); }, refreshUser, logout: async () => { try { await endpoints.logout(); } finally { clear(); router.replace("/login"); } } }), [clear, loading, refreshUser, router, user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() { const value = useContext(AuthContext); if (!value) throw new Error("useAuth deve essere usato dentro AuthProvider"); return value; }
