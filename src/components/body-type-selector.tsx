"use client";

import Image from "next/image";
import { useState } from "react";
import type { BodyFatSex } from "@/lib/body-fat";
import { BODY_TYPES, getBodyTypeImageSrc, type BodyType } from "@/lib/body-type";

export function BodyTypeSelector({
  sex,
  value,
  onChange,
}: {
  sex: BodyFatSex;
  value: BodyType | "" | null;
  onChange: (bodyType: BodyType) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {BODY_TYPES.map((bodyType) => (
        <button
          key={bodyType.value}
          type="button"
          onClick={() => onChange(bodyType.value)}
          aria-pressed={value === bodyType.value}
          className={
            value === bodyType.value
              ? "flex flex-col rounded-lg border border-[var(--accent)] bg-[color-mix(in_oklab,var(--accent)_12%,var(--panel))] p-3 text-left text-[var(--foreground)]"
              : "flex flex-col rounded-lg border border-[var(--line)] bg-[var(--panel)] p-3 text-left text-[var(--subtle)] hover:border-[var(--accent)] hover:text-[var(--foreground)]"
          }
        >
          <BodyTypeImage sex={sex} bodyType={bodyType.value} />
          <span className="display-serif mt-3 text-lg text-[var(--foreground)]">{bodyType.label}</span>
          <span className="mono mt-1 text-[10px] uppercase tracking-[0.16em] text-[var(--subtle)]">
            {bodyType.term}
          </span>
          <span className="mt-2 text-xs leading-5 text-[var(--muted)]">{bodyType.description}</span>
        </button>
      ))}
    </div>
  );
}

function BodyTypeImage({ sex, bodyType }: { sex: BodyFatSex; bodyType: BodyType }) {
  const [hasFailed, setHasFailed] = useState(false);
  const src = getBodyTypeImageSrc(sex, bodyType);

  // Platzhalterfläche, solange die Körperbau-Bilder noch nicht geliefert sind.
  if (hasFailed) {
    return <div className="h-28 w-full rounded-md border border-dashed border-[var(--line)]" aria-hidden="true" />;
  }

  return (
    <div className="flex h-28 w-full items-end justify-center overflow-hidden">
      <Image
        src={src}
        alt=""
        width={160}
        height={460}
        sizes="160px"
        className="max-h-28 w-auto select-none object-contain"
        aria-hidden="true"
        onError={() => setHasFailed(true)}
      />
    </div>
  );
}
