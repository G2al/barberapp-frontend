import type { BookingStatus } from "@/types";

export const euro = (value?: string | number | null) => value == null ? "Prezzo su richiesta" : new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(Number(value));
export function normalizeBookingDate(value: string) {
  const raw = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const leadingDate = raw.match(/^(\d{4}-\d{2}-\d{2})/)?.[1];
  const hasExplicitTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(raw);
  if (hasExplicitTimezone) {
    const parsable = raw.replace(/(\.\d{3})\d+(?=Z$|[+-]\d{2}:?\d{2}$)/i, "$1");
    const instant = new Date(parsable);
    if (!Number.isNaN(instant.getTime())) {
      const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Rome", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(instant);
      const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value;
      const year = part("year"); const month = part("month"); const day = part("day");
      if (year && month && day) return `${year}-${month}-${day}`;
    }
  }
  return leadingDate ?? raw;
}

export const italianDate = (value: string, options?: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("it-IT", options ?? { weekday: "long", day: "numeric", month: "long" }).format(new Date(`${normalizeBookingDate(value)}T12:00:00`));
export const fullName = (person?: { name?: string; surname?: string | null; first_name?: string; last_name?: string | null } | null) => person ? [person.name ?? person.first_name, person.surname ?? person.last_name].filter(Boolean).join(" ") : "";
export const normalizePhone = (value: string) => value.replace(/\D/g, "");
export const bookingStatus: Record<BookingStatus, string> = { pending: "In attesa", confirmed: "Confermata", completed: "Completata", cancelled: "Annullata", no_show: "Non presentato" };
export const bookingDate = (date: string, time: string) => new Date(`${normalizeBookingDate(date)}T${time.length === 5 ? `${time}:00` : time}`);

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "https://gaetabet.it/api").replace(/\/api\/?$/, "");
export function imageUrl(value?: string | null) {
  if (!value) return "/placeholder-avatar.svg";
  if (/^https?:\/\//i.test(value) || value.startsWith("data:") || value.startsWith("blob:")) return value;
  return `${API_URL}/${value.replace(/^\//, "")}`;
}

export function imageCandidates(value?: string | null) {
  const primary = imageUrl(value);
  if (primary.startsWith("/") || primary.startsWith("data:") || primary.startsWith("blob:")) return [primary];

  try {
    const url = new URL(primary);
    const mediaOrigin = new URL(API_URL).origin;
    if (url.origin !== mediaOrigin || url.pathname.startsWith("/storage/")) return [primary];

    const storageUrl = new URL(`/storage${url.pathname}`, url.origin);
    storageUrl.search = url.search;
    // Gli avatar del backend sono pubblicati sotto /storage/user-avatars,
    // anche quando l'API restituisce erroneamente /user-avatars.
    return url.pathname.startsWith("/user-avatars/")
      ? [storageUrl.toString(), primary]
      : [primary, storageUrl.toString()];
  } catch {
    return [primary];
  }
}
