"use client";

import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, MessageCircle, MoreHorizontal, MoreVertical, PlusSquare, Share2, Smartphone } from "lucide-react";
import Image from "next/image";
import { useState, useSyncExternalStore } from "react";

type Browser = "chrome" | "edge" | "safari";

const browsers: { id: Browser; label: string; icon: string }[] = [
  { id: "chrome", label: "Chrome", icon: "/chrome.svg" },
  { id: "edge", label: "Edge", icon: "/edge.svg" },
  { id: "safari", label: "Safari", icon: "/safari.svg" },
];

const guides = {
  chrome: [
    { icon: MoreVertical, text: "Apri il menu con i tre puntini in alto a destra" },
    { icon: Smartphone, text: "Seleziona “Aggiungi alla schermata Home”" },
    { icon: CheckCircle2, text: "Conferma premendo “Aggiungi”" },
  ],
  edge: [
    { icon: MoreHorizontal, text: "Tocca il menu in basso o in alto a destra" },
    { icon: Share2, text: "Seleziona “Condividi”" },
    { icon: Smartphone, text: "Scegli “Aggiungi alla schermata Home”" },
    { icon: CheckCircle2, text: "Conferma premendo “Aggiungi”" },
  ],
  safari: [
    { icon: Share2, text: "Tocca il pulsante “Condividi” in basso al centro" },
    { icon: PlusSquare, text: "Seleziona “Aggiungi alla schermata Home”" },
    { icon: CheckCircle2, text: "Tocca “Aggiungi”" },
  ],
} satisfies Record<Browser, { icon: typeof CheckCircle2; text: string }[]>;

export function InstallGuide() {
  const standalone = useSyncExternalStore(subscribeToDisplayMode, getStandaloneSnapshot, getServerStandaloneSnapshot);
  const detectedBrowser = useSyncExternalStore(emptySubscribe, getBrowserSnapshot, getServerBrowserSnapshot);
  const [manualBrowser, setManualBrowser] = useState<Browser | null>(null);
  const activeBrowser = manualBrowser ?? detectedBrowser;

  if (standalone) return null;

  return <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="install-guide mt-4 rounded-[1.75rem] border border-white/10 bg-zinc-950/90 p-5 shadow-2xl backdrop-blur-sm" aria-labelledby="install-guide-title">
    <header>
      <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-amber-300">Portala sempre con te</p>
      <h2 id="install-guide-title" className="mt-1.5 text-lg font-semibold">Come installare la nostra app</h2>
      <p className="mt-1 text-xs leading-5 text-zinc-400">Con quale browser hai aperto Mottolas Family?</p>
    </header>

    <div role="tablist" aria-label="Scegli il browser" className="mt-4 grid grid-cols-3 gap-2">
      {browsers.map((browser) => {
        const active = activeBrowser === browser.id;
        return <button key={browser.id} id={`browser-tab-${browser.id}`} type="button" role="tab" aria-selected={active} aria-controls={`browser-guide-${browser.id}`} onClick={() => setManualBrowser(browser.id)} className={`flex min-h-11 items-center justify-center gap-2 rounded-xl border px-2 text-xs font-semibold transition ${active ? "border-amber-300/55 bg-amber-300/10 text-white shadow-[0_8px_24px_rgba(0,0,0,.25)]" : "border-white/8 bg-white/[.035] text-zinc-400 hover:bg-white/[.06] hover:text-white"}`}>
          <Image src={browser.icon} alt="" width={20} height={20} className="size-5" />
          {browser.label}
        </button>;
      })}
    </div>

    <AnimatePresence mode="wait" initial={false}>
      <motion.div key={activeBrowser} id={`browser-guide-${activeBrowser}`} role="tabpanel" aria-labelledby={`browser-tab-${activeBrowser}`} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: .16 }} className="mt-4 space-y-2">
        {guides[activeBrowser].map((step, index) => {
          const Icon = step.icon;
          return <div key={step.text} className="flex items-center gap-3 rounded-xl bg-white/[.04] px-3 py-2.5 text-xs font-medium leading-5 text-zinc-300">
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-amber-300/10 text-amber-300"><Icon className="size-4" /></span>
            <span><span className="mr-1 text-amber-300/70">{index + 1}.</span>{step.text}</span>
          </div>;
        })}
      </motion.div>
    </AnimatePresence>

    <div className="mt-4 space-y-2">
      <Faq title="Cos’è un browser?">È l’app che usi per aprire un sito internet, come Safari, Chrome o Edge.</Faq>
      <Faq title="Perché installare da qui?">Mottolas Family è una Progressive Web App: occupa poco spazio, si aggiorna automaticamente e si apre come un’app normale.</Faq>
      <Faq title="La PWA è un’app vera?">Sì. Dopo averla aggiunta alla schermata Home puoi aprirla direttamente come una normale applicazione.</Faq>
      <Faq title="Devo aggiornarla manualmente?">No. La versione più recente viene caricata automaticamente.</Faq>
    </div>

    <div className="mt-4 rounded-2xl border border-emerald-300/15 bg-emerald-400/[.055] p-4">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#25D366] text-zinc-950"><MessageCircle className="size-5" /></span>
        <div className="min-w-0"><p className="text-sm font-semibold">Hai difficoltà?</p><p className="mt-1 text-xs leading-5 text-zinc-400">Contattami su WhatsApp: risolveremo il tuo problema in meno di un secondo.</p></div>
      </div>
      <a href={`https://wa.me/393296430362?text=${encodeURIComponent("Ciao, ho bisogno di aiuto per installare l'app Mottolas Family.")}`} target="_blank" rel="noreferrer" className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 text-sm font-semibold text-zinc-950 transition hover:brightness-105"><MessageCircle className="size-4" />Scrivimi su WhatsApp</a>
    </div>
  </motion.section>;
}

function Faq({ title, children }: { title: string; children: React.ReactNode }) {
  return <details className="group overflow-hidden rounded-xl border border-white/8 bg-white/[.025]">
    <summary className="cursor-pointer px-3 py-2.5 text-xs font-semibold text-amber-200 marker:text-zinc-600">{title}</summary>
    <p className="px-3 pb-3 text-xs leading-5 text-zinc-400">{children}</p>
  </details>;
}

function getStandaloneSnapshot() {
  const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean };
  return navigatorWithStandalone.standalone === true || window.matchMedia("(display-mode: standalone)").matches;
}

function getServerStandaloneSnapshot() { return true; }

function subscribeToDisplayMode(onStoreChange: () => void) {
  const query = window.matchMedia("(display-mode: standalone)");
  query.addEventListener("change", onStoreChange);
  window.addEventListener("pageshow", onStoreChange);
  return () => {
    query.removeEventListener("change", onStoreChange);
    window.removeEventListener("pageshow", onStoreChange);
  };
}

function getBrowserSnapshot(): Browser {
  const userAgent = navigator.userAgent;
  if (/Edg|EdgiOS/i.test(userAgent)) return "edge";
  if (/CriOS|Chrome|Chromium/i.test(userAgent)) return "chrome";
  if (/Safari/i.test(userAgent)) return "safari";
  return "chrome";
}

function getServerBrowserSnapshot(): Browser { return "chrome"; }
function emptySubscribe() { return () => undefined; }
