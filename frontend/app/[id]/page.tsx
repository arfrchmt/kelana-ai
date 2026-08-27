import { redirect } from "next/navigation";

type LegacyTripDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function LegacyTripDetailPage({
  params,
}: LegacyTripDetailPageProps) {
  const { id } = await params;

  redirect(`/trips/${id}`);
}
