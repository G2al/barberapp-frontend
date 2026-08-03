"use client";

import { motion } from "motion/react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CalendarDays, Clock3, MapPin, MessageCircle, Navigation, Package, Phone, Plus, Sparkles } from "lucide-react";
import Image from "next/image";
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
  const nextReward = loyalty.data?.next_reward;
  const activeRule = loyalty.data?.rules.find((rule) => Number(rule.progress) < 100);
  const loyaltyProgress = Math.min(100, Math.max(0, Number(nextReward?.progress ?? activeRule?.progress ?? 0)));
  const loyaltyCaption = nextReward
    ? `Mancano ${nextReward.points_missing} punti`
    : loyalty.data?.available_rewards_count
      ? "Hai un premio disponibile"
      : "Verso il prossimo premio";
  const shopPhone = config.data?.phone?.trim() || "+39 324 099 4144";
  const shopAddress = config.data?.location?.trim() || config.data?.address?.trim() || "";
  const whatsappPhone = shopPhone.replace(/\D/g, "");
  const whatsappUrl = whatsappPhone ? `https://wa.me/${whatsappPhone}?text=${encodeURIComponent("Ciao Lama, vorrei ricevere alcune informazioni.")}` : "";
  const mapsUrl = shopAddress ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shopAddress)}` : "";

  return <>
    <PageTitle eyebrow="Lama Barber App" title={`Ciao, ${user?.name ?? ""}`} description="Il tuo prossimo appuntamento da Lama è a portata di tap." />

    <section aria-labelledby="next-title">
      <div className="mb-3 flex items-end justify-between gap-3"><div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-[.18em] text-zinc-500">La tua agenda</p><h2 id="next-title" className="mt-1 text-lg font-semibold">Prossimo appuntamento</h2></div><Link href="/prenota" className="flex min-h-10 shrink-0 items-center gap-1.5 rounded-full bg-amber-300 px-3.5 text-xs font-semibold text-zinc-950 shadow-[0_10px_30px_rgba(252,211,77,.1)]"><Plus className="size-4" /><span><span className="hidden min-[380px]:inline">Nuova </span>prenotazione</span></Link></div>
      {bookings.isPending ? <Skeleton className="h-64" /> : bookings.isError ? <ErrorState message={apiErrorMessage(bookings.error)} retry={() => bookings.refetch()} /> : next ? <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}><Link href="/prenotazioni" className="group block overflow-hidden rounded-[1.8rem] bg-card shadow-[0_22px_65px_rgba(0,0,0,.35)] ring-1 ring-amber-200/15"><div className="relative h-48 overflow-hidden"><AppImage src={next.staff?.image_url} alt={fullName(next.staff) || "Professionista"} sizes="640px" className="object-cover object-[center_38%] transition duration-500 group-hover:scale-[1.03]" /><div className="absolute inset-0 bg-zinc-950/55" /><span className="absolute right-4 top-4 rounded-full bg-zinc-950/75 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-300 backdrop-blur">Confermata</span><div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5"><div><p className="text-xs text-amber-300">con {fullName(next.staff) || "lo staff"}</p><h3 className="mt-1 text-2xl font-semibold">{next.service?.name ?? "Servizio"}</h3></div><span className="grid size-11 shrink-0 place-items-center rounded-full bg-amber-300 text-zinc-950"><ArrowRight className="size-5" /></span></div></div><div className="grid grid-cols-[1fr_auto] items-center gap-4 p-5"><div className="flex min-w-0 items-center gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-amber-300/10 text-amber-300"><CalendarDays className="size-5" /></span><div><p className="font-semibold capitalize">{italianDate(next.date)}</p><p className="mt-1 flex items-center gap-1.5 text-xs text-zinc-500"><Clock3 className="size-3.5" />ore {next.time.slice(0, 5)}{next.service?.duration ? ` · ${next.service.duration} min` : ""}</p></div></div></div></Link></motion.div> : <Card className="overflow-hidden p-0"><div className="p-6 text-center"><span className="mx-auto grid size-12 place-items-center rounded-2xl bg-amber-300/10 text-amber-300"><CalendarDays /></span><p className="mt-4 font-medium">La tua agenda è libera</p><p className="mt-1 text-sm text-zinc-500">Scegli il momento giusto per il prossimo appuntamento.</p><Link href="/prenota" className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-white/5 px-4 text-sm font-semibold text-amber-300">Prenota adesso<ArrowRight className="size-4" /></Link></div></Card>}
    </section>

    <div className="mt-5 grid grid-cols-2 gap-3">
      <Link href="/prodotti" className="group">
        <Card className="h-full p-4 transition duration-300 group-hover:border-amber-300/20">
          <div className="flex items-center justify-between">
            <Package className="size-5 text-amber-300" />
            <span className="grid size-8 place-items-center rounded-full bg-white/5 text-zinc-400 transition group-hover:bg-amber-300 group-hover:text-zinc-950"><ArrowRight className="size-4" /></span>
          </div>
          <p className="mt-5 font-medium">Prodotti</p>
          <p className="mt-1 text-xs text-zinc-500">Scopri il catalogo</p>
        </Card>
      </Link>
      <Link href="/profilo#loyalty">
        <Card className="h-full p-4">
          <Sparkles className="size-5 text-amber-300" />
          <p className="mt-5 font-medium">{loyalty.isPending ? "…" : points != null ? `${points} punti` : "Loyalty"}</p>
          <p className="mt-1 truncate text-[10px] text-zinc-500">{loyalty.isPending ? "Aggiornamento punti" : loyaltyCaption}</p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/8" role="progressbar" aria-label="Progresso verso il prossimo premio" aria-valuemin={0} aria-valuemax={100} aria-valuenow={loyalty.isPending ? undefined : Math.round(loyaltyProgress)}>
            <motion.div initial={{ width: 0 }} animate={{ width: loyalty.isPending ? "28%" : `${loyaltyProgress}%` }} transition={{ duration: .65, ease: "easeOut" }} className={`h-full rounded-full bg-amber-300 ${loyalty.isPending ? "animate-pulse" : ""}`} />
          </div>
        </Card>
      </Link>
    </div>
    {config.data && <Card className="mt-5 overflow-hidden p-0">
      <div className="flex items-center gap-4 p-5">
        <span className="relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-full bg-white shadow-[0_8px_25px_rgba(0,0,0,.3)] ring-1 ring-white/20">
          <Image src="/lama-logo-original.png" alt="Logo Lama Barber" fill sizes="64px" className="scale-[1.45] object-contain" />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-amber-300">Il tuo barber shop</p>
          <h2 className="mt-1 text-lg font-semibold">Lama Barber</h2>
          {shopPhone && <p className="mt-1 text-xs text-zinc-500">{shopPhone}</p>}
        </div>
      </div>

      {shopAddress && <a href={mapsUrl} target="_blank" rel="noreferrer" className="mx-5 flex items-center gap-3 rounded-2xl bg-white/[.035] p-3 text-sm text-zinc-400 transition hover:bg-white/[.06] hover:text-white"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-amber-300/10 text-amber-300"><MapPin className="size-4" /></span><span className="min-w-0 flex-1">{shopAddress}</span><ArrowRight className="size-4 shrink-0 text-zinc-600" /></a>}

      <div className="mx-5 mt-4 h-44 overflow-hidden rounded-2xl border border-white/10 bg-zinc-900">
        <iframe
          title="Mappa Lama Barber"
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1542226.491973595!2d11.762587356249993!3d40.9779527!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x133b01679e28d14f%3A0x1c82a951803a9cb!2sMottola's%20Family!5e0!3m2!1sit!2sit!4v1785747279876!5m2!1sit!2sit"
          width="600"
          height="450"
          className="h-full w-full border-0"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>

      {(shopPhone || shopAddress) && <div className={`mt-4 grid gap-px border-t border-white/8 bg-white/8 ${shopPhone && shopAddress ? "grid-cols-3" : shopPhone ? "grid-cols-2" : "grid-cols-1"}`}>
        {shopPhone && <a href={`tel:${shopPhone}`} className="flex min-h-16 flex-col items-center justify-center gap-1.5 bg-card px-2 text-xs font-medium transition hover:bg-white/[.035]"><Phone className="size-4 text-amber-300" />Chiama</a>}
        {whatsappUrl && <a href={whatsappUrl} target="_blank" rel="noreferrer" className="flex min-h-16 flex-col items-center justify-center gap-1.5 bg-card px-2 text-xs font-medium transition hover:bg-white/[.035]"><MessageCircle className="size-4 text-emerald-400" />WhatsApp</a>}
        {shopAddress && <a href={mapsUrl} target="_blank" rel="noreferrer" className="flex min-h-16 flex-col items-center justify-center gap-1.5 bg-card px-2 text-xs font-medium transition hover:bg-white/[.035]"><Navigation className="size-4 text-sky-300" />Indicazioni</a>}
      </div>}
    </Card>}
  </>;
}
