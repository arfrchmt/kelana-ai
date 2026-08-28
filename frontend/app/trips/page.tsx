"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { TripHistoryList } from "@/components/trips/TripHistoryList";
import {
  TripBreadcrumb,
  TripHeader,
  TripHistoryHero,
  TripPageShell,
} from "@/components/trips/TripLayout";
import { getAccessToken } from "@/services/authService";
import { getTrips, type Trip } from "@/services/tripService";

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadTrips() {
      setError("");

      if (!getAccessToken()) {
        setError("Please login to view trip history");
        setIsLoading(false);
        return;
      }

      try {
        setTrips(await getTrips());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch trips");
      } finally {
        setIsLoading(false);
      }
    }

    loadTrips();
  }, []);

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

      {isLoading ? (
        <section className="rounded-lg border border-slate-200 bg-white p-6 text-sm font-medium text-slate-600 shadow-sm">
          Loading trip history...
        </section>
      ) : error ? (
        <section className="rounded-lg border border-red-200 bg-red-50 p-6 shadow-sm">
          <p className="text-sm font-medium text-red-700">{error}</p>
          <Link
            className="mt-4 inline-flex rounded-md bg-[#750014] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#5f0010]"
            href="/login"
          >
            Login
          </Link>
        </section>
      ) : (
        <TripHistoryList trips={trips} />
      )}
    </TripPageShell>
  );
}
