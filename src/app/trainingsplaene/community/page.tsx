import { redirect } from "next/navigation";

export default async function LegacyCommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ libraryId?: string }>;
}) {
  const { libraryId } = await searchParams;
  redirect(libraryId ? `/community?libraryId=${libraryId}` : "/community");
}