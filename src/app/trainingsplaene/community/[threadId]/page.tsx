import { redirect } from "next/navigation";

export default async function LegacyCommunityThreadPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const { threadId } = await params;
  redirect(`/community/${threadId}`);
}