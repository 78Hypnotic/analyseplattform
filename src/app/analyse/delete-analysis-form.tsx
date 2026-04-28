"use client";

import { useFormStatus } from "react-dom";
import { Trash2 } from "lucide-react";
import { deleteAnalysis } from "./actions";

export function DeleteAnalysisForm({
  id,
  title,
}: {
  id: string;
  title: string;
}) {
  return (
    <form
      action={deleteAnalysis}
      onSubmit={(event) => {
        if (!window.confirm(`Analyse "${title}" wirklich löschen?`)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <DeleteButton />
    </form>
  );
}

function DeleteButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[var(--warn)] px-3 text-sm font-medium text-[var(--warn)] transition hover:bg-[color-mix(in_oklab,var(--warn)_10%,transparent)] disabled:cursor-not-allowed disabled:opacity-60"
    >
      <Trash2 size={16} />
      {pending ? "Löscht..." : "Löschen"}
    </button>
  );
}
