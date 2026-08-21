"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/button";
import { useFeedback } from "@/components/feedback-provider";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { notify, isOnline } = useFeedback();

  useEffect(() => {
    notify({
      tone: "error",
      title: "Seite konnte nicht geladen werden",
      message: isOnline ? "Bitte versuche es erneut." : "Prüfe deine Internetverbindung und versuche es danach erneut.",
    });
  }, [error.digest, isOnline, notify]);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 items-center px-5 py-16">
      <section className="surface w-full p-8 text-center" role="alert">
        <AlertTriangle size={24} className="mx-auto text-[var(--warn)]" />
        <h1 className="mt-4 text-2xl font-semibold">Diese Seite konnte nicht geladen werden</h1>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[var(--muted)]">
          {isOnline ? "Die Daten konnten gerade nicht abgerufen werden. Deine Eingaben auf anderen Seiten bleiben erhalten." : "Du bist offline. Stelle die Verbindung wieder her und versuche es erneut."}
        </p>
        <Button type="button" onClick={reset} disabled={!isOnline} className="mt-6">
          <RotateCcw size={16} /> Erneut versuchen
        </Button>
      </section>
    </main>
  );
}