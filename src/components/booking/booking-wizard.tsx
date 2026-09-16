"use client";

import { AnimatePresence, motion } from "motion/react";
import { useMutation, useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import { ArrowLeft, BellRing, CalendarDays, Check, Clock, Search, Scissors, SunMedium, Sunset, UserRound, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/providers/auth-provider";
import { adminNoteError, bookingNotePayload, BOOKING_NOTE_MAX } from "@/lib/booking/admin-note";
import { endpoints } from "@/lib/api/endpoints";
import { apiErrorMessage } from "@/lib/api/client";
import { euro, fullName, italianDate } from "@/lib/format";
import { queryKeys } from "@/lib/query/keys";
import { useBookingStore, type BookingState } from "@/stores/booking-store";
import type { AvailabilityResponse, BookingsResponse, Service, WaitlistEntry } from "@/types";
import { AppImage } from "@/components/ui/app-image";
import { Button } from "@/components/ui/button";
import { Card, EmptyState, ErrorState, PageTitle, Skeleton } from "@/components/ui/primitives";

const dateValue = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const today = () => dateValue(new Date());
const maxDate = () => { const date = new Date(); date.setMonth(date.getMonth() + 6); return dateValue(date); };
const visibleDays = () => Array.from({ length: 14 }, (_, index) => { const date = new Date(); date.setDate(date.getDate() + index); return date; });

export function BookingWizard() {
  const { user } = useAuth();
  const state = useBookingStore();
  const queryClient = useQueryClient();
  const [success, setSuccess] = useState(false);
  const [serviceSearch, setServiceSearch] = useState("");
  const [note, setNote] = useState("");
  const [noteReviewed, setNoteReviewed] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);
  const me = useQuery({ queryKey: ["booking-role", user?.id], queryFn: endpoints.me, enabled: !!user, retry: false });
  const verifiedUser = me.data && ("user" in me.data ? me.data.user : me.data);
  const roleReady = me.isSuccess && !me.isError && verifiedUser?.id === user?.id;
  const isAdmin = verifiedUser?.role === "admin";
  const needsNote = isAdmin && (!noteReviewed || !!adminNoteError(note));
  const staff = useQuery({ queryKey: queryKeys.staff, queryFn: endpoints.staff });
  const services = useQuery({ queryKey: queryKeys.services(state.staff?.id ?? ""), queryFn: () => endpoints.servicesByStaff(state.staff!.id), enabled: Boolean(state.staff) });
  const slots = useQuery({ queryKey: queryKeys.availability(state.staff?.id ?? "", state.date, state.service?.id ?? ""), queryFn: () => endpoints.availability(state.staff!.id, state.date, state.service!.id), enabled: Boolean(state.staff && state.service && state.date) });
  const create = useMutation({
    mutationFn: () => {
      if (!roleReady || (isAdmin && !noteReviewed)) throw new Error("Completa i dati prima di confermare.");
      return endpoints.createBooking({ staff_id: state.staff!.id, service_id: state.service!.id, date: state.date, time: state.slot, ...bookingNotePayload(verifiedUser?.role, note) });
    },
    onSuccess: async (response) => {
      if (response.booking) queryClient.setQueryData<BookingsResponse>(queryKeys.bookings, (current) => ({ bookings: [response.booking!, ...(current?.bookings ?? []).filter((item) => item.id !== response.booking!.id)] }));
      await queryClient.invalidateQueries({ queryKey: queryKeys.bookings, refetchType: "all" });
      state.reset();
      setNote(""); setNoteReviewed(false); setNoteError(null);
      setSuccess(true);
    },
  });

  if (success) return <motion.div initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }} className="py-12 text-center"><span className="mx-auto grid size-20 place-items-center rounded-full bg-emerald-400/10 text-emerald-300"><Check className="size-10" /></span><h1 className="mt-6 text-3xl font-semibold">Prenotazione confermata</h1><p className="mx-auto mt-3 max-w-sm text-zinc-400">Il tuo appuntamento è stato registrato e l’agenda è stata aggiornata.</p><div className="mt-8 grid gap-3"><Link href="/prenotazioni" className="rounded-2xl bg-amber-300 px-5 py-3 font-semibold text-zinc-950">Vai alle prenotazioni</Link><Link href="/home" className="rounded-2xl bg-white/5 px-5 py-3">Torna alla home</Link></div></motion.div>;

  const titles = ["Scegli il professionista", "Scegli il servizio", "Quando vuoi venire?", needsNote ? `Ciao ${verifiedUser?.name ?? ""}, per chi stai prenotando?` : "Riepilogo prenotazione"];
  const sortedServices = [...(services.data ?? [])].sort((a, b) => Number(b.price ?? -1) - Number(a.price ?? -1));
  const normalizedSearch = serviceSearch.trim().toLocaleLowerCase("it");
  const filteredServices = normalizedSearch
    ? sortedServices.filter((service) => `${service.name} ${service.description ?? ""}`.toLocaleLowerCase("it").includes(normalizedSearch))
    : sortedServices;
  return <>
    <PageTitle eyebrow={`Passaggio ${state.step} di 4`} title={titles[state.step - 1]} description={state.step === 3 ? "Cambia giorno e gli orari si aggiornano subito." : "Pochi passaggi, senza perdere le tue scelte."} />
    <div className="mb-6 grid grid-cols-4 gap-2" aria-label={`Avanzamento: ${state.step} di 4`}>{[1, 2, 3, 4].map((number) => <motion.span key={number} animate={{ opacity: number <= state.step ? 1 : .25 }} className={`h-1 rounded-full ${number <= state.step ? "bg-amber-300" : "bg-white/20"}`} />)}</div>
    {state.step > 1 && <button disabled={create.isPending} onClick={() => { if (state.step === 4 && isAdmin && noteReviewed) setNoteReviewed(false); else { setNoteReviewed(false); state.setStep(state.step - 1); } }} className="mb-4 flex min-h-11 items-center gap-2 text-sm text-zinc-400"><ArrowLeft className="size-4" />Indietro</button>}
    <AnimatePresence mode="wait" initial={false}>
      <motion.div key={`${state.step}-${state.step === 4 && needsNote ? "note" : "review"}`} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: .2 }}>
        {state.step === 1 && (staff.isPending ? <GridSkeleton /> : staff.isError ? <ErrorState message={apiErrorMessage(staff.error)} retry={() => staff.refetch()} /> : !staff.data?.length ? <EmptyState title="Nessun professionista disponibile" description="Riprova più tardi o contatta Del Piano Luxury." /> : <div className="grid grid-cols-2 gap-3">{staff.data.map((item, index) => <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .04 }} key={item.id} onClick={() => { setServiceSearch(""); state.setStaff(item); }} className="rounded-[1.75rem] bg-card p-3 text-left shadow-lg ring-1 ring-white/8 transition hover:ring-amber-300/40"><div className="relative aspect-[4/4.3] overflow-hidden rounded-[1.35rem]"><AppImage src={item.image_url} alt={fullName(item)} /></div><p className="mt-3 px-1 font-semibold">{fullName(item)}</p>{item.role && <p className="mt-1 px-1 text-xs text-zinc-500">{item.role}</p>}</motion.button>)}</div>)}
        {state.step === 2 && (services.isPending ? <GridSkeleton /> : services.isError ? <ErrorState message={apiErrorMessage(services.error)} retry={() => services.refetch()} /> : !sortedServices.length ? <EmptyState title="Nessun servizio disponibile" description="Questo professionista non ha servizi prenotabili." /> : <ServiceSelection services={filteredServices} search={serviceSearch} onSearch={setServiceSearch} onSelect={state.setService} />)}
        {state.step === 3 && <DateAndTime state={state} slots={slots} />}
        {state.step === 4 && !roleReady && (me.isError ? <ErrorState message="Non è stato possibile verificare il tuo account. Riprova prima di confermare." retry={() => me.refetch()} /> : <Skeleton className="h-40" />)}
        {state.step === 4 && roleReady && needsNote && <Card>
          <form onSubmit={event => { event.preventDefault(); const error = adminNoteError(note); setNoteError(error); if (!error) setNoteReviewed(true); }} className="space-y-4">
            <div><label htmlFor="booking-admin-note" className="mb-2 block font-semibold">Per chi stai prenotando? <span className="text-xs font-normal text-zinc-400">Obbligatorio</span></label>
              <p id="booking-note-help" className="mb-3 text-sm text-zinc-400">Scrivi il nome della persona ed eventuali indicazioni utili. Il testo verrà salvato nelle note della prenotazione.</p>
              <textarea id="booking-admin-note" required rows={4} maxLength={BOOKING_NOTE_MAX} value={note} onChange={event => { setNote(event.target.value); setNoteError(null); setNoteReviewed(false); }} aria-invalid={!!noteError} aria-describedby={`booking-note-help booking-note-count${noteError ? " booking-note-error" : ""}`} placeholder="Es. Mario Rossi, preferisce un taglio corto…" className="w-full resize-y rounded-2xl border border-white/10 bg-white/5 p-4 text-base outline-none focus:border-amber-300" />
              <p id="booking-note-count" className="mt-1 text-right text-xs text-zinc-500">{note.length}/{BOOKING_NOTE_MAX} caratteri</p>
              {noteError && <p id="booking-note-error" role="alert" className="mt-2 text-sm text-red-300">{noteError}</p>}
            </div>
            <Button type="submit" className="h-12 w-full rounded-2xl">Continua al riepilogo</Button>
          </form>
        </Card>}
        {state.step === 4 && roleReady && !needsNote && state.staff && state.service && <><Card className="overflow-hidden p-0"><div className="relative h-48"><AppImage src={state.staff.image_url} alt={fullName(state.staff)} sizes="640px" className="object-cover" /><div className="absolute inset-0 bg-zinc-950/55" /><div className="absolute inset-x-0 bottom-0 p-5"><p className="text-xs uppercase tracking-[.18em] text-amber-300">Il tuo professionista</p><h2 className="mt-1 text-2xl font-semibold">{fullName(state.staff)}</h2></div></div><div className="grid grid-cols-2 gap-px bg-white/5"><SummaryCell icon={<Scissors />} label="Servizio" value={state.service.name} /><SummaryCell icon={<CalendarDays />} label="Data" value={italianDate(state.date, { day: "numeric", month: "long" })} /><SummaryCell icon={<Clock />} label="Orario" value={state.slot.slice(0, 5)} /><SummaryCell icon={<UserRound />} label="Durata e prezzo" value={`${state.service.duration} min · ${euro(state.service.price)}`} /></div>{isAdmin && <div className="border-t border-white/10 p-5"><p className="text-xs uppercase tracking-wider text-amber-300">Per chi stai prenotando</p><p className="mt-2 whitespace-pre-wrap break-words text-sm">{note.trim()}</p><button type="button" disabled={create.isPending} onClick={() => setNoteReviewed(false)} className="mt-3 text-sm text-amber-300 underline">Modifica nota</button></div>}</Card>{create.error && <div className="mt-4"><ErrorState message={`${apiErrorMessage(create.error)} Aggiorna gli orari se lo slot non è più libero.`} retry={() => { create.reset(); state.setStep(3); void slots.refetch(); }} /></div>}<Button disabled={create.isPending || !roleReady || (isAdmin && !!adminNoteError(note))} onClick={() => { if (!create.isPending) create.mutate(); }} className="mt-5 h-14 w-full rounded-2xl text-base">{create.isPending ? "Conferma in corso…" : "Conferma prenotazione"}</Button></>}
      </motion.div>
    </AnimatePresence>
  </>;
}

function DateAndTime({ state, slots }: { state: BookingState; slots: UseQueryResult<AvailabilityResponse> }) {
  const queryClient = useQueryClient();
  const [selectedWaitlistSlot, setSelectedWaitlistSlot] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const orderedSlots = [...(slots.data?.slots ?? [])].sort((first, second) => first.localeCompare(second));
  const waitlistSlots = [...(slots.data?.waitlist_slots ?? [])].sort((first, second) => first.localeCompare(second));
  const personalWaitlist = useQuery({ queryKey: queryKeys.waitlist, queryFn: endpoints.waitlist });
  const joinedTimes = new Set((personalWaitlist.data?.entries ?? []).filter((entry) => entry.status === "waiting" && String(entry.staff.id) === String(state.staff?.id) && String(entry.service.id) === String(state.service?.id) && entry.date === state.date).map((entry) => entry.time.slice(0, 5)));
  const join = useMutation({
    mutationFn: (time: string) => endpoints.joinWaitlist({ staff_id: state.staff!.id, service_id: state.service!.id, date: state.date, time }),
    onSuccess: async (response) => {
      setSelectedWaitlistSlot(null);
      setNotice(response.message || "Sei in lista d’attesa per questo orario.");
      queryClient.setQueryData<{ status?: boolean; entries: WaitlistEntry[] }>(queryKeys.waitlist, (current) => ({ status: true, entries: [response.entry, ...(current?.entries ?? []).filter((entry) => entry.id !== response.entry.id)] }));
      await Promise.all([queryClient.invalidateQueries({ queryKey: queryKeys.waitlist, refetchType: "all" }), slots.refetch()]);
    },
    onError: async (error) => {
      if (typeof error === "object" && error && "status" in error && Number(error.status) === 409) await slots.refetch();
    },
  });

  useEffect(() => {
    if (!selectedWaitlistSlot) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape" && !join.isPending) setSelectedWaitlistSlot(null); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [join.isPending, selectedWaitlistSlot]);
  const slotGroups = [
    { label: "Mattina", icon: <SunMedium className="size-4" />, slots: orderedSlots.filter((slot) => Number.parseInt(slot, 10) < 13) },
    { label: "Pomeriggio", icon: <Sunset className="size-4" />, slots: orderedSlots.filter((slot) => Number.parseInt(slot, 10) >= 13) },
  ].filter((group) => group.slots.length);

  return <div>
    <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-3">{visibleDays().map((date) => { const value = dateValue(date); const selected = state.date === value; return <button key={value} onClick={() => state.setDate(value)} className={`flex min-w-[4.1rem] flex-col items-center rounded-[1.35rem] px-3 py-3 transition ${selected ? "bg-amber-300 text-zinc-950 shadow-[0_10px_30px_rgba(217,165,33,.14)]" : "bg-white/[.045] text-zinc-400"}`}><span className="text-[10px] font-semibold uppercase">{new Intl.DateTimeFormat("it-IT", { weekday: "short" }).format(date)}</span><span className="mt-1 text-xl font-semibold">{date.getDate()}</span><span className="text-[10px] uppercase">{new Intl.DateTimeFormat("it-IT", { month: "short" }).format(date)}</span></button>; })}</div>
    <label className="mt-2 flex min-h-12 items-center justify-between rounded-2xl bg-white/[.035] px-4 text-sm text-zinc-400">Altra data<input aria-label="Scegli un’altra data" type="date" min={today()} max={maxDate()} value={state.date} onChange={(event) => event.target.value && state.setDate(event.target.value)} className="bg-transparent text-right text-white [color-scheme:dark]" /></label>
    <div className="mt-7 flex items-center justify-between"><div><p className="font-semibold capitalize">{italianDate(state.date)}</p><p className="mt-1 text-xs text-zinc-500">{slots.data?.service_duration ?? state.service?.duration} minuti</p></div>{slots.isFetching && <span className="size-5 animate-spin rounded-full border-2 border-amber-300 border-t-transparent" />}</div>
    <AnimatePresence initial={false}>{notice && <motion.p role="status" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-4 rounded-2xl border border-emerald-300/15 bg-emerald-400/10 p-3 text-sm text-emerald-200">{notice}</motion.p>}</AnimatePresence>
    <AnimatePresence mode="wait"><motion.div key={state.date} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="mt-4">{slots.isPending ? <div className="grid grid-cols-3 gap-3"><Skeleton className="h-12" /><Skeleton className="h-12" /><Skeleton className="h-12" /></div> : slots.isError ? <ErrorState message={apiErrorMessage(slots.error)} retry={() => slots.refetch()} /> : !orderedSlots.length && !waitlistSlots.length ? <EmptyState title="Nessun orario disponibile" description="Scorri i giorni o scegli un’altra data." /> : <div className="space-y-7">{!!orderedSlots.length && slotGroups.map((group) => <section key={group.label} aria-labelledby={`slots-${group.label.toLowerCase()}`}><div className="mb-3 flex items-center justify-between"><h3 id={`slots-${group.label.toLowerCase()}`} className="flex items-center gap-2 text-sm font-semibold text-zinc-200"><span className="grid size-8 place-items-center rounded-xl bg-amber-300/10 text-amber-300">{group.icon}</span>{group.label}</h3><span className="text-[10px] text-zinc-600">{group.slots.length} {group.slots.length === 1 ? "orario" : "orari"}</span></div><div className="grid grid-cols-3 gap-3">{group.slots.map((slot, index) => <motion.button initial={{ opacity: 0, scale: .94 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * .025 }} key={slot} onClick={() => state.setSlot(slot)} className="min-h-12 rounded-2xl bg-card font-medium ring-1 ring-white/10 transition hover:bg-amber-300 hover:text-zinc-950">{slot.slice(0, 5)}</motion.button>)}</div></section>)}{!!waitlistSlots.length && <section aria-labelledby="waitlist-slots-title" className="rounded-3xl border border-amber-300/15 bg-amber-300/[.035] p-4"><div className="mb-3 flex items-start gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-amber-300/10 text-amber-300"><BellRing className="size-4" /></span><div><h3 id="waitlist-slots-title" className="text-sm font-semibold">Lista d’attesa</h3><p className="mt-1 text-xs leading-5 text-zinc-400">Questi orari sono occupati. Iscriviti per ricevere automaticamente l’appuntamento se si libera.</p></div></div><div className="grid grid-cols-3 gap-3">{waitlistSlots.map((slot) => { const joined = joinedTimes.has(slot.slice(0, 5)); return <button type="button" key={slot} disabled={joined || join.isPending} onClick={() => { join.reset(); setNotice(""); setSelectedWaitlistSlot(slot); }} className="min-h-12 rounded-2xl border border-amber-300/20 bg-zinc-950/35 px-2 text-sm font-medium text-amber-200 transition hover:border-amber-300/50 disabled:text-zinc-500">{joined ? "In attesa" : slot.slice(0, 5)}</button>; })}</div></section>}</div>}</motion.div></AnimatePresence>
    <AnimatePresence>{selectedWaitlistSlot && <><motion.button type="button" aria-label="Chiudi conferma lista d’attesa" className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} disabled={join.isPending} onClick={() => setSelectedWaitlistSlot(null)} /><motion.section role="dialog" aria-modal="true" aria-labelledby="waitlist-confirm-title" initial={{ opacity: 0, y: 30, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: .98 }} className="fixed inset-x-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-[60] mx-auto max-w-md rounded-[2rem] border border-white/10 bg-zinc-900 p-5 shadow-2xl"><div className="flex items-start justify-between gap-4"><span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-amber-300/10 text-amber-300"><BellRing /></span><button type="button" aria-label="Chiudi" disabled={join.isPending} onClick={() => setSelectedWaitlistSlot(null)} className="grid size-10 place-items-center rounded-full bg-white/5 text-zinc-400"><X className="size-5" /></button></div><h2 id="waitlist-confirm-title" className="mt-5 text-xl font-semibold">Entra in lista d’attesa?</h2><p className="mt-2 text-sm leading-6 text-zinc-400">Se l’orario delle <strong className="text-white">{selectedWaitlistSlot.slice(0, 5)}</strong> si libera, l’appuntamento verrà confermato automaticamente e riceverai una notifica. Non sarà richiesta un’altra conferma.</p>{join.isError && <p role="alert" className="mt-4 rounded-2xl bg-red-400/10 p-3 text-sm text-red-200">{apiErrorMessage(join.error)}</p>}<div className="mt-5 grid grid-cols-2 gap-3"><button type="button" disabled={join.isPending} onClick={() => setSelectedWaitlistSlot(null)} className="min-h-12 rounded-2xl bg-white/5 text-sm font-medium">Annulla</button><Button disabled={join.isPending} onClick={() => join.mutate(selectedWaitlistSlot)} className="h-12 rounded-2xl">{join.isPending ? "Iscrizione…" : "Conferma"}</Button></div></motion.section></>}</AnimatePresence>
  </div>;
}

function ServiceSelection({ services, search, onSearch, onSelect }: { services: Service[]; search: string; onSearch: (value: string) => void; onSelect: (service: Service) => void }) {
  return <div>
    <div role="search" className="relative mb-4">
      <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-zinc-500" aria-hidden />
      <input value={search} onChange={(event) => onSearch(event.target.value)} type="search" inputMode="search" autoComplete="off" aria-label="Cerca un servizio" placeholder="Cerca un servizio…" className="h-13 w-full rounded-2xl border border-white/10 bg-white/[.045] pl-12 pr-12 text-[16px] text-white outline-none transition placeholder:text-zinc-600 focus:border-amber-300/50 focus:ring-4 focus:ring-amber-300/[.07]" />
      {search && <button type="button" onClick={() => onSearch("")} aria-label="Cancella ricerca" className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-xl text-zinc-500 transition hover:bg-white/5 hover:text-white"><X className="size-4" /></button>}
    </div>
    {!services.length ? <EmptyState title="Nessun servizio trovato" description="Prova a modificare il testo della ricerca." /> : <div className="space-y-3">{services.map((item, index) => <motion.button initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .035 }} key={item.id} onClick={() => onSelect(item)} className="flex w-full items-start justify-between rounded-[1.6rem] bg-card p-5 text-left ring-1 ring-white/8 transition hover:ring-amber-300/50"><span><span className="font-semibold">{item.name}</span>{item.description && <span className="mt-1 block text-sm leading-5 text-zinc-400">{item.description}</span>}<span className="mt-3 flex items-center gap-1.5 text-xs text-zinc-500"><Clock className="size-3.5" />{item.duration} min</span></span><span className="ml-3 shrink-0 font-semibold text-amber-300">{euro(item.price)}</span></motion.button>)}</div>}
  </div>;
}

function GridSkeleton() { return <div className="grid grid-cols-2 gap-3"><Skeleton className="h-40" /><Skeleton className="h-40" /></div>; }
function SummaryCell({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <div className="bg-card p-4"><span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-zinc-500">{icon}{label}</span><strong className="mt-2 block text-sm leading-5">{value}</strong></div>; }
