"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { BrandLoader, type BrandLoaderPhase } from "@/components/ui/brand-loader";

export default function Page() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const navigationStarted = useRef(false);
  const [minimumElapsed, setMinimumElapsed] = useState(false);
  const [phase, setPhase] = useState<BrandLoaderPhase>("loading");

  useEffect(() => {
    const timer = window.setTimeout(() => setMinimumElapsed(true), 900);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (loading || !minimumElapsed || navigationStarted.current) return;

    navigationStarted.current = true;
    setPhase("complete");

    const exitTimer = window.setTimeout(() => setPhase("exit"), 320);
    const navigationTimer = window.setTimeout(() => {
      router.replace(user ? "/home" : "/login");
    }, 760);

    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(navigationTimer);
    };
  }, [loading, minimumElapsed, router, user]);

  return <BrandLoader phase={phase} />;
}
