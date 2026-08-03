"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Bell, BellOff, CheckCircle2, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { endpoints } from "@/lib/api/endpoints";
import { apiErrorMessage } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/keys";
import { usePushStatus } from "@/hooks/use-push-status";
import { Button } from "@/components/ui/button";
import { Card, ErrorState, Skeleton } from "@/components/ui/primitives";

type PushBody = { endpoint: string; keys: { p256dh: string; auth: string }; content_encoding: "aesgcm" };

export function PushControls({ compact = false }: { compact?: boolean }) {
  const config = useQuery({ queryKey: queryKeys.push, queryFn: endpoints.pushConfig });
  const { active, checked, permission, refresh, setActive, supported } = usePushStatus();
  const [message, setMessage] = useState("");

  const enable = useMutation({
    mutationFn: async () => {
      setMessage("");
      const result = await Notification.requestPermission();
      await refresh();
      if (result !== "granted") throw new Error("Permesso notifiche non concesso.");
      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      const subscription = existing ?? await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: decodeKey(config.data!.public_key!) });
      await endpoints.subscribePush(subscriptionBody(subscription));
    },
    onSuccess: () => { setActive(true); setMessage("Notifiche attivate."); },
  });
  const disable = useMutation({
    mutationFn: async () => {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) { await endpoints.unsubscribePush(subscriptionBody(subscription)); await subscription.unsubscribe(); }
    },
    onSuccess: () => { setActive(false); setMessage("Notifiche disattivate."); },
  });

  return <div>
    {!compact && <><h2 className="flex items-center gap-2 font-semibold"><Bell className="size-5 text-amber-300" />Notifiche</h2><p className="mt-2 text-sm leading-6 text-zinc-400">Conferme e promemoria, solo quando li vuoi tu.</p></>}
    {compact && <div className={`mb-5 flex items-center gap-3 rounded-2xl border p-4 ${active ? "border-emerald-300/15 bg-emerald-400/[.06]" : "border-red-300/10 bg-red-400/[.04]"}`}><span className={`grid size-11 place-items-center rounded-2xl ${active ? "bg-emerald-400/12 text-emerald-300" : "bg-red-400/10 text-red-300"}`}>{active ? <CheckCircle2 /> : <ShieldCheck />}</span><div><p className="font-medium">{active ? "Notifiche attive" : "Notifiche disattivate"}</p><p className="text-xs text-zinc-500">{active ? "Riceverai conferme e promemoria" : "Attivale per non perdere gli aggiornamenti"}</p></div></div>}
    {config.isPending || !checked ? <Skeleton className="mt-4 h-12" /> : config.isError ? <div className="mt-4"><ErrorState message={apiErrorMessage(config.error)} retry={() => config.refetch()} /></div> : !supported ? <Message>Questo browser non supporta le notifiche push.</Message> : !config.data.enabled ? <Message>Le notifiche Lama sono momentaneamente disabilitate.</Message> : !config.data.public_key ? <Message>La configurazione push non è completa.</Message> : permission === "denied" ? <Message error>Il permesso è bloccato. Riabilitalo dalle impostazioni del browser.</Message> : active ? <Button variant="outline" disabled={disable.isPending} onClick={() => disable.mutate()} className="mt-4 h-12 w-full rounded-2xl"><BellOff />{disable.isPending ? "Disattivazione…" : "Disattiva notifiche"}</Button> : <Button disabled={enable.isPending} onClick={() => enable.mutate()} className="mt-4 h-12 w-full rounded-2xl"><Bell />{enable.isPending ? "Attivazione…" : "Attiva notifiche"}</Button>}
    {message && <p role="status" className="mt-3 text-sm text-emerald-300">{message}</p>}
    {(enable.isError || disable.isError) && <p role="alert" className="mt-3 text-sm text-red-300">{apiErrorMessage(enable.error ?? disable.error)}</p>}
  </div>;
}

export function PushPanel() { return <Card className="mt-4"><PushControls /></Card>; }
function Message({ children, error = false }: { children: React.ReactNode; error?: boolean }) { return <p className={`mt-4 text-sm ${error ? "text-red-300" : "text-zinc-500"}`}>{children}</p>; }
function decodeKey(value: string) { const padding = "=".repeat((4 - value.length % 4) % 4); const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/"); return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0)); }
function subscriptionBody(subscription: PushSubscription): PushBody { const json = subscription.toJSON(); if (!json.endpoint || !json.keys?.p256dh || !json.keys.auth) throw new Error("Subscription push non valida."); return { endpoint: json.endpoint, keys: { p256dh: json.keys.p256dh, auth: json.keys.auth }, content_encoding: "aesgcm" }; }
