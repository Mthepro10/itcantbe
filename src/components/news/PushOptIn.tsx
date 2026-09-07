import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { savePushSubscription } from "@/lib/news.functions";

// Generated once for this project — safe to keep in client code, this is
// the PUBLIC VAPID key (the private key stays server-side only, as an
// Edge Function secret).
const VAPID_PUBLIC_KEY =
  "BJDwSjbAvMDJRDz_-q1I_rpUVkX7c62OLqBvqXgpemYZ5j2RaCcoymwznsBZ0S1DJImUQgYcHNUeRIFMqJ71HzU";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

type Status = "idle" | "checking" | "loading" | "on" | "unsupported" | "denied";

export function PushOptIn() {
  const supported =
    typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window;
  const [status, setStatus] = useState<Status>(supported ? "checking" : "unsupported");

  // On mount, check whether this device already has an active subscription
  // (e.g. after a reload) instead of always starting from scratch.
  useEffect(() => {
    if (!supported) return;
    let cancelled = false;

    (async () => {
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        const existing = await reg?.pushManager.getSubscription();
        if (!cancelled) {
          if (existing) {
            setStatus("on");
          } else if (Notification.permission === "denied") {
            setStatus("denied");
          } else {
            setStatus("idle");
          }
        }
      } catch {
        if (!cancelled) setStatus("idle");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [supported]);

  const enable = async () => {
    setStatus("loading");
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        return;
      }

      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
      }
      const json = sub.toJSON();

      await savePushSubscription({
        data: {
          endpoint: json.endpoint!,
          p256dh: json.keys!.p256dh!,
          auth: json.keys!.auth!,
        },
      });
      setStatus("on");
    } catch (e) {
      console.error("push subscribe failed", e);
      setStatus("idle");
    }
  };

  if (status === "unsupported" || status === "checking") return null;

  const label =
    status === "on"
      ? "Notifications on"
      : status === "denied"
        ? "Blocked — check browser settings"
        : status === "loading"
          ? "Enabling…"
          : "Get breaking news alerts";

  return (
    <button
      type="button"
      onClick={status === "idle" ? enable : undefined}
      disabled={status === "loading" || status === "on" || status === "denied"}
      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-bold text-foreground transition-colors hover:border-accent/60 disabled:cursor-default disabled:opacity-70"
    >
      {status === "on" ? (
        <Bell className="h-3.5 w-3.5 text-accent" />
      ) : (
        <BellOff className="h-3.5 w-3.5" />
      )}
      {label}
    </button>
  );
}

