"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LoaderCircle, UserRoundPlus } from "lucide-react";
import { useRef, useState } from "react";
import { useAuth } from "@/providers/auth-provider";
import { endpoints } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/client";
import { readableAuthMessage } from "@/lib/auth/form-feedback";
import { fullName, italianDate, euro } from "@/lib/format";
import { queryKeys } from "@/lib/query/keys";
import { Button } from "@/components/ui/button";
import { Card, Input, Label } from "@/components/ui/primitives";
import type { AdminBookingIntegration, AdminBookingPayload } from "@/types/admin-booking";

const fieldClass = "min-h-12 w-full rounded-xl border border-white/10 bg-zinc-900 px-3 text-base text-zinc-100 outline-none focus:border-amber-300 disabled:opacity-50";
const localToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Rome", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

function bookingError(error: unknown): string {
  if (!(error instanceof ApiError)) return "Impossibile completare la richiesta. Riprova.";
  if (error.status === 401) return "Sessione scaduta. Accedi di nuovo.";
  if (error.status === 403) return "Non sei autorizzato a prenotare per altri clienti.";
  if (error.status === 0) return "Controlla la connessione e riprova.";
  if (error.status >= 500) return "Servizio temporaneamente non disponibile. Riprova tra poco.";
  if (error.status === 429) return "Troppi tentativi. Attendi prima di riprovare.";
  if (error.status === 422) return "Controlla cliente, servizio, staff, data, orario e nota: alcuni dati non sono validi.";
  return readableAuthMessage(error.message);
}

export function AdminBookingSection({ integration }: { integration?: AdminBookingIntegration }) {
  const { user, loading } = useAuth();
  // Do not trust the role cached at login: require a successful /auth/me response.
  const me = useQuery({ queryKey: ["admin-booking-role", user?.id], queryFn: endpoints.me, enabled: !loading && !!user, retry: false, staleTime: 0 });
  const verified = me.data && ("user" in me.data ? me.data.user : me.data);
  if (loading || !user || me.isError || me.isPending || verified?.id !== user.id || verified?.role !== "admin") return null;
  return <section className="mb-6" aria-label="Prenotazione amministratore">
    <details className="rounded-3xl border border-amber-300/20 bg-card p-4">
      <summary className="cursor-pointer text-sm font-semibold text-amber-300"><UserRoundPlus aria-hidden className="mr-2 inline size-5" />Prenota per un cliente</summary>
      <AdminBookingForm key={user.id} integration={integration} />
    </details>
  </section>;
}

function AdminBookingForm({ integration }: { integration?: AdminBookingIntegration }) {
  const queryClient = useQueryClient();
  const [clientId, setClientId] = useState("");
  const [staffId, setStaffId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState(localToday);
  const [time, setTime] = useState("");
  const [note, setNote] = useState("");
  const [review, setReview] = useState<AdminBookingPayload | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const sending = useRef(false);
  const clients = useQuery({ queryKey: ["admin-booking-clients"], queryFn: () => integration!.clients(), enabled: !!integration, retry: false });
  const staff = useQuery({ queryKey: queryKeys.staff, queryFn: endpoints.staff, enabled: !!integration });
  const services = useQuery({ queryKey: queryKeys.services(staffId), queryFn: () => endpoints.servicesByStaff(staffId), enabled: !!integration && !!staffId });
  const slots = useQuery({ queryKey: queryKeys.availability(staffId, date, serviceId), queryFn: () => endpoints.availability(staffId, date, serviceId), enabled: !!integration && !!staffId && !!serviceId && !!date });
  const client = clients.data?.find(item => String(item.id) === clientId);
  const professional = staff.data?.find(item => String(item.id) === staffId);
  const service = services.data?.find(item => String(item.id) === serviceId);
  const valid = !!integration && !!client && !!professional && !!service && date >= localToday() && !!slots.data?.slots.includes(time) && !slots.isFetching && !slots.isError;
  const queryError = clients.error || staff.error || services.error || slots.error;

  async function confirm() {
    if (!integration || !review || sending.current) return;
    sending.current = true;
    setPending(true); setError("");
    try {
      const response = await endpoints.me();
      if (("user" in response ? response.user : response).role !== "admin") throw new ApiError(403, null, "Accesso non consentito");
      // Never use endpoints.createBooking: it would book for the logged-in user.
      const result = await integration.create(review);
      if (!result.status) throw new ApiError(400, result, result.message ?? "Prenotazione non riuscita.");
      setReview(null); setTime(""); setNote("");
      setSuccess("Prenotazione confermata per il cliente.");
      // Do not insert a client's booking into the admin's personal bookings cache.
      try {
        await Promise.all([integration.refreshBookings(), queryClient.invalidateQueries({ queryKey: queryKeys.bookings }), queryClient.invalidateQueries({ queryKey: ["availability"] })]);
      } catch { setSuccess("Prenotazione confermata. Ricarica la lista per visualizzare l’aggiornamento."); }
    } catch (cause) {
      setError(bookingError(cause));
      setReview(null); setTime("");
      void slots.refetch();
    } finally { sending.current = false; setPending(false); }
  }

  return <div className="mt-4 space-y-4">
    {!integration && <p role="status" className="rounded-xl bg-amber-300/10 p-3 text-sm text-amber-200">Funzione in preparazione. La selezione dei clienti e l’invio saranno disponibili quando il backend abiliterà le API dedicate. Nessuna prenotazione verrà inviata.</p>}
    {success && <p role="status" className="text-sm text-emerald-300">{success}</p>}
    {(error || queryError) && <div role="alert" className="rounded-xl bg-red-400/10 p-3 text-sm text-red-200">{error || bookingError(queryError)}{queryError && <button type="button" className="ml-2 underline" onClick={() => { void clients.refetch(); void staff.refetch(); if (staffId) void services.refetch(); if (staffId && serviceId && date) void slots.refetch(); }}>Riprova</button>}</div>}
    {review ? <Card className="space-y-3">
      <h3 className="font-semibold">Riepilogo: prenota per il cliente</h3>
      <dl className="space-y-2 text-sm"><Summary label="Cliente" value={`${client?.name} ${client?.surname ?? ""} · ${client?.email}`} /><Summary label="Professionista" value={professional ? fullName(professional) : ""} /><Summary label="Servizio" value={`${service?.name} · ${service?.duration} min · ${euro(service?.price)}`} /><Summary label="Appuntamento" value={`${italianDate(review.date)} · ${review.time}`} /><Summary label="Nota" value={review.note || "Nessuna nota"} /></dl>
      <div className="grid grid-cols-2 gap-3"><Button variant="outline" disabled={pending} onClick={() => setReview(null)}>Modifica</Button><Button disabled={pending} onClick={() => void confirm()}>{pending && <LoaderCircle className="size-4 animate-spin" />}Conferma</Button></div>
    </Card> : <form onSubmit={event => {
      event.preventDefault();
      if (!valid || !client || !professional || !service) return;
      setError(""); setSuccess("");
      setReview({ user_id: client.id, staff_id: professional.id, service_id: service.id, date, time, note: note.trim() });
    }}>
      <fieldset disabled={!integration || pending} className="space-y-3">
        <div><Label htmlFor="admin-client">Cliente</Label><select id="admin-client" required className={fieldClass} value={clientId} onChange={e => setClientId(e.target.value)}><option value="">{clients.isFetching ? "Caricamento clienti…" : "Seleziona cliente"}</option>{clients.data?.map(item => <option key={item.id} value={item.id}>{item.name} {item.surname} · {item.email}</option>)}</select>{integration && clients.isSuccess && !clients.data.length && <p className="mt-1 text-xs text-zinc-400">Nessun cliente disponibile.</p>}</div>
        <div><Label htmlFor="admin-staff">Professionista</Label><select id="admin-staff" required className={fieldClass} value={staffId} onChange={e => { setStaffId(e.target.value); setServiceId(""); setTime(""); }}><option value="">Seleziona professionista</option>{staff.data?.map(item => <option key={item.id} value={item.id}>{fullName(item)}</option>)}</select></div>
        <div><Label htmlFor="admin-service">Servizio</Label><select id="admin-service" required disabled={!integration || !staffId || services.isFetching} className={fieldClass} value={serviceId} onChange={e => { setServiceId(e.target.value); setTime(""); }}><option value="">Seleziona servizio</option>{services.data?.map(item => <option key={item.id} value={item.id}>{item.name} · {euro(item.price)}</option>)}</select></div>
        <div><Label htmlFor="admin-date">Data</Label><Input id="admin-date" type="date" required min={localToday()} value={date} onChange={e => { setDate(e.target.value); setTime(""); }} /></div>
        <div><Label htmlFor="admin-time">Orario</Label><select id="admin-time" required disabled={!integration || !serviceId || !date || slots.isFetching} className={fieldClass} value={time} onChange={e => setTime(e.target.value)}><option value="">{slots.isFetching ? "Caricamento orari…" : "Seleziona orario"}</option>{slots.data?.slots.map(slot => <option key={slot} value={slot}>{slot}</option>)}</select>{slots.isSuccess && !slots.data.slots.length && <p className="mt-1 text-xs text-zinc-400">Nessun orario disponibile. Scegli un altro giorno.</p>}</div>
        <div><Label htmlFor="admin-note">Nota facoltativa</Label><textarea id="admin-note" rows={3} className={`${fieldClass} py-3`} value={note} onChange={e => setNote(e.target.value)} /></div>
        <Button type="submit" disabled={!valid} className="w-full">Controlla riepilogo</Button>
      </fieldset>
    </form>}
  </div>;
}

function Summary({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-zinc-400">{label}</dt><dd className="whitespace-pre-wrap break-words">{value}</dd></div>;
}
