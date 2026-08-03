"use client";

import { AnimatePresence, motion } from "motion/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Phone, RefreshCw, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { endpoints } from "@/lib/api/endpoints";
import { apiErrorMessage } from "@/lib/api/client";
import { bookingDate, bookingStatus, fullName, italianDate } from "@/lib/format";
import { queryKeys } from "@/lib/query/keys";
import type { Booking, BookingStatus } from "@/types";
import { AppImage } from "@/components/ui/app-image";
import { Button } from "@/components/ui/button";
import { Card, EmptyState, ErrorState, Input, PageTitle, Skeleton } from "@/components/ui/primitives";

const filters: Array<[string, string]> = [["confirmed", "Confermate"], ["completed", "Completate"], ["cancelled", "Annullate"], ["all", "Tutte"]];
const statusThemes: Record<BookingStatus, { card: string; badge: string; photo: string }> = {
  pending: { card: "border-amber-300/20 bg-amber-300/[.025]", badge: "bg-amber-300/12 text-amber-200", photo: "ring-amber-300/25" },
  confirmed: { card: "border-emerald-300/15 bg-emerald-300/[.02]", badge: "bg-emerald-400/12 text-emerald-300", photo: "ring-emerald-300/20" },
  completed: { card: "border-sky-300/15 bg-sky-300/[.02]", badge: "bg-sky-400/12 text-sky-300", photo: "ring-sky-300/20" },
  cancelled: { card: "border-red-300/15 bg-red-300/[.02]", badge: "bg-red-400/12 text-red-300", photo: "ring-red-300/20" },
  no_show: { card: "border-zinc-500/15 bg-zinc-500/[.02]", badge: "bg-zinc-500/15 text-zinc-400", photo: "ring-zinc-500/20" },
};

export function BookingsList() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: queryKeys.bookings, queryFn: endpoints.bookings, refetchOnMount: "always" });
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("confirmed");
  const [notice, setNotice] = useState("");
  const [exitingId, setExitingId] = useState<Booking["id"] | null>(null);
  const cancel = useMutation({
    mutationFn: (id: Booking["id"]) => endpoints.cancelBooking(id),
    onSuccess: (_response, id) => {
      setNotice("Prenotazione annullata: lo slot è stato liberato.");
      const updateBooking = () => {
        queryClient.setQueryData<{ status?: boolean; bookings: Booking[] }>(queryKeys.bookings, (current) => current ? {
          ...current,
          bookings: current.bookings.map((booking) => booking.id === id ? { ...booking, status: "cancelled" } : booking),
        } : current);
        setExitingId(null);
        void queryClient.invalidateQueries({ queryKey: queryKeys.bookings, refetchType: "all" });
      };
      if (filter === "all") updateBooking();
      else {
        setExitingId(id);
        window.setTimeout(updateBooking, 360);
      }
    },
    onError: () => setNotice(""),
  });

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 3800);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const data = useMemo(() => {
    const now = new Date();
    const list = (query.data?.bookings ?? []).filter((booking) => (filter === "all" || booking.status === filter) && `${booking.service?.name ?? ""} ${fullName(booking.staff)}`.toLowerCase().includes(search.toLowerCase()));
    const future = list.filter((booking) => ["pending", "confirmed"].includes(booking.status) && bookingDate(booking.date, booking.time) >= now).sort((a, b) => +bookingDate(a.date, a.time) - +bookingDate(b.date, b.time));
    const futureIds = new Set(future.map((booking) => booking.id));
    const past = list.filter((booking) => !futureIds.has(booking.id)).sort((a, b) => +bookingDate(b.date, b.time) - +bookingDate(a.date, a.time));
    return { future, past };
  }, [filter, query.data, search]);

  return <>
    <div className="flex items-start justify-between gap-4"><PageTitle eyebrow="Agenda" title="Le tue prenotazioni" description="Tutto quello che hai in programma, sempre aggiornato." /><button onClick={() => query.refetch()} disabled={query.isFetching} aria-label="Aggiorna prenotazioni" className="mt-7 grid size-11 shrink-0 place-items-center rounded-full bg-white/5 text-zinc-400"><RefreshCw className={`size-4 ${query.isFetching ? "animate-spin" : ""}`} /></button></div>
    <div className="relative"><Search className="absolute left-4 top-3.5 size-5 text-zinc-500" /><Input value={search} onChange={(event) => setSearch(event.target.value)} aria-label="Cerca prenotazioni" placeholder="Cerca servizio o professionista" className="pl-12" /></div>
    <div className="-mx-5 mt-3 flex gap-2 overflow-x-auto px-5 pb-2">{filters.map(([value, label]) => <button key={value} onClick={() => setFilter(value)} className={`relative min-h-10 shrink-0 overflow-hidden rounded-full px-4 text-xs font-medium ${filter === value ? "text-zinc-950" : "bg-white/[.035] text-zinc-400"}`}>{filter === value && <motion.span layoutId="booking-filter" className="absolute inset-0 bg-amber-300" />}<span className="relative">{label}</span></button>)}</div>
    <AnimatePresence initial={false}>{notice && <motion.p role="status" initial={{ opacity: 0, y: -8, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: .3 }} className="mt-4 overflow-hidden rounded-2xl bg-emerald-400/10 p-3 text-sm text-emerald-200">{notice}</motion.p>}</AnimatePresence>
    {cancel.isError && <p role="alert" className="mt-4 rounded-2xl bg-red-400/10 p-3 text-sm text-red-200">{apiErrorMessage(cancel.error)}</p>}
    {query.isPending ? <div className="mt-5 space-y-3"><Skeleton className="h-44" /><Skeleton className="h-44" /></div> : query.isError ? <div className="mt-5"><ErrorState message={apiErrorMessage(query.error)} retry={() => query.refetch()} /></div> : !data.future.length && !data.past.length ? <div className="mt-5"><EmptyState title="Nessuna prenotazione" description="Non risultano appuntamenti per questo filtro. Prova ad aggiornare oppure scegli un'altra sezione." /></div> : <div className="mt-7 space-y-8">
      {!!data.future.length && <motion.section layout><div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">Prossimo appuntamento</h2><span className="text-xs text-zinc-500">{data.future.length > 1 ? `+${data.future.length - 1} in programma` : "Il prossimo"}</span></div><motion.div layout className="space-y-3"><AnimatePresence initial={false} mode="popLayout">{data.future.map((booking, index) => <motion.div layout key={booking.id} initial={{ opacity: 0, y: 8 }} animate={exitingId === booking.id ? { opacity: 0, x: -24, scale: .97, filter: "blur(3px)" } : { opacity: 1, x: 0, y: 0, scale: 1, filter: "blur(0px)" }} exit={{ opacity: 0, x: -24, scale: .97, filter: "blur(3px)" }} transition={{ duration: .32, delay: exitingId === booking.id ? 0 : index * .025, ease: "easeOut" }}><BookingCard booking={booking} featured={index === 0} canceling={cancel.isPending && cancel.variables === booking.id} onCancel={() => { if (window.confirm("Vuoi annullare questa prenotazione? Lo slot verrà liberato.")) cancel.mutate(booking.id); }} /></motion.div>)}</AnimatePresence></motion.div></motion.section>}
      {!!data.past.length && <motion.section layout><h2 className="mb-3 font-semibold text-zinc-400">{filter === "confirmed" ? "Confermate precedenti" : "Storico"}</h2><motion.div layout className="space-y-3"><AnimatePresence initial={false} mode="popLayout">{data.past.map((booking) => <motion.div layout key={booking.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: .97 }} transition={{ duration: .28 }}><BookingCard booking={booking} /></motion.div>)}</AnimatePresence></motion.div></motion.section>}
    </div>}
  </>;
}

function BookingCard({ booking, featured = false, onCancel, canceling }: { booking: Booking; featured?: boolean; onCancel?: () => void; canceling?: boolean }) {
  const future = bookingDate(booking.date, booking.time) >= new Date();
  const active = ["pending", "confirmed"].includes(booking.status);
  const phone = booking.staff?.phone ?? booking.phone;
  const status = booking.status === "no_show" ? "Archiviata" : bookingStatus[booking.status as BookingStatus] ?? booking.status;
  const theme = statusThemes[booking.status];
  return <Card className={`overflow-hidden p-0 ${featured ? "border-amber-300/30 bg-amber-300/[.045] shadow-[0_18px_55px_rgba(251,191,36,.08)]" : theme.card}`}>
    {featured && <div className="flex items-center justify-between bg-amber-300 px-4 py-2 text-[10px] font-bold uppercase tracking-[.16em] text-zinc-950"><span>Prossimo appuntamento</span><span>{booking.time.slice(0, 5)}</span></div>}
    <div className="p-4">
      <div className="flex gap-4">
        <div className={`relative size-16 shrink-0 overflow-hidden rounded-2xl bg-white/5 ring-1 ${theme.photo} ${booking.status === "cancelled" ? "grayscale opacity-60" : ""}`}>{booking.staff?.image_url ? <AppImage src={booking.staff.image_url} alt={fullName(booking.staff)} /> : <span className="grid size-full place-items-center text-amber-300"><CalendarDays /></span>}</div>
        <div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><h3 className={`truncate font-semibold ${booking.status === "cancelled" ? "text-zinc-400 line-through" : ""}`}>{booking.service?.name ?? "Servizio"}</h3><span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${theme.badge}`}>{status}</span></div><p className={`mt-1 text-sm capitalize ${featured ? "font-medium text-amber-100" : "text-zinc-400"}`}>{italianDate(booking.date)} · {booking.time.slice(0, 5)}</p><p className="mt-1 text-xs text-zinc-500">{fullName(booking.staff) || "Staff Lama"}</p></div>
      </div>
      {(phone || (future && active)) && <div className="mt-4 flex gap-2">{phone && <a href={`tel:${phone}`} className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-white/5 text-sm"><Phone className="size-4" />Chiama</a>}{future && active && <Button variant="destructive" disabled={canceling} onClick={onCancel} className="h-11 flex-1">{canceling ? "Annullamento…" : "Annulla"}</Button>}</div>}
    </div>
  </Card>;
}
