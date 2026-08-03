"use client";

import { AnimatePresence, motion } from "motion/react";
import { Bell, CalendarDays, Home, LogOut, Package, Scissors, UserRound, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/providers/auth-provider";
import { ServiceWorkerRegistration } from "@/components/pwa/service-worker";
import { PushControls } from "@/components/profile/push-panel";
import { FavoritesMenu } from "@/components/products/favorites-menu";
import { BrandLoader } from "@/components/ui/brand-loader";

const items = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/prenota", label: "Prenota", icon: Scissors },
  { href: "/prenotazioni", label: "Agenda", icon: CalendarDays },
  { href: "/prodotti", label: "Prodotti", icon: Package },
  { href: "/profilo", label: "Profilo", icon: UserRound },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [favoritesOpen, setFavoritesOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  useEffect(() => { if (!loading && !user) router.replace("/login"); }, [loading, router, user]);
  useEffect(() => {
    if (!notificationsOpen) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setNotificationsOpen(false); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [notificationsOpen]);

  async function handleLogout() {
    if (!window.confirm("Vuoi uscire dal tuo account?")) return;
    setLoggingOut(true);
    queryClient.clear();
    try { await logout(); } catch { setLoggingOut(false); }
  }

  if (loading || !user) return <BrandLoader label="Prepariamo la tua esperienza" />;

  return <div className="mx-auto min-h-dvh w-full max-w-2xl bg-zinc-950/30 shadow-2xl">
    <ServiceWorkerRegistration />
    <header className="sticky top-0 z-30 bg-zinc-950/75 pt-[env(safe-area-inset-top)] backdrop-blur-2xl">
      <div className="flex h-[4.25rem] items-center justify-between gap-3 px-5">
        <Link href="/home" aria-label="Lama, vai alla home" className="relative h-12 w-32 shrink-0 overflow-hidden"><Image src="/lama-logo-white.png" alt="Lama Barber App" fill sizes="128px" className="scale-[1.7] object-contain drop-shadow-[0_5px_14px_rgba(200,164,91,.14)]" preload /></Link>
        <div className="flex shrink-0 items-center gap-1.5">
          <FavoritesMenu open={favoritesOpen} onOpen={() => { setNotificationsOpen(false); setFavoritesOpen(true); }} onClose={() => setFavoritesOpen(false)} />
          <button onClick={() => { setFavoritesOpen(false); setNotificationsOpen(true); }} aria-label="Attiva o disattiva notifiche" aria-haspopup="dialog" className="grid size-10 place-items-center rounded-full bg-white/[.055] text-zinc-200 shadow-lg transition hover:bg-white/10"><Bell className="size-[1.15rem]" /></button>
          <button onClick={() => void handleLogout()} disabled={loggingOut} aria-label="Esci dall’account" className="grid size-10 place-items-center rounded-full bg-red-400/[.07] text-red-300 shadow-lg transition hover:bg-red-400/15 disabled:opacity-50"><LogOut className="size-[1.15rem]" /></button>
        </div>
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
