"use client";

import { motion } from "motion/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Phone, RefreshCw, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { endpoints } from "@/lib/api/endpoints";
import { apiErrorMessage } from "@/lib/api/client";
import { bookingDate, bookingStatus, fullName, italianDate } from "@/lib/format";
import { queryKeys } from "@/lib/query/keys";
import type { Booking, BookingStatus } from "@/types";
import { AppImage } from "@/components/ui/app-image";
import { Button } from "@/components/ui/button";
import { Card, EmptyState, ErrorState, Input, PageTitle, Skeleton } from "@/components/ui/primitives";

const filters: Array<[string, string]> = [["confirmed", "Confermate"], ["completed", "Completate"], ["cancelled", "Annullate"], ["all", "Tutte"]];

export function BookingsList() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: queryKeys.bookings, queryFn: endpoints.bookings, refetchOnMount: "always" });
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("confirmed");
  const [notice, setNotice] = useState("");
  const cancel = useMutation({ mutationFn: (id: Booking["id"]) => endpoints.cancelBooking(id), onSuccess: async () => { setNotice("Prenotazione annullata: lo slot è stato liberato."); await queryClient.invalidateQueries({ queryKey: queryKeys.bookings, refetchType: "all" }); }, onError: () => setNotice("") });

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
    {notice && <p role="status" className="mt-4 rounded-2xl bg-emerald-400/10 p-3 text-sm text-emerald-200">{notice}</p>}
    {cancel.isError && <p role="alert" className="mt-4 rounded-2xl bg-red-400/10 p-3 text-sm text-red-200">{apiErrorMessage(cancel.error)}</p>}
    {query.isPending ? <div className="mt-5 space-y-3"><Skeleton className="h-44" /><Skeleton className="h-44" /></div> : query.isError ? <div className="mt-5"><ErrorState message={apiErrorMessage(query.error)} retry={() => query.refetch()} /></div> : !data.future.length && !data.past.length ? <div className="mt-5"><EmptyState title="Nessuna prenotazione" description="Non risultano appuntamenti per questo filtro. Prova ad aggiornare oppure scegli un'altra sezione." /></div> : <div className="mt-7 space-y-8">
      {!!data.future.length && <section><div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">Prossimo appuntamento</h2><span className="text-xs text-zinc-500">{data.future.length > 1 ? `+${data.future.length - 1} in programma` : "Il prossimo"}</span></div><div className="space-y-3">{data.future.map((booking, index) => <motion.div key={booking.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .04 }} className={index === 0 ? "rounded-[1.6rem] ring-1 ring-amber-300/25" : ""}><BookingCard booking={booking} canceling={cancel.isPending && cancel.variables === booking.id} onCancel={() => { if (window.confirm("Vuoi annullare questa prenotazione? Lo slot verrà liberato.")) cancel.mutate(booking.id); }} /></motion.div>)}</div></section>}
      {!!data.past.length && <section><h2 className="mb-3 font-semibold text-zinc-400">{filter === "confirmed" ? "Confermate precedenti" : "Storico"}</h2><div className="space-y-3">{data.past.map((booking) => <BookingCard key={booking.id} booking={booking} />)}</div></section>}
    </div>}
  </>;
}

function BookingCard({ booking, onCancel, canceling }: { booking: Booking; onCancel?: () => void; canceling?: boolean }) {
  const future = bookingDate(booking.date, booking.time) >= new Date();
  const active = ["pending", "confirmed"].includes(booking.status);
  const phone = booking.staff?.phone ?? booking.phone;
  const status = booking.status === "no_show" ? "Archiviata" : bookingStatus[booking.status as BookingStatus] ?? booking.status;
  return <Card className="p-4"><div className="flex gap-4"><div className="relative size-16 shrink-0 overflow-hidden rounded-2xl bg-white/5">{booking.staff?.image_url ? <AppImage src={booking.staff.image_url} alt={fullName(booking.staff)} /> : <span className="grid size-full place-items-center text-amber-300"><CalendarDays /></span>}</div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><h3 className="truncate font-semibold">{booking.service?.name ?? "Servizio"}</h3><span className="shrink-0 rounded-full bg-white/5 px-2.5 py-1 text-[10px] text-zinc-300">{status}</span></div><p className="mt-1 text-sm capitalize text-zinc-400">{italianDate(booking.date)} · {booking.time.slice(0, 5)}</p><p className="mt-1 text-xs text-zinc-500">{fullName(booking.staff) || "Staff della barberia"}</p></div></div>{(phone || (future && active)) && <div className="mt-4 flex gap-2">{phone && <a href={`tel:${phone}`} className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-white/5 text-sm"><Phone className="size-4" />Chiama</a>}{future && active && <Button variant="destructive" disabled={canceling} onClick={onCancel} className="h-11 flex-1">{canceling ? "Annullamento…" : "Annulla"}</Button>}</div>}</Card>;
}
