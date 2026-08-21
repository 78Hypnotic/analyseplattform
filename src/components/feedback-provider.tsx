"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Info, WifiOff, X } from "lucide-react";

export type ToastTone = "success" | "error" | "info";

export type ToastInput = {
  tone: ToastTone;
  title: string;
  message?: string;
  durationMs?: number;
};

type Toast = ToastInput & { id: number };

type FeedbackContextValue = {
  notify: (input: ToastInput) => number;
  dismiss: (id: number) => void;
  isOnline: boolean;
};

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const nextId = useRef(1);
  const timers = useRef(new Map<number, number>());

  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer) window.clearTimeout(timer);
    timers.current.delete(id);
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback((input: ToastInput) => {
    const id = nextId.current;
    nextId.current += 1;
    setToasts((current) => [...current.slice(-3), { ...input, id }]);
    const duration = input.durationMs ?? (input.tone === "error" ? 7000 : 4000);
    if (duration > 0) {
      timers.current.set(id, window.setTimeout(() => dismiss(id), duration));
    }
    return id;
  }, [dismiss]);

  useEffect(() => {
    function updateOnlineState() {
      setIsOnline(window.navigator.onLine);
    }
    updateOnlineState();
    window.addEventListener("online", updateOnlineState);
    window.addEventListener("offline", updateOnlineState);
    const activeTimers = timers.current;
    return () => {
      window.removeEventListener("online", updateOnlineState);
      window.removeEventListener("offline", updateOnlineState);
      activeTimers.forEach((timer) => window.clearTimeout(timer));
      activeTimers.clear();
    };
  }, []);

  const value = useMemo(() => ({ notify, dismiss, isOnline }), [dismiss, isOnline, notify]);

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      {!isOnline ? (
        <div role="alert" className="fixed inset-x-3 top-3 z-[250] mx-auto flex max-w-xl items-center gap-3 rounded-lg border border-[var(--warn)] bg-[var(--overlay-bg)] px-4 py-3 text-sm shadow-[0_12px_36px_var(--shadow-color)] sm:top-20">
          <WifiOff size={17} className="shrink-0 text-[var(--warn)]" />
          <div>
            <p className="font-medium">Du bist offline</p>
            <p className="mt-0.5 text-xs text-[var(--muted)]">Eingaben bleiben erhalten. Speichern und Löschen sind bis zur Wiederverbindung blockiert.</p>
          </div>
        </div>
      ) : null}
      <div aria-label="Benachrichtigungen" className="pointer-events-none fixed bottom-4 right-4 z-[240] grid w-[min(24rem,calc(100vw-2rem))] gap-2">
        {toasts.map((toast) => <ToastMessage key={toast.id} toast={toast} onDismiss={() => dismiss(toast.id)} />)}
      </div>
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const context = useContext(FeedbackContext);
  if (!context) throw new Error("useFeedback muss innerhalb des FeedbackProvider verwendet werden.");
  return context;
}

function ToastMessage({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const Icon = toast.tone === "success" ? CheckCircle2 : toast.tone === "error" ? AlertTriangle : Info;
  return (
    <div
      role={toast.tone === "error" ? "alert" : "status"}
      className="pointer-events-auto flex items-start gap-3 rounded-lg border border-[var(--line)] bg-[var(--overlay-bg)] p-3 shadow-[0_12px_36px_var(--shadow-color)]"
    >
      <Icon size={17} className={toast.tone === "error" ? "mt-0.5 shrink-0 text-[var(--warn)]" : "mt-0.5 shrink-0 text-[var(--accent)]"} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{toast.title}</p>
        {toast.message ? <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{toast.message}</p> : null}
      </div>
      <button type="button" aria-label="Benachrichtigung schließen" onClick={onDismiss} className="rounded p-1 text-[var(--subtle)] hover:text-[var(--foreground)]">
        <X size={14} />
      </button>
    </div>
  );
}