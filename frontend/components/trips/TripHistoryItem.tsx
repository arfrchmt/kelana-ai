import Link from "next/link";

import type { Trip } from "@/services/tripService";

import { getCategoryTone, TripBadge } from "./TripBadge";
import { formatAmount } from "./format";

export function TripHistoryItem({ trip }: { trip: Trip }) {
  const categoryTone = getCategoryTone(trip.category);

  return (
    <article className="flex min-h-20 items-center gap-4 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm transition hover:border-[#750014]/40 hover:shadow-md sm:px-5">
      <div
        aria-hidden="true"
        className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${categoryTone.iconBackground}`}
      >
        <BusIcon className={`h-7 w-7 ${categoryTone.iconColor}`} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
          <h2 className="max-w-full truncate text-base font-bold text-slate-950">
            {trip.destination}
          </h2>
          <TripBadge category={trip.category} />
        </div>
        <p className="mt-1 truncate text-sm text-slate-600 sm:text-base">
          {trip.days} days &middot; USD {formatAmount(trip.budget)} &middot; USD{" "}
          {formatAmount(trip.daily_budget)}/day
        </p>
      </div>

      <Link
        className="ml-auto inline-flex shrink-0 items-center justify-center rounded-md bg-[#750014] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#5f0010] sm:min-w-40 sm:px-6"
        href={`/trips/${trip.id}`}
      >
        <span className="hidden sm:inline">View Details</span>
        <span className="sm:hidden">Details</span>
        <span className="ml-2 text-base leading-none" aria-hidden="true">
          -&gt;
        </span>
      </Link>
    </article>
  );
}

function BusIcon({ className }: { className: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        height="12"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="2"
        width="16"
        x="4"
        y="5"
      />
      <path
        d="M4 10h16M8 17v2M16 17v2M8 14h.01M16 14h.01M8 8h8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}
