"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/providers/auth-provider";
import { hasAccountPush } from "@/lib/push/notifications";
import { PUSH_STATUS_EVENT } from "@/lib/push/account-state";

type PushStatus = { active: boolean; checked: boolean; permission: NotificationPermission; supported: boolean; userId: string };
export function usePushStatus() {
  const { user } = useAuth();
  const userId = user ? String(user.id) : "";
  const sequence = useRef(0);
  const invalidate = useCallback(() => { sequence.current += 1; }, []);
  const [status, setStatus] = useState<PushStatus>({ active: false, checked: false, permission: "default", supported: false, userId: "" });
  const refresh = useCallback(async () => {
    const request = ++sequence.current;
    const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    const permission = supported ? Notification.permission : "default";
    let active = false;
    try { if (supported && userId) active = await hasAccountPush(userId); } catch { /* Failed checks never show green. */ }
    if (request === sequence.current) setStatus({ active, checked: true, supported, permission, userId });
  }, [userId]);
  useEffect(() => {
    const initial = window.setTimeout(() => void refresh(), 0);
    const visible = () => { if (document.visibilityState === "visible") void refresh(); };
    const update = () => void refresh();
    window.addEventListener(PUSH_STATUS_EVENT, update);
    window.addEventListener("focus", update);
    window.addEventListener("pageshow", update);
    window.addEventListener("storage", update);
    document.addEventListener("visibilitychange", visible);
    navigator.serviceWorker?.addEventListener("controllerchange", update);
    return () => {
      invalidate(); window.clearTimeout(initial);
      window.removeEventListener(PUSH_STATUS_EVENT, update);
      window.removeEventListener("focus", update);
      window.removeEventListener("pageshow", update);
      window.removeEventListener("storage", update);
      document.removeEventListener("visibilitychange", visible);
      navigator.serviceWorker?.removeEventListener("controllerchange", update);
    };
  }, [refresh, invalidate]);
  return { ...status, active: status.userId === userId && status.active, checked: status.userId === userId && status.checked, refresh };
}
