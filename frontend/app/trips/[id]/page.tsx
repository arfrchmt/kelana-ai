"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

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
import { getAccessToken } from "@/services/authService";
import {
  deleteTrip,
  getTrip,
  type Trip,
  updateTrip,
} from "@/services/tripService";

export default function TripDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [destination, setDestination] = useState("");
  const [days, setDays] = useState("");
  const [budget, setBudget] = useState("");
  const [travelStyle, setTravelStyle] = useState("");

  useEffect(() => {
    async function loadTrip() {
      const tripId = Number(params.id);
      setError("");

      if (!Number.isInteger(tripId) || tripId <= 0) {
        setError("Trip not found");
        setIsLoading(false);
        return;
      }

      if (!getAccessToken()) {
        setError("Please login to view trip details");
        setIsLoading(false);
        return;
      }

      try {
        const loadedTrip = await getTrip(tripId);
        setTrip(loadedTrip);
        setDestination(loadedTrip.destination);
        setDays(String(loadedTrip.days));
        setBudget(String(loadedTrip.budget));
        setTravelStyle(loadedTrip.category);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch trip");
      } finally {
        setIsLoading(false);
      }
    }

    loadTrip();
  }, [params.id]);

  async function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!trip) {
      return;
    }

    setError("");
    setMessage("");
    setIsSaving(true);

    try {
      const updatedTrip = await updateTrip(trip.id, {
        destination,
        days: Number(days),
        budget: Number(budget),
        travel_style: travelStyle,
      });
      setTrip(updatedTrip);
      setDestination(updatedTrip.destination);
      setDays(String(updatedTrip.days));
      setBudget(String(updatedTrip.budget));
      setTravelStyle(updatedTrip.category);
      setIsEditing(false);
      setMessage("Trip updated successfully");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update trip");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!trip) {
      return;
    }

    setError("");
    setMessage("");
    setIsDeleting(true);

    try {
      await deleteTrip(trip.id);
      router.push("/trips");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete trip");
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
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

      {isLoading ? (
        <section className="rounded-lg border border-slate-200 bg-white p-6 text-sm font-medium text-slate-600 shadow-sm">
          Loading trip detail...
        </section>
      ) : error || !trip ? (
        <section className="rounded-lg border border-red-200 bg-red-50 p-6 shadow-sm">
          <p className="text-sm font-medium text-red-700">
            {error || "Trip not found"}
          </p>
          <Link
            className="mt-4 inline-flex rounded-md bg-[#750014] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#5f0010]"
            href="/login"
          >
            Login
          </Link>
        </section>
      ) : (
        <>
          <TripDetailHero destination={trip.destination} />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link
              className="inline-flex items-center text-sm font-semibold text-[#750014] underline-offset-4 hover:underline"
              href="/trips"
            >
              &lt;- Back to Trips
            </Link>

            <div className="flex flex-wrap gap-2">
              <button
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-[#750014] hover:text-[#750014]"
                onClick={() => setIsEditing((current) => !current)}
                type="button"
              >
                {isEditing ? "Cancel Update" : "Update Trip"}
              </button>
              <button
                className="rounded-md bg-red-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                disabled={isDeleting}
                onClick={() => setIsDeleteDialogOpen(true)}
                type="button"
              >
                {isDeleting ? "Deleting..." : "Delete Trip"}
              </button>
            </div>
          </div>

          {message ? (
            <p className="mt-5 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-700">
              {message}
            </p>
          ) : null}

          {error ? (
            <p className="mt-5 rounded-md border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
              {error}
            </p>
          ) : null}

          {isEditing ? (
            <form
              className="mt-5 grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2 sm:p-6"
              onSubmit={handleUpdate}
            >
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Destination
                <input
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-950 outline-none transition focus:border-[#750014] focus:ring-4 focus:ring-[#750014]/10"
                  onChange={(event) => setDestination(event.target.value)}
                  required
                  value={destination}
                />
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Days
                <input
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-950 outline-none transition focus:border-[#750014] focus:ring-4 focus:ring-[#750014]/10"
                  min="1"
                  onChange={(event) => setDays(event.target.value)}
                  required
                  type="number"
                  value={days}
                />
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Budget (USD)
                <input
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-950 outline-none transition focus:border-[#750014] focus:ring-4 focus:ring-[#750014]/10"
                  min="1"
                  onChange={(event) => setBudget(event.target.value)}
                  required
                  step="0.01"
                  type="number"
                  value={budget}
                />
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Travel style
                <select
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-950 outline-none transition focus:border-[#750014] focus:ring-4 focus:ring-[#750014]/10"
                  onChange={(event) => setTravelStyle(event.target.value)}
                  required
                  value={travelStyle}
                >
                  <option value="Family">Family</option>
                  <option value="Backpacker">Backpacker</option>
                  <option value="Standard">Standard</option>
                  <option value="Luxury">Luxury</option>
                </select>
              </label>

              <button
                className="rounded-md bg-[#750014] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#5f0010] disabled:cursor-not-allowed disabled:bg-slate-400 sm:col-span-2"
                disabled={isSaving}
                type="submit"
              >
                {isSaving ? "Saving..." : "Save Update"}
              </button>
            </form>
          ) : null}

          <TripDetailSummary trip={trip} />
          <TripRecommendation recommendation={trip.ai_recommendation} />

          {isDeleteDialogOpen ? (
            <div
              aria-labelledby="delete-trip-title"
              aria-modal="true"
              className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 px-4 backdrop-blur-[2px]"
              role="dialog"
            >
              <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-5 text-slate-950 shadow-2xl sm:p-6">
                <div className="flex items-start gap-4">
                  <div
                    aria-hidden="true"
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-red-50 text-red-700"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h2
                      className="text-lg font-semibold text-slate-950"
                      id="delete-trip-title"
                    >
                      Delete trip?
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      This will remove {trip.destination} from your trip
                      history. The record is kept safely as inactive.
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button
                    className="rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={isDeleting}
                    onClick={() => setIsDeleteDialogOpen(false)}
                    type="button"
                  >
                    Cancel
                  </button>
                  <button
                    className="rounded-md bg-red-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                    disabled={isDeleting}
                    onClick={handleDelete}
                    type="button"
                  >
                    {isDeleting ? "Deleting..." : "Delete Trip"}
                  </button>
                </div>
              </section>
            </div>
          ) : null}
        </>
      )}
    </TripPageShell>
  );
}

function TrashIcon({ className }: { className: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}
