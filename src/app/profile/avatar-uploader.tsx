"use client";

import { useMemo, useState, useTransition } from "react";
import { Loader2, Pencil } from "lucide-react";
import { uploadAvatar } from "./actions";

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

export function AvatarUploader({
  fullName,
  avatarUrl,
}: {
  fullName: string;
  avatarUrl?: string | null;
}) {
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState(avatarUrl ?? null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const initials = useMemo(() => buildInitials(fullName), [fullName]);

  function handleFile(file: File | null) {
    setMessage(null);
    if (!file) return;

    const extension = ALLOWED_TYPES.get(file.type);
    if (!extension) {
      setMessage("Bitte JPG, PNG oder WebP hochladen.");
      return;
    }

    if (file.size > MAX_AVATAR_BYTES) {
      setMessage("Das Bild darf maximal 2 MB groß sein.");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.set("avatar", file);

      const state = await uploadAvatar(formData);
      setMessage(state.message);
      if (state.ok) setCurrentAvatarUrl(state.avatarUrl);
    });
  }

  return (
    <div className="relative size-20 shrink-0 sm:size-24">
      <div className="flex size-full items-center justify-center overflow-hidden rounded-full border border-[color-mix(in_oklab,var(--accent)_35%,var(--line))] bg-[color-mix(in_oklab,var(--accent)_12%,var(--panel))] text-2xl font-semibold sm:text-3xl">
        {currentAvatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={currentAvatarUrl} alt="Profilbild" className="size-full object-cover" />
        ) : (
          <span>{initials}</span>
        )}
      </div>
      <label
        className="absolute bottom-0 right-0 inline-flex size-7 cursor-pointer items-center justify-center rounded-full border border-[var(--line)] bg-[var(--brand-bg)] text-[var(--brand-fg)] shadow-lg shadow-[var(--shadow-color)] transition hover:scale-105"
        aria-label="Profilbild bearbeiten"
        title={message ?? "Profilbild bearbeiten"}
      >
        {isPending ? <Loader2 className="animate-spin" size={14} /> : <Pencil size={14} />}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          disabled={isPending}
          onChange={(event) => {
            handleFile(event.target.files?.[0] ?? null);
            event.currentTarget.value = "";
          }}
        />
      </label>
      <span className="sr-only" aria-live="polite">
        {message}
      </span>
    </div>
  );
}

function buildInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "?";
  const second = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
  return `${first}${second}`.toUpperCase();
}
