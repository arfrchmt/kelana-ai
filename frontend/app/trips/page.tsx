import { TripHistoryList } from "@/components/trips/TripHistoryList";
import {
  TripBreadcrumb,
  TripHeader,
  TripHistoryHero,
  TripPageShell,
} from "@/components/trips/TripLayout";
import { getTrips } from "@/services/tripService";

export const dynamic = "force-dynamic";

export default async function TripsPage() {
  const trips = await getTrips();

  return (
    <TripPageShell>
      <TripHeader />
      <TripBreadcrumb
        items={[
          { href: "/", label: "Beranda" },
          { label: "History" },
        ]}
      />

      <TripHistoryHero totalTrips={trips.length} />
      <TripHistoryList trips={trips} />
    </TripPageShell>
  );
}
