"use client";

import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { BellRing, Check, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { endpoints } from "@/lib/api/endpoints";
import { enablePushNotifications } from "@/lib/push/notifications";
import { queryKeys } from "@/lib/query/keys";
import { usePushStatus } from "@/hooks/use-push-status";
import type { Id } from "@/types";

const storageKey = (userId: Id) => `mottolas:push-prompt-seen:${userId}`;

export function PushOnboarding({ userId }: { userId: Id }) {
  const config = useQuery({ queryKey: queryKeys.push, queryFn: endpoints.pushConfig });
  const { active, checked, permission, setActive, supported, refresh } = usePushStatus();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const notNowRef = useRef<HTMLButtonElement>(null);

  const markSeen = useCallback(() => {
    try { window.localStorage.setItem(storageKey(userId), "true"); } catch { /* Lo stato locale non è essenziale per il funzionamento push. */ }
  }, [userId]);

  const dismiss = useCallback(() => {
    markSeen();
    setOpen(false);
  }, [markSeen]);

  useEffect(() => {
    if (open || !checked || !supported || active || permission !== "default" || !config.data?.enabled || !config.data.public_key) return;
    try { if (window.localStorage.getItem(storageKey(userId))) return; } catch { return; }
    const timer = window.setTimeout(() => setOpen(true), 650);
    return () => window.clearTimeout(timer);
  }, [active, checked, config.data, open, permission, supported, userId]);

  useEffect(() => {
    if (!open) return;
    notNowRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape" && !pending) dismiss(); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [dismiss, open, pending]);

  async function enable() {
    if (pending || !config.data?.public_key) return;
    setPending(true);
    setError("");
    markSeen();
    try {
      await enablePushNotifications(config.data.public_key);
      await refresh();
      setActive(true);
      setOpen(false);
    } catch (cause) {
      await refresh();
      setError(cause instanceof Error ? cause.message : "Non è stato possibile attivare le notifiche.");
    } finally {
      setPending(false);
    }
  }

  return <AnimatePresence>{open && <div className="fixed inset-0 z-[70] flex items-end justify-center p-3 pb-[calc(.75rem+env(safe-area-inset-bottom))] sm:items-center sm:p-6">
    <motion.div aria-hidden className="absolute inset-0 bg-black/75 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
    <motion.section role="dialog" aria-modal="true" aria-labelledby="push-onboarding-title" aria-describedby="push-onboarding-description" initial={{ opacity: 0, y: 28, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: .98 }} transition={{ type: "spring", stiffness: 340, damping: 30 }} className="relative w-full max-w-sm overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-900 p-6 shadow-[0_28px_90px_rgba(0,0,0,.65)]">
      <div className="absolute inset-x-8 top-0 h-px bg-amber-300/70" />
      <span className="grid size-14 place-items-center rounded-2xl bg-amber-300 text-zinc-950 shadow-[0_12px_35px_rgba(215,212,204,.16)]"><BellRing className="size-7" /></span>
      <p className="mt-5 text-[10px] font-semibold uppercase tracking-[.2em] text-amber-300">Rimani aggiornato</p>
      <h2 id="push-onboarding-title" className="mt-2 text-2xl font-semibold tracking-tight">Attiva le notifiche</h2>
      <p id="push-onboarding-description" className="mt-3 text-sm leading-6 text-zinc-400">Ricevi conferme, aggiornamenti e promemoria dei tuoi appuntamenti da Mottola&apos;s Family.</p>
      <div className="mt-5 space-y-2 text-sm text-zinc-300">
        <p className="flex items-center gap-2"><Check className="size-4 text-amber-300" />Promemoria degli appuntamenti</p>
        <p className="flex items-center gap-2"><ShieldCheck className="size-4 text-amber-300" />Potrai disattivarle in qualsiasi momento</p>
      </div>
      {error && <p role="alert" className="mt-4 rounded-2xl bg-red-400/10 p-3 text-sm text-red-200">{error}</p>}
      <div className="mt-6 grid grid-cols-[.85fr_1.15fr] gap-2.5">
        <button ref={notNowRef} type="button" disabled={pending} onClick={dismiss} className="min-h-12 rounded-2xl bg-white/5 px-4 text-sm font-semibold text-zinc-300 transition hover:bg-white/10 disabled:opacity-50">Non ora</button>
        <button type="button" disabled={pending} onClick={() => void enable()} className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-amber-300 px-4 text-sm font-semibold text-zinc-950 transition hover:bg-amber-200 disabled:opacity-60"><BellRing className={`size-4 ${pending ? "animate-pulse" : ""}`} />{pending ? "Attivazione…" : "Attiva"}</button>
      </div>
    </motion.section>
  </div>}</AnimatePresence>;
}
