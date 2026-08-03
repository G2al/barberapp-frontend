"use client";

import { useCallback, useEffect, useState } from "react";

const PUSH_STATUS_EVENT = "lama:push-status";

type PushStatus = {
  active: boolean;
  checked: boolean;
  permission: NotificationPermission;
  supported: boolean;
};

export function usePushStatus() {
  const [status, setStatus] = useState<PushStatus>({
    active: false,
    checked: false,
    permission: "default",
    supported: false,
  });

  const refresh = useCallback(async () => {
    const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    if (!supported) {
      setStatus({ active: false, checked: true, permission: "default", supported: false });
      return;
    }

    const permission = Notification.permission;
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setStatus({ active: permission === "granted" && Boolean(subscription), checked: true, permission, supported: true });
    } catch {
      setStatus({ active: false, checked: true, permission, supported: true });
    }
  }, []);

  useEffect(() => {
    const initialCheck = window.setTimeout(() => void refresh(), 0);
    const handleStatus = (event: Event) => {
      const active = (event as CustomEvent<boolean>).detail;
      setStatus((current) => ({
        ...current,
        active,
        checked: true,
        permission: "Notification" in window ? Notification.permission : current.permission,
      }));
    };
    const handleVisibility = () => { if (document.visibilityState === "visible") void refresh(); };
    window.addEventListener(PUSH_STATUS_EVENT, handleStatus);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.clearTimeout(initialCheck);
      window.removeEventListener(PUSH_STATUS_EVENT, handleStatus);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [refresh]);

  const setActive = useCallback((active: boolean) => {
    setStatus((current) => ({
      ...current,
      active,
      checked: true,
      permission: "Notification" in window ? Notification.permission : current.permission,
    }));
    window.dispatchEvent(new CustomEvent<boolean>(PUSH_STATUS_EVENT, { detail: active }));
  }, []);

  return { ...status, refresh, setActive };
}
