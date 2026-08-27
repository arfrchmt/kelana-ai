import type { Trip } from "@/services/tripService";

import { TripBadge } from "./TripBadge";
import { formatAmount } from "./format";

export function TripDetailSummary({ trip }: { trip: Trip }) {
  return (
    <section className="mt-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[#750014]">
            Trip Detail
          </p>
          <h1 className="mt-2 text-3xl font-bold leading-tight text-slate-950">
            {trip.destination}
          </h1>
        </div>
        <TripBadge category={trip.category} />
      </div>

      <dl className="mt-7 grid gap-3 sm:grid-cols-3">
        <DetailStat label="Destination" value={trip.destination} />
        <DetailStat label="Budget" value={`USD ${formatAmount(trip.budget)}`} />
        <DetailStat label="Category" value={trip.category} />
        <DetailStat label="Days" value={`${trip.days} days`} />
        <DetailStat
          label="Daily budget"
          value={`USD ${formatAmount(trip.daily_budget)}`}
        />
      </dl>
    </section>
  );
}

export function TripRecommendation({ recommendation }: { recommendation: string | null }) {
  return (
    <section className="mt-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center gap-4">
        <h2 className="shrink-0 text-sm font-semibold uppercase tracking-wide text-[#750014]">
          AI Recommendation
        </h2>
        <div className="h-px flex-1 bg-slate-200" />
      </div>
      <div className="mt-4 space-y-2">
        {getRecommendationRows(recommendation).map((row, index) => (
          <p
            className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700 sm:text-base"
            key={`${index}-${row.slice(0, 12)}`}
          >
            {row}
          </p>
        ))}
      </div>
    </section>
  );
}

function DetailStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
      <dt className="text-xs font-semibold uppercase tracking-wide text-[#750014]">
        {label}
      </dt>
      <dd className="mt-1 text-lg font-medium text-slate-950">{value}</dd>
    </div>
  );
}

function getRecommendationRows(recommendation: string | null) {
  if (!recommendation) {
    return ["No recommendation available."];
  }

  return recommendation
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 8);
}
