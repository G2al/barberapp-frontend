"use client";

import { AnimatePresence, motion } from "motion/react";
import { useMutation, useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import { ArrowLeft, CalendarDays, Check, Clock, Search, Scissors, SunMedium, Sunset, UserRound, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { endpoints } from "@/lib/api/endpoints";
import { apiErrorMessage } from "@/lib/api/client";
import { euro, fullName, italianDate } from "@/lib/format";
import { queryKeys } from "@/lib/query/keys";
import { useBookingStore, type BookingState } from "@/stores/booking-store";
import type { AvailabilityResponse, BookingsResponse, Service } from "@/types";
import { AppImage } from "@/components/ui/app-image";
import { Button } from "@/components/ui/button";
import { Card, EmptyState, ErrorState, PageTitle, Skeleton } from "@/components/ui/primitives";

const dateValue = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const today = () => dateValue(new Date());
const maxDate = () => { const date = new Date(); date.setMonth(date.getMonth() + 6); return dateValue(date); };
const visibleDays = () => Array.from({ length: 14 }, (_, index) => { const date = new Date(); date.setDate(date.getDate() + index); return date; });

export function BookingWizard() {
  const state = useBookingStore();
  const queryClient = useQueryClient();
  const [success, setSuccess] = useState(false);
  const [serviceSearch, setServiceSearch] = useState("");
  const staff = useQuery({ queryKey: queryKeys.staff, queryFn: endpoints.staff });
  const services = useQuery({ queryKey: queryKeys.services(state.staff?.id ?? ""), queryFn: () => endpoints.servicesByStaff(state.staff!.id), enabled: Boolean(state.staff) });
  const slots = useQuery({ queryKey: queryKeys.availability(state.staff?.id ?? "", state.date, state.service?.id ?? ""), queryFn: () => endpoints.availability(state.staff!.id, state.date, state.service!.id), enabled: Boolean(state.staff && state.service && state.date) });
  const create = useMutation({
    mutationFn: () => endpoints.createBooking({ staff_id: state.staff!.id, service_id: state.service!.id, date: state.date, time: state.slot }),
    onSuccess: async (response) => {
      if (response.booking) queryClient.setQueryData<BookingsResponse>(queryKeys.bookings, (current) => ({ bookings: [response.booking!, ...(current?.bookings ?? []).filter((item) => item.id !== response.booking!.id)] }));
      await queryClient.invalidateQueries({ queryKey: queryKeys.bookings, refetchType: "all" });
      state.reset();
      setSuccess(true);
    },
  });

  if (success) return <motion.div initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }} className="py-12 text-center"><span className="mx-auto grid size-20 place-items-center rounded-full bg-emerald-400/10 text-emerald-300"><Check className="size-10" /></span><h1 className="mt-6 text-3xl font-semibold">Prenotazione confermata</h1><p className="mx-auto mt-3 max-w-sm text-zinc-400">Il tuo appuntamento è stato registrato e l’agenda è stata aggiornata.</p><div className="mt-8 grid gap-3"><Link href="/prenotazioni" className="rounded-2xl bg-amber-300 px-5 py-3 font-semibold text-zinc-950">Vai alle prenotazioni</Link><Link href="/home" className="rounded-2xl bg-white/5 px-5 py-3">Torna alla home</Link></div></motion.div>;

  const titles = ["Scegli il professionista", "Scegli il servizio", "Quando vuoi venire?", "Riepilogo prenotazione"];
  const sortedServices = [...(services.data ?? [])].sort((a, b) => Number(b.price ?? -1) - Number(a.price ?? -1));
  const normalizedSearch = serviceSearch.trim().toLocaleLowerCase("it");
  const filteredServices = normalizedSearch
    ? sortedServices.filter((service) => `${service.name} ${service.description ?? ""}`.toLocaleLowerCase("it").includes(normalizedSearch))
    : sortedServices;
  return <>
    <PageTitle eyebrow={`Passaggio ${state.step} di 4`} title={titles[state.step - 1]} description={state.step === 3 ? "Cambia giorno e gli orari si aggiornano subito." : "Pochi passaggi, senza perdere le tue scelte."} />
    <div className="mb-6 grid grid-cols-4 gap-2" aria-label={`Avanzamento: ${state.step} di 4`}>{[1, 2, 3, 4].map((number) => <motion.span key={number} animate={{ opacity: number <= state.step ? 1 : .25 }} className={`h-1 rounded-full ${number <= state.step ? "bg-amber-300" : "bg-white/20"}`} />)}</div>
    {state.step > 1 && <button onClick={() => state.setStep(state.step - 1)} className="mb-4 flex min-h-11 items-center gap-2 text-sm text-zinc-400"><ArrowLeft className="size-4" />Indietro</button>}
    <AnimatePresence mode="wait" initial={false}>
      <motion.div key={state.step} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: .2 }}>
        {state.step === 1 && (staff.isPending ? <GridSkeleton /> : staff.isError ? <ErrorState message={apiErrorMessage(staff.error)} retry={() => staff.refetch()} /> : !staff.data?.length ? <EmptyState title="Nessun professionista disponibile" description="Riprova più tardi o contatta Lama." /> : <div className="grid grid-cols-2 gap-3">{staff.data.map((item, index) => <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .04 }} key={item.id} onClick={() => { setServiceSearch(""); state.setStaff(item); }} className="rounded-[1.75rem] bg-card p-3 text-left shadow-lg ring-1 ring-white/8 transition hover:ring-amber-300/40"><div className="relative aspect-[4/4.3] overflow-hidden rounded-[1.35rem]"><AppImage src={item.image_url} alt={fullName(item)} /></div><p className="mt-3 px-1 font-semibold">{fullName(item)}</p>{item.role && <p className="mt-1 px-1 text-xs text-zinc-500">{item.role}</p>}</motion.button>)}</div>)}
        {state.step === 2 && (services.isPending ? <GridSkeleton /> : services.isError ? <ErrorState message={apiErrorMessage(services.error)} retry={() => services.refetch()} /> : !sortedServices.length ? <EmptyState title="Nessun servizio disponibile" description="Questo professionista non ha servizi prenotabili." /> : <ServiceSelection services={filteredServices} search={serviceSearch} onSearch={setServiceSearch} onSelect={state.setService} />)}
        {state.step === 3 && <DateAndTime state={state} slots={slots} />}
        {state.step === 4 && state.staff && state.service && <><Card className="overflow-hidden p-0"><div className="relative h-48"><AppImage src={state.staff.image_url} alt={fullName(state.staff)} sizes="640px" className="object-cover" /><div className="absolute inset-0 bg-zinc-950/55" /><div className="absolute inset-x-0 bottom-0 p-5"><p className="text-xs uppercase tracking-[.18em] text-amber-300">Il tuo professionista</p><h2 className="mt-1 text-2xl font-semibold">{fullName(state.staff)}</h2></div></div><div className="grid grid-cols-2 gap-px bg-white/5"><SummaryCell icon={<Scissors />} label="Servizio" value={state.service.name} /><SummaryCell icon={<CalendarDays />} label="Data" value={italianDate(state.date, { day: "numeric", month: "long" })} /><SummaryCell icon={<Clock />} label="Orario" value={state.slot.slice(0, 5)} /><SummaryCell icon={<UserRound />} label="Durata e prezzo" value={`${state.service.duration} min · ${euro(state.service.price)}`} /></div></Card>{create.error && <div className="mt-4"><ErrorState message={`${apiErrorMessage(create.error)} Aggiorna gli orari se lo slot non è più libero.`} retry={() => { create.reset(); state.setStep(3); void slots.refetch(); }} /></div>}<Button disabled={create.isPending} onClick={() => create.mutate()} className="mt-5 h-14 w-full rounded-2xl text-base">{create.isPending ? "Conferma in corso…" : "Conferma prenotazione"}</Button></>}
      </motion.div>
    </AnimatePresence>
  </>;
}

function DateAndTime({ state, slots }: { state: BookingState; slots: UseQueryResult<AvailabilityResponse> }) {
  const orderedSlots = [...(slots.data?.slots ?? [])].sort((first, second) => first.localeCompare(second));
  const slotGroups = [
    { label: "Mattina", icon: <SunMedium className="size-4" />, slots: orderedSlots.filter((slot) => Number.parseInt(slot, 10) < 13) },
    { label: "Pomeriggio", icon: <Sunset className="size-4" />, slots: orderedSlots.filter((slot) => Number.parseInt(slot, 10) >= 13) },
  ].filter((group) => group.slots.length);

  return <div>
    <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-3">{visibleDays().map((date) => { const value = dateValue(date); const selected = state.date === value; return <button key={value} onClick={() => state.setDate(value)} className={`flex min-w-[4.1rem] flex-col items-center rounded-[1.35rem] px-3 py-3 transition ${selected ? "bg-amber-300 text-zinc-950 shadow-[0_10px_30px_rgba(252,211,77,.14)]" : "bg-white/[.045] text-zinc-400"}`}><span className="text-[10px] font-semibold uppercase">{new Intl.DateTimeFormat("it-IT", { weekday: "short" }).format(date)}</span><span className="mt-1 text-xl font-semibold">{date.getDate()}</span><span className="text-[10px] uppercase">{new Intl.DateTimeFormat("it-IT", { month: "short" }).format(date)}</span></button>; })}</div>
    <label className="mt-2 flex min-h-12 items-center justify-between rounded-2xl bg-white/[.035] px-4 text-sm text-zinc-400">Altra data<input aria-label="Scegli un’altra data" type="date" min={today()} max={maxDate()} value={state.date} onChange={(event) => event.target.value && state.setDate(event.target.value)} className="bg-transparent text-right text-white [color-scheme:dark]" /></label>
    <div className="mt-7 flex items-center justify-between"><div><p className="font-semibold capitalize">{italianDate(state.date)}</p><p className="mt-1 text-xs text-zinc-500">{slots.data?.service_duration ?? state.service?.duration} minuti</p></div>{slots.isFetching && <span className="size-5 animate-spin rounded-full border-2 border-amber-300 border-t-transparent" />}</div>
    <AnimatePresence mode="wait"><motion.div key={state.date} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="mt-4">{slots.isPending ? <div className="grid grid-cols-3 gap-3"><Skeleton className="h-12" /><Skeleton className="h-12" /><Skeleton className="h-12" /></div> : slots.isError ? <ErrorState message={apiErrorMessage(slots.error)} retry={() => slots.refetch()} /> : !orderedSlots.length ? <EmptyState title="Nessun orario libero" description="Scorri i giorni o scegli un’altra data." /> : <div className="space-y-6">{slotGroups.map((group) => <section key={group.label} aria-labelledby={`slots-${group.label.toLowerCase()}`}><div className="mb-3 flex items-center justify-between"><h3 id={`slots-${group.label.toLowerCase()}`} className="flex items-center gap-2 text-sm font-semibold text-zinc-200"><span className="grid size-8 place-items-center rounded-xl bg-amber-300/10 text-amber-300">{group.icon}</span>{group.label}</h3><span className="text-[10px] text-zinc-600">{group.slots.length} {group.slots.length === 1 ? "orario" : "orari"}</span></div><div className="grid grid-cols-3 gap-3">{group.slots.map((slot, index) => <motion.button initial={{ opacity: 0, scale: .94 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * .025 }} key={slot} onClick={() => state.setSlot(slot)} className="min-h-12 rounded-2xl bg-card font-medium ring-1 ring-white/10 transition hover:bg-amber-300 hover:text-zinc-950">{slot.slice(0, 5)}</motion.button>)}</div></section>)}</div>}</motion.div></AnimatePresence>
  </div>;
}

function ServiceSelection({ services, search, onSearch, onSelect }: { services: Service[]; search: string; onSearch: (value: string) => void; onSelect: (service: Service) => void }) {
  return <div>
    <div role="search" className="relative mb-4">
      <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-zinc-500" aria-hidden />
      <input value={search} onChange={(event) => onSearch(event.target.value)} type="search" inputMode="search" autoComplete="off" aria-label="Cerca un servizio" placeholder="Cerca un servizio…" className="h-13 w-full rounded-2xl border border-white/10 bg-white/[.045] pl-12 pr-12 text-[16px] text-white outline-none transition placeholder:text-zinc-600 focus:border-amber-300/50 focus:ring-4 focus:ring-amber-300/[.07]" />
      {search && <button type="button" onClick={() => onSearch("")} aria-label="Cancella ricerca" className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-xl text-zinc-500 transition hover:bg-white/5 hover:text-white"><X className="size-4" /></button>}
    </div>
    {!services.length ? <EmptyState title="Nessun servizio trovato" description="Prova a modificare il testo della ricerca." /> : <div className="space-y-3">{services.map((item, index) => <motion.button initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .035 }} key={item.id} onClick={() => onSelect(item)} className="flex w-full items-start justify-between rounded-[1.6rem] bg-card p-5 text-left ring-1 ring-white/8 transition hover:ring-amber-300/50"><span><span className="font-semibold">{item.name}</span>{item.description && <span className="mt-1 block text-sm leading-5 text-zinc-400">{item.description}</span>}<span className="mt-3 flex items-center gap-1.5 text-xs text-zinc-500"><Clock className="size-3.5" />{item.duration} min{(item.loyalty_points ?? item.points) != null && ` · ${item.loyalty_points ?? item.points} punti`}</span></span><span className="ml-3 shrink-0 font-semibold text-amber-300">{euro(item.price)}</span></motion.button>)}</div>}
  </div>;
}

function GridSkeleton() { return <div className="grid grid-cols-2 gap-3"><Skeleton className="h-40" /><Skeleton className="h-40" /></div>; }
function SummaryCell({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <div className="bg-card p-4"><span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-zinc-500">{icon}{label}</span><strong className="mt-2 block text-sm leading-5">{value}</strong></div>; }
