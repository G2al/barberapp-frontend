import { CalendarDays, Check, Clock3, LoaderCircle, Scissors, UserRound } from "lucide-react";
import { euro, italianDate } from "@/lib/format";
import type { AiConfirmBookingAction } from "@/types";

export type BookingActionStatus = "idle" | "loading" | "success" | "error";

export function BookingActionCard({ action, status = "idle", error, onConfirm }: {
  action: AiConfirmBookingAction;
  status?: BookingActionStatus;
  error?: string;
  onConfirm: () => void;
}) {
  const summary = action.summary;
  const loading = status === "loading";
  const success = status === "success";

  return (
    <section aria-label="Riepilogo prenotazione proposta" className="mt-2 overflow-hidden rounded-[1.3rem] border border-amber-300/20 bg-zinc-950/75 shadow-[0_14px_34px_rgba(0,0,0,.22)]">
      <div className="border-b border-white/8 px-4 py-3">
        <p className="text-[9px] font-semibold uppercase tracking-[.18em] text-amber-300">Riepilogo prenotazione</p>
        <h3 className="mt-1 font-semibold text-white">{summary.service}</h3>
      </div>
      <dl className="grid grid-cols-2 gap-px bg-white/8">
        <SummaryItem icon={<UserRound />} label="Professionista" value={summary.staff} />
        <SummaryItem icon={<CalendarDays />} label="Data" value={bookingDateLabel(summary.date)} />
        <SummaryItem icon={<Clock3 />} label="Orario" value={summary.time.slice(0, 5)} />
        <SummaryItem icon={<Scissors />} label="Durata e prezzo" value={`${summary.duration_minutes} min · ${euro(summary.price_eur)}`} />
      </dl>
      <div className="p-3">
        {error && <p role="alert" className="mb-3 rounded-xl border border-red-300/15 bg-red-400/[.07] px-3 py-2 text-xs leading-5 text-red-200">{error}</p>}
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading || success}
          className={`flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition ${success ? "bg-emerald-400/12 text-emerald-300" : "bg-amber-300 text-zinc-950 hover:bg-amber-200 disabled:cursor-wait disabled:opacity-70"}`}
        >
          {loading ? <><LoaderCircle className="size-4 animate-spin" />Conferma in corso…</> : success ? <><Check className="size-4" />Prenotazione confermata</> : status === "error" ? "Riprova conferma" : action.label || "Conferma prenotazione"}
        </button>
      </div>
    </section>
  );
}

function SummaryItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="min-w-0 bg-zinc-900 px-3 py-3"><dt className="flex items-center gap-1 text-[9px] uppercase tracking-wide text-zinc-500">{icon}{label}</dt><dd className="mt-1.5 break-words text-xs font-medium leading-4 text-zinc-200">{value}</dd></div>;
}

function bookingDateLabel(value: string) {
  try {
    return italianDate(value, { weekday: "short", day: "numeric", month: "short" });
  } catch {
    return value;
  }
}
