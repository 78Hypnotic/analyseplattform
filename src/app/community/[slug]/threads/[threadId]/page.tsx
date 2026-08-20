import { permanentRedirect } from "next/navigation";

export default async function LegacyThreadPage({
  params,
}: {
  params: Promise<{ slug: string; threadId: string }>;
}) {
  const { slug, threadId } = await params;
  permanentRedirect(`/community/${slug}#m-${threadId}`);
}
