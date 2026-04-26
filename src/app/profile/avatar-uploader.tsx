"use client";

import { useMemo, useState, useTransition } from "react";
import { ImagePlus, Loader2, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { removeAvatar, updateAvatar } from "./actions";

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

export function AvatarUploader({
  userId,
  fullName,
  avatarUrl,
}: {
  userId: string;
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
      const supabase = createSupabaseBrowserClient();
      const avatarPath = `${userId}/avatar.${extension}`;
      const { error } = await supabase.storage
        .from("avatars")
        .upload(avatarPath, file, {
          cacheControl: "3600",
          contentType: file.type,
          upsert: true,
        });

      if (error) {
        setMessage(error.message);
        return;
      }

      const state = await updateAvatar(avatarPath);
      setMessage(state.message);
      if (state.ok) setCurrentAvatarUrl(state.avatarUrl);
    });
  }

  function handleRemove() {
    setMessage(null);
    startTransition(async () => {
      const state = await removeAvatar();
      setMessage(state.message);
      if (state.ok) setCurrentAvatarUrl(null);
    });
  }

  return (
    <section className="surface mt-8 max-w-2xl p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--line)] bg-[var(--panel-2)] text-3xl font-semibold">
          {currentAvatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={currentAvatarUrl} alt="Profilbild" className="size-full object-cover" />
          ) : (
            <span>{initials}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-sm font-medium">
            <ImagePlus size={18} className="text-[var(--accent)]" />
            Profilbild
          </div>
          <p className="muted mt-2 text-sm leading-6">
            JPG, PNG oder WebP bis 2 MB. Das Bild wird oben im Profil angezeigt.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 text-sm font-medium text-black transition hover:bg-[#7ff0e3]">
              {isPending ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
              Hochladen
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                disabled={isPending}
                onChange={(event) => handleFile(event.target.files?.[0] ?? null)}
              />
            </label>
            {currentAvatarUrl ? (
              <Button type="button" variant="ghost" disabled={isPending} onClick={handleRemove}>
                <Trash2 size={16} />
                Entfernen
              </Button>
            ) : null}
          </div>
        </div>
      </div>
      {message ? (
        <p className="mt-4 rounded-lg border border-[var(--line)] bg-black/20 p-3 text-sm text-[var(--muted)]">
          {message}
        </p>
      ) : null}
    </section>
  );
}

function buildInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "?";
  const second = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
  return `${first}${second}`.toUpperCase();
}
