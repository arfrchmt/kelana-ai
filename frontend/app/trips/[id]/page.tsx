import Link from "next/link";
import { notFound } from "next/navigation";

import {
  TripDetailSummary,
  TripRecommendation,
} from "@/components/trips/TripDetail";
import {
  TripBreadcrumb,
  TripDetailHero,
  TripHeader,
  TripPageShell,
} from "@/components/trips/TripLayout";
import { getTrip } from "@/services/tripService";

export const dynamic = "force-dynamic";

type TripDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function TripDetailPage({ params }: TripDetailPageProps) {
  const { id } = await params;
  const tripId = Number(id);

  if (!Number.isInteger(tripId) || tripId <= 0) {
    notFound();
  }

  const trip = await getTrip(tripId).catch(() => null);

  if (!trip) {
    notFound();
  }

  return (
    <TripPageShell>
      <TripHeader />
      <TripBreadcrumb
        items={[
          { href: "/", label: "Beranda" },
          { href: "/trips", label: "History" },
          { label: "Detil" },
        ]}
      />

      <TripDetailHero destination={trip.destination} />

      <Link
        className="inline-flex items-center text-sm font-semibold text-[#750014] underline-offset-4 hover:underline"
        href="/trips"
      >
        &lt;- Back to Trips
      </Link>

      <TripDetailSummary trip={trip} />
      <TripRecommendation recommendation={trip.ai_recommendation} />
    </TripPageShell>
  );
}
