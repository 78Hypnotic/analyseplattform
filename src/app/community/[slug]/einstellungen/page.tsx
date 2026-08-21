import { notFound } from "next/navigation";
import { getCommunityNavigation, type CommunityChannelSummary } from "@/lib/community/communities";
import { COMMUNITY_CHANNEL_TYPES } from "@/lib/community/schema";
import { createCommunityChannel, updateCommunityChannel } from "./actions";

export const dynamic = "force-dynamic";

const TYPE_LABELS: Record<(typeof COMMUNITY_CHANNEL_TYPES)[number], string> = {
  chat: "Chat – offener Nachrichtenstrom",
  announcement: "Ankündigungen – nur Coaches und Admins schreiben",
  intro: "Vorstellungsrunde – ein Beitrag pro Person",
  links: "Linksammlung – kuratierte Hyperlinks",
};

export default async function CommunityChannelSettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const result = await getCommunityNavigation(slug);
  if (result.kind !== "ok" || !result.navigation.canModerate) notFound();

  const { community, channels } = result.navigation;

  return (
    <section>
      <header>
        <h2 className="text-2xl font-semibold text-[var(--foreground)]">Kanäle verwalten</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Benenne Kanäle um, sortiere sie oder lege neue an. Der Standardkanal bleibt immer aktiv.
        </p>
      </header>

      <ul className="mt-6 grid gap-3">
        {channels.map((channel) => (
          <li key={channel.id} className="surface p-4 sm:p-5">
            <ChannelForm channel={channel} communitySlug={community.slug} />
          </li>
        ))}
      </ul>

      <form action={createCommunityChannel} className="surface mt-6 grid gap-3 p-4 sm:p-5">
        <h3 className="text-lg font-semibold text-[var(--foreground)]">Neuen Kanal anlegen</h3>
        <input type="hidden" name="communityId" value={community.id} />
        <input type="hidden" name="communitySlug" value={community.slug} />
        <label className="grid gap-2 text-sm text-[var(--muted)]">
          Name
          <input name="name" minLength={2} maxLength={60} placeholder="z. B. Wettkämpfe" required />
        </label>
        <label className="grid gap-2 text-sm text-[var(--muted)]">
          Typ
          <select name="type" defaultValue="chat">
            {COMMUNITY_CHANNEL_TYPES.map((type) => (
              <option key={type} value={type}>
                {TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm text-[var(--muted)]">
          Beschreibung (optional)
          <input name="description" maxLength={300} placeholder="Worum geht es in diesem Kanal?" />
        </label>
        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 text-sm font-medium text-[var(--accent-foreground)] transition hover:bg-[var(--accent-hover)]"
          >
            Kanal anlegen
          </button>
        </div>
      </form>
    </section>
  );
}

function ChannelForm({ channel, communitySlug }: { channel: CommunityChannelSummary; communitySlug: string }) {
  return (
    <form action={updateCommunityChannel} className="grid gap-3">
      <input type="hidden" name="channelId" value={channel.id} />
      <input type="hidden" name="communitySlug" value={communitySlug} />
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="mono text-[10px] uppercase tracking-[0.14em] text-[var(--subtle)]">
          /{channel.slug} · {TYPE_LABELS[channel.type].split(" – ")[0]}
          {channel.isDefault ? " · Standard" : ""}
        </p>
        <span className="mono text-[10px] text-[var(--subtle)]">{channel.entryCount} Beiträge</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
        <label className="grid gap-2 text-sm text-[var(--muted)]">
          Name
          <input name="name" defaultValue={channel.name} minLength={2} maxLength={60} required />
        </label>
        <label className="grid gap-2 text-sm text-[var(--muted)]">
          Reihenfolge
          <input name="sortOrder" type="number" min={0} max={999} defaultValue={channel.sortOrder} required />
        </label>
      </div>
      <label className="grid gap-2 text-sm text-[var(--muted)]">
        Beschreibung
        <input name="description" defaultValue={channel.description} maxLength={300} />
      </label>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm text-[var(--muted)]">
          <input type="checkbox" name="isActive" defaultChecked={channel.isActive} disabled={channel.isDefault} />
          Kanal aktiv
        </label>
        {channel.isDefault ? <input type="hidden" name="isActive" value="true" /> : null}
        <button
          type="submit"
          className="inline-flex h-9 items-center rounded-lg border border-[var(--line)] px-3 text-xs text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--foreground)]"
        >
          Speichern
        </button>
      </div>
    </form>
  );
}
