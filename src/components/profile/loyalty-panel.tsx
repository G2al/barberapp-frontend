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

const levels = [{ name: "Bronze", start: 0, end: 500 }, { name: "Silver", start: 500, end: 1000 }, { name: "Gold", start: 1000, end: 2000 }, { name: "Platinum", start: 2000, end: 2000 }];

export function LoyaltyPanel() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const query = useQuery({ queryKey: queryKeys.loyalty, queryFn: endpoints.loyalty, refetchOnMount: "always" });
  const redeem = useMutation({ mutationFn: endpoints.redeemReward, onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: queryKeys.loyalty }); } });
  if (query.isPending) return <Skeleton className="mt-4 h-56" />;
  if (query.isError) return <div className="mt-4"><ErrorState message={apiErrorMessage(query.error)} retry={() => query.refetch()} /></div>;

  const data = query.data;
  const points = Number(data.balance ?? 0);
  const lifetimePoints = Number(data.lifetime_points ?? 0);
  const computed = levelFor(lifetimePoints);
  const progress = computed.end === computed.start ? 100 : Math.min(100, Math.max(0, ((lifetimePoints - computed.start) / (computed.end - computed.start)) * 100));

  return <div className="mt-3">
    <motion.section whileTap={{ scale: .995 }} className="relative overflow-hidden rounded-[1.75rem] border border-amber-200/20 bg-[#171612] p-5 shadow-[0_24px_70px_rgba(0,0,0,.42)]">
      <div aria-hidden className="absolute -right-12 -top-20 size-56 rounded-full bg-amber-300/[.07] blur-3xl" />
      <div className="relative flex items-start justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-[.25em] text-amber-200/70">Lama membership</p><p className="mt-1 text-lg font-semibold tracking-tight">Loyalty Card</p></div><span className="grid size-10 place-items-center rounded-full border border-amber-200/20 text-amber-300"><Scissors className="size-5" /></span></div>
      <div className="relative mt-7 flex items-end justify-between"><div><p className="text-4xl font-semibold tracking-tight text-amber-200">{points}</p><p className="mt-1 text-[10px] uppercase tracking-[.2em] text-zinc-500">Punti disponibili</p></div><div className="text-right"><Wifi className="ml-auto size-5 rotate-90 text-amber-200/60" /><p className="mt-2 text-xs font-semibold uppercase tracking-[.16em] text-amber-200">{computed.name}</p><p className="mt-1 text-[9px] text-zinc-600">{lifetimePoints} guadagnati</p></div></div>
      <div className="relative mt-6"><div className="h-1.5 overflow-hidden rounded-full bg-white/8"><motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: .7, ease: "easeOut" }} className="h-full rounded-full bg-amber-300" /></div><div className="mt-2 flex justify-between text-[10px] text-zinc-600"><span>{computed.name}</span><span>{computed.end === computed.start ? "Livello massimo" : `${computed.end - lifetimePoints} punti al prossimo livello`}</span></div></div>
      <div className="relative mt-6 flex items-end justify-between border-t border-white/8 pt-4"><div><p className="text-[9px] uppercase tracking-[.2em] text-zinc-600">Titolare</p><p className="mt-1 text-sm font-medium uppercase tracking-wider">{fullName(user) || user?.name}</p></div><Sparkles className="size-5 text-amber-300/70" /></div>
    </motion.section>

    <button type="button" aria-expanded={detailsOpen} onClick={() => setDetailsOpen((open) => !open)} className="mt-2 flex min-h-12 w-full items-center justify-between rounded-2xl bg-white/[.035] px-4 text-sm font-medium"><span className="flex items-center gap-2"><Gift className="size-4 text-amber-300" />Premi e movimenti{data.available_rewards_count > 0 && <span className="rounded-full bg-amber-300 px-2 py-0.5 text-[10px] text-zinc-950">{data.available_rewards_count}</span>}</span><ChevronDown className={`size-4 text-zinc-500 transition-transform ${detailsOpen ? "rotate-180" : ""}`} /></button>
    <AnimatePresence initial={false}>{detailsOpen && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: .2, ease: "easeOut" }} className="overflow-hidden">
      {data.next_reward && <Card className="mt-2 border-amber-300/15 bg-amber-300/[.025]"><p className="text-[10px] font-semibold uppercase tracking-[.18em] text-amber-300">Prossimo premio</p><div className="mt-2 flex items-end justify-between gap-4"><div><h2 className="font-semibold">{data.next_reward.name}</h2><p className="mt-1 text-xs text-zinc-500">Mancano {data.next_reward.points_missing} punti</p></div><strong className="text-sm text-amber-200">{data.next_reward.progress}%</strong></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/8"><div className="h-full rounded-full bg-amber-300" style={{ width: `${Math.min(100, data.next_reward.progress)}%` }} /></div></Card>}
      <Card className="mt-2"><h2 className="flex items-center gap-2 font-semibold"><Gift className="size-5 text-amber-300" />Premi disponibili</h2>{data.rewards.length ? <div className="mt-5 space-y-3">{data.rewards.map((reward) => <div key={reward.id} className="rounded-2xl bg-white/[.035] p-4"><div className="flex gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-amber-300/10 text-amber-300"><Gift className="size-5" /></span><div className="min-w-0 flex-1"><p className="font-medium">{reward.title}</p>{reward.description && <p className="mt-1 text-xs leading-5 text-zinc-500">{reward.description}</p>}<p className="mt-2 text-xs text-amber-300">{reward.points_cost} punti</p>{reward.expires_at && <p className="mt-1 text-[10px] text-zinc-600">Scade il {new Intl.DateTimeFormat("it-IT").format(new Date(reward.expires_at))}</p>}</div></div><Button variant="outline" disabled={redeem.isPending || reward.status !== "available"} onClick={() => { if (window.confirm("Vuoi segnare questo premio come utilizzato?")) redeem.mutate(reward.id); }} className="mt-3 w-full rounded-xl">{redeem.isPending && redeem.variables === reward.id ? "Riscatto…" : "Usa premio"}</Button></div>)}</div> : <p className="mt-5 text-sm text-zinc-500">Nessun premio disponibile al momento.</p>}
        {redeem.data?.reward.code && <p role="status" className="mt-4 rounded-xl bg-emerald-400/10 p-3 text-sm">Codice premio: <strong>{redeem.data.reward.code}</strong></p>}{redeem.isError && <p role="alert" className="mt-4 text-sm text-red-300">{apiErrorMessage(redeem.error)}</p>}
      </Card>
      {!!data.transactions.length && <Card className="mt-2"><h2 className="font-semibold">Movimenti recenti</h2><div className="mt-4 divide-y divide-white/5">{data.transactions.slice(0, 12).map((movement) => <div key={movement.id} className="flex items-center justify-between gap-4 py-3"><div><p className="text-sm text-zinc-400">{movement.description || movement.service || "Movimento loyalty"}</p>{movement.created_at && <p className="mt-1 text-[10px] text-zinc-600">{new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "short", year: "numeric" }).format(new Date(movement.created_at))}</p>}</div><strong className={`text-sm ${movement.points >= 0 ? "text-emerald-300" : "text-red-300"}`}>{movement.points > 0 ? "+" : ""}{movement.points}</strong></div>)}</div></Card>}
      {!!data.rules.length && <Card className="mt-2"><h2 className="font-semibold">Traguardi</h2><div className="mt-4 space-y-4">{data.rules.map((rule) => <div key={rule.id}><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-medium">{rule.reward_title}</p><p className="mt-1 text-xs text-zinc-500">{rule.current} di {rule.target}{rule.service ? ` · ${rule.service}` : ""}</p></div><span className="text-xs font-semibold text-amber-300">{rule.progress}%</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/8"><div className="h-full rounded-full bg-amber-300/75" style={{ width: `${Math.min(100, rule.progress)}%` }} /></div></div>)}</div></Card>}
    </motion.div>}</AnimatePresence>
  </div>;
}

function levelFor(points: number) { return [...levels].reverse().find((item) => points >= item.start) ?? levels[0]; }
