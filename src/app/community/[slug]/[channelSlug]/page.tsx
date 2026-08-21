import { notFound } from "next/navigation";
import { ChannelView } from "@/components/community/channel-view";
import { getCommunityChannel } from "@/lib/community/communities";
import { communityChannelSlugSchema } from "@/lib/community/schema";

export const dynamic = "force-dynamic";

export default async function CommunityChannelPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; channelSlug: string }>;
  searchParams: Promise<{ before?: string }>;
}) {
  const [{ slug, channelSlug }, { before }] = await Promise.all([params, searchParams]);
  const parsedChannel = communityChannelSlugSchema.safeParse(channelSlug);
  if (!parsedChannel.success) notFound();

  const result = await getCommunityChannel(slug, parsedChannel.data, { before });
  if (result.kind !== "ok") notFound();

  return <ChannelView view={result.view} />;
}
