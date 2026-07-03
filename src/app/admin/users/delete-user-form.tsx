"use client";

import { useFormStatus } from "react-dom";
import { Trash2 } from "lucide-react";
import { deleteAdminUser } from "./actions";

export function DeleteUserForm({
  userId,
  label,
  disabled,
}: {
  userId: string;
  label: string;
  disabled: boolean;
}) {
  return (
    <form
      action={deleteAdminUser}
      onSubmit={(event) => {
        if (!window.confirm(`User "${label}" wirklich löschen?`)) {
          event.preventDefault();
        }
      }}
      className="flex justify-end"
    >
      <input type="hidden" name="userId" value={userId} />
      <DeleteButton disabled={disabled} />
    </form>
  );
}

function DeleteButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[var(--warn)] px-3 text-sm font-medium text-[var(--warn)] transition hover:bg-[color-mix(in_oklab,var(--warn)_10%,transparent)] disabled:cursor-not-allowed disabled:opacity-45"
      title={disabled ? "Admins und der eigene Account können hier nicht gelöscht werden." : "User löschen"}
    >
      <Trash2 size={16} />
      {pending ? "Löscht..." : "Löschen"}
    </button>
  );
}
