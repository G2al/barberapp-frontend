"use client";

import { AnimatePresence, motion } from "motion/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BellRing, CalendarDays, CheckCircle2, Clock3, ListOrdered, Trash2 } from "lucide-react";
import { useState } from "react";
import { apiErrorMessage } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { italianDate } from "@/lib/format";
import { queryKeys } from "@/lib/query/keys";
import type { WaitlistEntry, WaitlistResponse } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, ErrorState, Skeleton } from "@/components/ui/primitives";

export function WaitlistPanel() {
  const queryClient = useQueryClient();
  const [confirmId, setConfirmId] = useState<WaitlistEntry["id"] | null>(null);
  const [notice, setNotice] = useState("");
  const query = useQuery({ queryKey: queryKeys.waitlist, queryFn: endpoints.waitlist, refetchOnMount: "always" });
  const remove = useMutation({
    mutationFn: (id: WaitlistEntry["id"]) => endpoints.leaveWaitlist(id),
    onSuccess: async (response, id) => {
      setConfirmId(null);
      setNotice(response.message || "Iscrizione rimossa dalla lista d’attesa.");
      queryClient.setQueryData<WaitlistResponse>(queryKeys.waitlist, (current) => current ? { ...current, entries: current.entries.filter((entry) => entry.id !== id) } : current);
      await queryClient.invalidateQueries({ queryKey: queryKeys.waitlist, refetchType: "all" });
    },
  });

  if (query.isPending) return <section className="mt-7"><Skeleton className="h-40" /></section>;
  if (query.isError) return <section className="mt-7"><ErrorState message={apiErrorMessage(query.error)} retry={() => query.refetch()} /></section>;
  if (!query.data.entries.length) return null;

  const entries = [...query.data.entries].sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));
  return <section className="mt-7" aria-labelledby="personal-waitlist-title">
    <div className="mb-3 flex items-end justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-[.18em] text-amber-300">Disponibilità</p><h2 id="personal-waitlist-title" className="mt-1 text-lg font-semibold">Le tue liste d’attesa</h2></div><span className="text-xs text-zinc-500">{entries.length} {entries.length === 1 ? "iscrizione" : "iscrizioni"}</span></div>
    <AnimatePresence initial={false}>{notice && <motion.p role="status" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-3 overflow-hidden rounded-2xl bg-emerald-400/10 p-3 text-sm text-emerald-200">{notice}</motion.p>}</AnimatePresence>
    <div className="space-y-3">{entries.map((entry) => { const waiting = entry.status === "waiting"; return <Card key={entry.id} className={`p-4 ${waiting ? "border-amber-300/20 bg-amber-300/[.025]" : "border-emerald-300/20 bg-emerald-300/[.025]"}`}>
      <div className="flex items-start gap-3"><span className={`grid size-11 shrink-0 place-items-center rounded-2xl ${waiting ? "bg-amber-300/10 text-amber-300" : "bg-emerald-400/10 text-emerald-300"}`}>{waiting ? <BellRing className="size-5" /> : <CheckCircle2 className="size-5" />}</span><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><h3 className="truncate font-semibold">{entry.service.name}</h3><span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${waiting ? "bg-amber-300/10 text-amber-200" : "bg-emerald-400/10 text-emerald-300"}`}>{waiting ? "In attesa" : "Assegnata"}</span></div><p className="mt-1 text-xs text-zinc-500">con {entry.staff.name}</p></div></div>
      <div className="mt-4 grid grid-cols-2 gap-2 text-sm"><span className="flex items-center gap-2 rounded-xl bg-white/[.035] p-3 text-zinc-300"><CalendarDays className="size-4 text-amber-300" />{italianDate(entry.date, { day: "numeric", month: "short" })}</span><span className="flex items-center gap-2 rounded-xl bg-white/[.035] p-3 text-zinc-300"><Clock3 className="size-4 text-amber-300" />{entry.time.slice(0, 5)}</span></div>
      {waiting && <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/8 pt-4"><span className="flex items-center gap-2 text-sm text-zinc-400"><ListOrdered className="size-4 text-amber-300" />Posizione <strong className="text-white">{entry.position ?? "—"}</strong></span>{confirmId === entry.id ? <div className="flex gap-2"><button type="button" disabled={remove.isPending} onClick={() => setConfirmId(null)} className="min-h-10 rounded-xl bg-white/5 px-3 text-xs">Annulla</button><Button variant="destructive" disabled={remove.isPending} onClick={() => remove.mutate(entry.id)} className="h-10 rounded-xl px-3 text-xs">{remove.isPending ? "Uscita…" : "Conferma uscita"}</Button></div> : <button type="button" onClick={() => { remove.reset(); setNotice(""); setConfirmId(entry.id); }} className="flex min-h-10 items-center gap-2 rounded-xl bg-red-400/10 px-3 text-xs font-medium text-red-200"><Trash2 className="size-4" />Esci</button>}</div>}
      {!waiting && <p className="mt-4 rounded-xl bg-emerald-400/10 p-3 text-sm leading-5 text-emerald-200">Appuntamento già confermato{entry.booking_id ? ` · prenotazione #${entry.booking_id}` : ""}. Non è necessaria un’altra conferma.</p>}
      {remove.isError && confirmId === entry.id && <p role="alert" className="mt-3 text-sm text-red-300">{apiErrorMessage(remove.error)}</p>}
    </Card>; })}</div>
  </section>;
}
