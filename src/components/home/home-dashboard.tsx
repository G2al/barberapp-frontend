"use client";

import { motion } from "motion/react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CalendarDays, Clock3, MapPin, Package, Phone, Sparkles } from "lucide-react";
import Link from "next/link";
import { endpoints } from "@/lib/api/endpoints";
import { apiErrorMessage } from "@/lib/api/client";
import { bookingDate, fullName, italianDate } from "@/lib/format";
import { queryKeys } from "@/lib/query/keys";
import { useAuth } from "@/providers/auth-provider";
import { AppImage } from "@/components/ui/app-image";
import { Card, ErrorState, PageTitle, Skeleton } from "@/components/ui/primitives";

export function HomeDashboard() {
  const { user } = useAuth();
  const bookings = useQuery({ queryKey: queryKeys.bookings, queryFn: endpoints.bookings, refetchOnMount: "always" });
  const loyalty = useQuery({ queryKey: queryKeys.loyalty, queryFn: endpoints.loyalty, refetchOnMount: "always" });
  const config = useQuery({ queryKey: queryKeys.config, queryFn: endpoints.config });
  const now = new Date();
  const next = bookings.data?.bookings.filter((booking) => ["pending", "confirmed"].includes(booking.status) && bookingDate(booking.date, booking.time) >= now).sort((first, second) => +bookingDate(first.date, first.time) - +bookingDate(second.date, second.time))[0];
  const points = loyalty.data?.balance;

  return <>
    <PageTitle eyebrow="Il tuo barber" title={`Ciao, ${user?.name ?? ""}`} description="Il prossimo taglio è a portata di tap." />
    <Link href="/prenota" className="mb-6 flex min-h-16 items-center justify-between rounded-[1.5rem] bg-amber-300 px-5 font-semibold text-zinc-950 shadow-[0_15px_45px_rgba(252,211,77,.12)]"><span>Prenota ora</span><span className="grid size-10 place-items-center rounded-full bg-zinc-950/10"><ArrowRight className="size-5" /></span></Link>

    <section aria-labelledby="next-title">
      <div className="mb-3 flex items-center justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-[.18em] text-zinc-500">La tua agenda</p><h2 id="next-title" className="mt-1 text-lg font-semibold">Prossimo appuntamento</h2></div><Link href="/prenotazioni" className="rounded-full bg-white/5 px-3 py-2 text-xs text-amber-300">Vedi tutti</Link></div>
      {bookings.isPending ? <Skeleton className="h-64" /> : bookings.isError ? <ErrorState message={apiErrorMessage(bookings.error)} retry={() => bookings.refetch()} /> : next ? <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}><Link href="/prenotazioni" className="group block overflow-hidden rounded-[1.8rem] bg-card shadow-[0_22px_65px_rgba(0,0,0,.35)] ring-1 ring-amber-200/15"><div className="relative h-48 overflow-hidden"><AppImage src={next.staff?.image_url} alt={fullName(next.staff) || "Professionista"} sizes="640px" className="object-cover transition duration-500 group-hover:scale-[1.03]" /><div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/30 to-transparent" /><span className="absolute right-4 top-4 rounded-full bg-zinc-950/75 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-300 backdrop-blur">Confermata</span><div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5"><div><p className="text-xs text-amber-300">con {fullName(next.staff) || "lo staff"}</p><h3 className="mt-1 text-2xl font-semibold">{next.service?.name ?? "Servizio"}</h3></div><span className="grid size-11 shrink-0 place-items-center rounded-full bg-amber-300 text-zinc-950"><ArrowRight className="size-5" /></span></div></div><div className="grid grid-cols-[1fr_auto] items-center gap-4 p-5"><div className="flex min-w-0 items-center gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-amber-300/10 text-amber-300"><CalendarDays className="size-5" /></span><div><p className="font-semibold capitalize">{italianDate(next.date)}</p><p className="mt-1 flex items-center gap-1.5 text-xs text-zinc-500"><Clock3 className="size-3.5" />ore {next.time.slice(0, 5)}{next.service?.duration ? ` · ${next.service.duration} min` : ""}</p></div></div></div></Link></motion.div> : <Card className="overflow-hidden p-0"><div className="p-6 text-center"><span className="mx-auto grid size-12 place-items-center rounded-2xl bg-amber-300/10 text-amber-300"><CalendarDays /></span><p className="mt-4 font-medium">La tua agenda è libera</p><p className="mt-1 text-sm text-zinc-500">Scegli il momento giusto per il prossimo appuntamento.</p><Link href="/prenota" className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-white/5 px-4 text-sm font-semibold text-amber-300">Prenota adesso<ArrowRight className="size-4" /></Link></div></Card>}
    </section>

    <div className="mt-5 grid grid-cols-2 gap-3"><Link href="/prodotti"><Card className="h-full p-4"><Package className="size-5 text-amber-300" /><p className="mt-5 font-medium">Prodotti</p><p className="mt-1 text-xs text-zinc-500">Scopri il catalogo</p></Card></Link><Link href="/profilo#loyalty"><Card className="h-full p-4"><Sparkles className="size-5 text-amber-300" /><p className="mt-5 font-medium">{loyalty.isPending ? "…" : points != null ? `${points} punti` : "Loyalty"}</p><p className="mt-1 text-xs text-zinc-500">Premi e vantaggi</p></Card></Link></div>
    {config.data && <Card className="mt-5"><h2 className="font-semibold">{config.data.shop_name ?? config.data.name ?? "La barberia"}</h2>{config.data.address && <p className="mt-3 flex gap-2 text-sm text-zinc-400"><MapPin className="size-4 shrink-0 text-amber-300" />{config.data.address}</p>}{config.data.phone && <a href={`tel:${config.data.phone}`} className="mt-3 flex gap-2 text-sm text-zinc-400"><Phone className="size-4 text-amber-300" />{config.data.phone}</a>}</Card>}
  </>;
}
