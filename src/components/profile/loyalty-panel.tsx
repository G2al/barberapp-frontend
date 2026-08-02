"use client";

import { AnimatePresence, motion } from "motion/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, Gift, Scissors, Sparkles, Wifi } from "lucide-react";
import { useState } from "react";
import { endpoints } from "@/lib/api/endpoints";
import { apiErrorMessage } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/keys";
import { fullName } from "@/lib/format";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, ErrorState, Skeleton } from "@/components/ui/primitives";

const levels = [{ name: "Bronze", start: 0, end: 200 }, { name: "Silver", start: 200, end: 500 }, { name: "Gold", start: 500, end: 1000 }, { name: "Platinum", start: 1000, end: 1000 }];

export function LoyaltyPanel() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const query = useQuery({ queryKey: queryKeys.loyalty, queryFn: endpoints.loyalty });
  const redeem = useMutation({ mutationFn: endpoints.redeemReward, onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.loyalty }) });
  if (query.isPending) return <Skeleton className="mt-4 h-56" />;
  if (query.isError) return <div className="mt-4"><ErrorState message={apiErrorMessage(query.error)} retry={() => query.refetch()} /></div>;
  const data = query.data && ("summary" in query.data ? query.data.summary : query.data);
  const points = data?.points_balance ?? data?.balance ?? data?.points ?? 0;
  const computed = levelFor(points);
  const level = data?.level ?? computed.name;
  const progress = computed.end === computed.start ? 100 : Math.min(100, Math.max(0, ((points - computed.start) / (computed.end - computed.start)) * 100));
  const movements = data?.movements ?? data?.transactions ?? [];

  return <div className="mt-3">
    <motion.section whileTap={{ scale: .995 }} className="relative overflow-hidden rounded-[1.75rem] border border-amber-200/20 bg-[#171612] p-5 shadow-[0_24px_70px_rgba(0,0,0,.42)]">
      <div aria-hidden className="absolute -right-12 -top-20 size-56 rounded-full bg-amber-300/[.07] blur-3xl" />
      <div aria-hidden className="absolute inset-0 opacity-[.035]" style={{ backgroundImage: "repeating-linear-gradient(125deg,transparent 0,transparent 8px,#fff 9px,#fff 10px)" }} />
      <div className="relative flex items-start justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-[.25em] text-amber-200/70">BarberApp membership</p><p className="mt-1 text-lg font-semibold tracking-tight">Loyalty Card</p></div><span className="grid size-10 place-items-center rounded-full border border-amber-200/20 text-amber-300"><Scissors className="size-5" /></span></div>
      <div className="relative mt-7 flex items-end justify-between"><div><p className="text-4xl font-semibold tracking-tight text-amber-200">{points}</p><p className="mt-1 text-[10px] uppercase tracking-[.2em] text-zinc-500">Punti disponibili</p></div><div className="text-right"><Wifi className="ml-auto size-5 rotate-90 text-amber-200/60" /><p className="mt-2 text-xs font-semibold uppercase tracking-[.16em] text-amber-200">{level}</p></div></div>
      <div className="relative mt-6"><div className="h-1.5 overflow-hidden rounded-full bg-white/8"><motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: .7, ease: "easeOut" }} className="h-full rounded-full bg-amber-300" /></div><div className="mt-2 flex justify-between text-[10px] text-zinc-600"><span>{computed.name}</span><span>{computed.end === computed.start ? "Livello massimo" : `${computed.end - points} punti al prossimo livello`}</span></div></div>
      <div className="relative mt-6 flex items-end justify-between border-t border-white/8 pt-4"><div><p className="text-[9px] uppercase tracking-[.2em] text-zinc-600">Titolare</p><p className="mt-1 text-sm font-medium uppercase tracking-wider">{fullName(user) || user?.name}</p></div><Sparkles className="size-5 text-amber-300/70" /></div>
    </motion.section>

    <button type="button" aria-expanded={detailsOpen} onClick={() => setDetailsOpen((open) => !open)} className="mt-2 flex min-h-12 w-full items-center justify-between rounded-2xl bg-white/[.035] px-4 text-sm font-medium"><span className="flex items-center gap-2"><Gift className="size-4 text-amber-300" />Premi e movimenti</span><ChevronDown className={`size-4 text-zinc-500 transition-transform ${detailsOpen ? "rotate-180" : ""}`} /></button>
    <AnimatePresence initial={false}>{detailsOpen && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: .2, ease: "easeOut" }} className="overflow-hidden">
      <Card className="mt-2"><h2 className="flex items-center gap-2 font-semibold"><Gift className="size-5 text-amber-300" />Premi disponibili</h2>{data?.rewards?.length ? <div className="mt-5 space-y-3">{data.rewards.map((reward) => <div key={reward.id} className="rounded-2xl bg-white/[.035] p-4"><div className="flex gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-amber-300/10 text-amber-300"><Gift className="size-5" /></span><div className="min-w-0 flex-1"><p className="font-medium">{reward.name ?? reward.title ?? "Premio"}</p>{reward.description && <p className="mt-1 text-xs leading-5 text-zinc-500">{reward.description}</p>}<p className="mt-2 text-xs text-amber-300">{reward.points_required ?? reward.points ?? 0} punti</p></div></div><Button variant="outline" disabled={redeem.isPending || reward.redeemed || reward.available === false} onClick={() => { if (window.confirm("Vuoi riscattare questo premio?")) redeem.mutate(reward.id); }} className="mt-3 w-full rounded-xl">{reward.redeemed ? "Riscattato" : "Riscatta premio"}</Button></div>)}</div> : <p className="mt-5 text-sm text-zinc-500">Nessun premio disponibile al momento.</p>}
        {redeem.data?.code && <p role="status" className="mt-4 rounded-xl bg-emerald-400/10 p-3 text-sm">Codice premio: <strong>{redeem.data.code}</strong></p>}{redeem.isError && <p role="alert" className="mt-4 text-sm text-red-300">{apiErrorMessage(redeem.error)}</p>}
      </Card>
      {!!movements.length && <Card className="mt-2"><h2 className="font-semibold">Movimenti recenti</h2><div className="mt-4 divide-y divide-white/5">{movements.slice(0, 12).map((movement, index) => <div key={index} className="flex items-center justify-between gap-4 py-3"><p className="text-sm text-zinc-400">{movementText(movement)}</p><strong className="text-sm text-amber-300">{movementPoints(movement)}</strong></div>)}</div></Card>}
    </motion.div>}</AnimatePresence>
  </div>;
}

function levelFor(points: number) { return [...levels].reverse().find((item) => points >= item.start) ?? levels[0]; }
function movementText(value: Record<string, unknown>) { for (const key of ["description", "reason", "type", "title"]) if (typeof value[key] === "string") return String(value[key]); return "Movimento loyalty"; }
function movementPoints(value: Record<string, unknown>) { for (const key of ["points", "amount", "value"]) if (typeof value[key] === "number" || typeof value[key] === "string") { const amount = Number(value[key]); return `${amount > 0 ? "+" : ""}${amount}`; } return "—"; }
