import type { AnalysisAudit } from "@/lib/analysis/types";

export function AnalysisAttribution({
  audit,
  className = "",
}: {
  audit: AnalysisAudit;
  className?: string;
}) {
  const createdByCoach = Boolean(audit.created_by && audit.created_by !== audit.user_id);
  const updatedByCoach = Boolean(
    audit.updated_by
    && audit.updated_by !== audit.user_id
    && audit.updated_at
    && audit.updated_at !== audit.created_at,
  );

  if (!createdByCoach && !updatedByCoach) return null;

  return (
    <div className={`flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--subtle)] ${className}`.trim()}>
      {createdByCoach ? (
        <span>Erfasst von Coach {audit.created_by_name ?? "Unbekannt"}</span>
      ) : null}
      {updatedByCoach ? (
        <span>Zuletzt bearbeitet von Coach {audit.updated_by_name ?? "Unbekannt"}</span>
      ) : null}
    </div>
  );
}
