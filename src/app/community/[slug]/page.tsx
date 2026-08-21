import { notFound } from "next/navigation";
import { ChannelView } from "@/components/community/channel-view";
import { getCommunityChannel } from "@/lib/community/communities";

export const dynamic = "force-dynamic";

export default async function CommunityDefaultChannelPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ before?: string }>;
}) {
  const [{ slug }, { before }] = await Promise.all([params, searchParams]);
  const result = await getCommunityChannel(slug, null, { before });

  if (result.kind !== "ok") notFound();

  return <ChannelView view={result.view} />;
}
