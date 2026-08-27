"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type { Trip } from "@/services/tripService";

import { TripHistoryItem } from "./TripHistoryItem";

const PAGE_SIZE = 5;

type SortKey = "date" | "budget" | "destination";
type SortDirection = "asc" | "desc";

const sortOptions: Array<{
  key: SortKey;
  label: string;
}> = [
  { key: "date", label: "Tanggal" },
  { key: "budget", label: "Biaya" },
  { key: "destination", label: "Tujuan" },
];

export function TripHistoryList({ trips }: { trips: Trip[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);

  const filteredTrips = useMemo(() => {
    const normalizedSearchQuery = searchQuery.trim().toLowerCase();

    if (!normalizedSearchQuery) {
      return trips;
    }

    return trips.filter((trip) => {
      const searchableFields = [trip.destination, trip.category]
        .join(" ")
        .toLowerCase();

      return searchableFields.includes(normalizedSearchQuery);
    });
  }, [searchQuery, trips]);

  const sortedTrips = useMemo(() => {
    return [...filteredTrips].sort((firstTrip, secondTrip) => {
      const directionMultiplier = sortDirection === "asc" ? 1 : -1;

      if (sortKey === "budget") {
        return (firstTrip.budget - secondTrip.budget) * directionMultiplier;
      }

      if (sortKey === "destination") {
        return (
          firstTrip.destination.localeCompare(secondTrip.destination) *
          directionMultiplier
        );
      }

      return (firstTrip.id - secondTrip.id) * directionMultiplier;
    });
  }, [filteredTrips, sortDirection, sortKey]);

  const totalPages = Math.max(1, Math.ceil(sortedTrips.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const visibleTrips = sortedTrips.slice(startIndex, startIndex + PAGE_SIZE);

  function changeSort(nextSortKey: SortKey) {
    setSortKey(nextSortKey);
    setPage(1);
  }

  function toggleSortDirection() {
    setSortDirection((currentDirection) =>
      currentDirection === "asc" ? "desc" : "asc",
    );
    setPage(1);
  }

  function changeSearchQuery(nextSearchQuery: string) {
    setSearchQuery(nextSearchQuery);
    setPage(1);
  }

  if (trips.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">No trips yet</h2>
        <p className="mt-2 text-sm text-slate-500">
          Created trips will appear here.
        </p>
        <Link
          className="mt-5 inline-flex rounded-md bg-[#750014] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#5f0010]"
          href="/"
        >
          Create Trip
        </Link>
      </div>
    );
  }

  return (
    <section>
      <div className="mb-4 flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#750014]">
              Search by city or travel style
            </span>
            <input
              className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-[#750014] focus:ring-4 focus:ring-[#750014]/10 sm:w-72"
              onChange={(event) => changeSearchQuery(event.target.value)}
              placeholder="Search by city or travel style"
              type="search"
              value={searchQuery}
            />
          </label>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#750014]">
              Sort by
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {sortOptions.map((option) => (
                <button
                  className={`rounded-md border px-3 py-2 text-sm font-semibold transition ${
                    sortKey === option.key
                      ? "border-[#750014] bg-[#750014] text-white"
                      : "border-slate-300 bg-white text-slate-700 hover:border-[#750014] hover:text-[#750014]"
                  }`}
                  key={option.key}
                  onClick={() => changeSort(option.key)}
                  type="button"
                >
                  {option.label}
                </button>
              ))}
              <button
                aria-label={
                  sortDirection === "asc"
                    ? "Sort ascending"
                    : "Sort descending"
                }
                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 transition hover:border-[#750014] hover:text-[#750014]"
                onClick={toggleSortDirection}
                title={sortDirection === "asc" ? "Ascending" : "Descending"}
                type="button"
              >
                {sortDirection === "asc" ? (
                  <ArrowUpIcon className="h-4 w-4" />
                ) : (
                  <ArrowDownIcon className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        <p className="text-sm text-slate-500">
          Showing {visibleTrips.length > 0 ? startIndex + 1 : 0}-
          {startIndex + visibleTrips.length} of {sortedTrips.length}
        </p>
      </div>

      {visibleTrips.length > 0 ? (
        <div className="space-y-3">
          {visibleTrips.map((trip) => (
            <TripHistoryItem key={trip.id} trip={trip} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">No matching trips</h2>
          <p className="mt-2 text-sm text-slate-500">
            Try another destination or travel style keyword.
          </p>
        </div>
      )}

      <div className="mt-5 flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium text-slate-600">
          Page {currentPage} of {totalPages}
        </p>

        <div className="flex items-center gap-2">
          <button
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[#750014] hover:text-[#750014] disabled:cursor-not-allowed disabled:opacity-50"
            disabled={currentPage === 1}
            onClick={() => setPage((previousPage) => previousPage - 1)}
            type="button"
          >
            Previous
          </button>
          <button
            className="rounded-md bg-[#750014] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#5f0010] disabled:cursor-not-allowed disabled:bg-slate-400"
            disabled={currentPage === totalPages}
            onClick={() => setPage((previousPage) => previousPage + 1)}
            type="button"
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}

function ArrowUpIcon({ className }: { className: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 19V5M6 11l6-6 6 6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function ArrowDownIcon({ className }: { className: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 5v14M18 13l-6 6-6-6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}
