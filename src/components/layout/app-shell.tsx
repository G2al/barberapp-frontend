"use client";

import { AnimatePresence, motion } from "motion/react";
import { Bell, CalendarDays, Home, Package, Scissors, UserRound, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/providers/auth-provider";
import { ServiceWorkerRegistration } from "@/components/pwa/service-worker";
import { PushControls } from "@/components/profile/push-panel";

const items = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/prenota", label: "Prenota", icon: Scissors },
  { href: "/prenotazioni", label: "Agenda", icon: CalendarDays },
  { href: "/prodotti", label: "Prodotti", icon: Package },
  { href: "/profilo", label: "Profilo", icon: UserRound },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  useEffect(() => { if (!loading && !user) router.replace("/login"); }, [loading, router, user]);
  useEffect(() => {
    if (!notificationsOpen) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setNotificationsOpen(false); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [notificationsOpen]);

  if (loading || !user) return <main className="grid min-h-dvh place-items-center"><div className="size-9 animate-spin rounded-full border-2 border-amber-300 border-t-transparent" /><span className="sr-only">Verifica sessione</span></main>;

  return <div className="mx-auto min-h-dvh w-full max-w-2xl bg-zinc-950/30 shadow-2xl">
    <ServiceWorkerRegistration />
    <header className="sticky top-0 z-30 bg-zinc-950/75 pt-[env(safe-area-inset-top)] backdrop-blur-2xl">
      <div className="flex h-[4.25rem] items-center justify-between px-5">
        <Link href="/home" className="flex items-center gap-2.5 text-lg font-semibold tracking-tight"><Scissors className="size-5 text-amber-300" />BarberApp</Link>
        <button onClick={() => setNotificationsOpen(true)} aria-label="Attiva o disattiva notifiche" aria-haspopup="dialog" className="grid size-11 place-items-center rounded-full bg-white/[.055] text-zinc-200 shadow-lg transition hover:bg-white/10"><Bell className="size-5" /></button>
      </div>
    </header>
    <main className="px-5 pb-[calc(7.5rem+env(safe-area-inset-bottom))] pt-5">
      <motion.div key={pathname} initial={{ y: 6 }} animate={{ y: 0 }} transition={{ duration: .16, ease: "easeOut" }}>
        {children}
      </motion.div>
    </main>
    <nav aria-label="Navigazione principale" className="pointer-events-none fixed inset-x-0 bottom-[calc(.75rem+env(safe-area-inset-bottom))] z-40 mx-auto w-[calc(100%-1.5rem)] max-w-[648px]">
      <div className="pointer-events-auto grid h-[4.65rem] grid-cols-5 rounded-[1.8rem] border border-white/10 bg-zinc-900/88 p-1.5 shadow-[0_18px_60px_rgba(0,0,0,.55)] backdrop-blur-2xl">{items.map((item) => { const active = pathname === item.href; const Icon = item.icon; return <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={`relative flex min-w-0 flex-col items-center justify-center gap-1 rounded-[1.35rem] text-[10px] font-medium ${active ? "text-zinc-950" : "text-zinc-500 hover:text-zinc-200"}`}>{active && <motion.span layoutId="nav-active" className="absolute inset-0 rounded-[1.35rem] bg-amber-300" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}<Icon className="relative z-10 size-5" /><span className="relative z-10 max-w-full truncate">{item.label}</span></Link>; })}</div>
    </nav>
    <AnimatePresence>{notificationsOpen && <><motion.button aria-label="Chiudi pannello notifiche" className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setNotificationsOpen(false)} /><motion.section role="dialog" aria-modal="true" aria-labelledby="push-title" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", stiffness: 330, damping: 34 }} className="fixed inset-x-0 bottom-0 z-[60] mx-auto max-w-2xl rounded-t-[2rem] border border-white/10 bg-zinc-900 p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl"><div className="mx-auto mb-5 h-1 w-10 rounded-full bg-white/15" /><div className="mb-5 flex items-start justify-between"><div><p className="text-xs font-semibold uppercase tracking-[.2em] text-amber-300">Preferenze</p><h2 id="push-title" className="mt-1 text-2xl font-semibold">Notifiche</h2></div><button onClick={() => setNotificationsOpen(false)} aria-label="Chiudi" className="grid size-11 place-items-center rounded-full bg-white/5"><X /></button></div><PushControls compact /></motion.section></>}</AnimatePresence>
  </div>;
}
