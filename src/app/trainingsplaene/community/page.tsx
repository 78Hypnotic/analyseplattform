import { redirect } from "next/navigation";
import { getCommunitySlugByLibraryId } from "@/lib/training-plans/community";

export default async function LegacyCommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ libraryId?: string }>;
}) {
  const { libraryId } = await searchParams;
  const slug = libraryId ? await getCommunitySlugByLibraryId(libraryId) : null;
  redirect(slug ? `/community/${slug}` : "/community");
}