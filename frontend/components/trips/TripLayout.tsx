import Link from "next/link";
import type { ReactNode } from "react";

type BreadcrumbItem = {
  href?: string;
  label: string;
};

export function TripPageShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-950 sm:px-6 sm:py-8 lg:px-8">
      <section className="mx-auto w-full max-w-7xl">{children}</section>
    </main>
  );
}

export function TripHeader() {
  return (
    <header className="mb-6 flex items-center justify-between gap-4 border-b border-slate-200 pb-5">
      <Link className="text-xl font-semibold text-slate-950" href="/">
        Kelana AI
      </Link>
      <Link
        className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-[#750014] hover:text-[#750014]"
        href="/trips"
      >
        Trip History
      </Link>
    </header>
  );
}

export function TripBreadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-500">
        {items.map((item, index) => {
          const isLastItem = index === items.length - 1;

          return (
            <li className="flex items-center gap-2" key={item.label}>
              {item.href && !isLastItem ? (
                <Link
                  className="text-slate-600 underline-offset-4 transition hover:text-[#750014] hover:underline"
                  href={item.href}
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={isLastItem ? "page" : undefined}
                  className={isLastItem ? "font-semibold text-[#750014]" : ""}
                >
                  {item.label}
                </span>
              )}
              {!isLastItem ? <span aria-hidden="true">&gt;</span> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function TripHistoryHero({ totalTrips }: { totalTrips: number }) {
  return (
    <section className="mb-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[#750014]">
            Holiday archive
          </p>
          <h1 className="mt-2 text-3xl font-semibold leading-tight text-slate-950">
            Trip History
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
            Review saved itineraries, compare budgets, and reopen each trip
            plan whenever you need it.
          </p>
          <p className="mt-4 text-sm font-semibold text-slate-700">
            {totalTrips} saved itinerar{totalTrips === 1 ? "y" : "ies"}
          </p>
        </div>

        <HolidayCartoon />
      </div>
    </section>
  );
}

export function TripDetailHero({ destination }: { destination: string }) {
  const tone = getDestinationTone(destination);
  const destinationImageUrl = getDestinationImageUrl(destination);

  return (
    <section
      className="mb-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
    >
      <div
        className="relative min-h-72 bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(255,255,255,0.96), rgba(255,255,255,0.78), rgba(255,255,255,0.18)), url("${destinationImageUrl}")`,
        }}
      >
        <div className="flex min-h-72 max-w-3xl flex-col justify-center p-5 sm:p-7">
          <p className="text-sm font-semibold uppercase tracking-wide text-[#750014]">
            Destination detail
          </p>
          <h1 className="mt-2 text-3xl font-semibold leading-tight text-slate-950 sm:text-4xl">
            {tone.heading}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            {tone.copy}
          </p>
          <p className="mt-4 w-fit rounded-md bg-[#750014] px-3 py-2 text-sm font-semibold text-white shadow-sm">
            {tone.label}
          </p>
        </div>
      </div>
    </section>
  );
}

function HolidayCartoon() {
  return (
    <div
      aria-hidden="true"
      className="relative min-h-44 overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
    >
      <div className="absolute left-5 top-5 h-14 w-14 rounded-full bg-[#750014]/15" />
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-[#750014]/10" />
      <div className="absolute bottom-10 left-8 h-14 w-28 rounded-t-full border-4 border-[#750014] border-b-0" />
      <div className="absolute bottom-9 left-10 h-4 w-24 rounded-full bg-[#750014]" />
      <div className="absolute bottom-16 left-28 h-20 w-3 rotate-12 rounded-full bg-slate-700" />
      <div className="absolute bottom-[7.5rem] left-20 h-12 w-20 -rotate-12 rounded-full bg-[#750014]/20" />
      <div className="absolute bottom-28 left-[7.5rem] h-12 w-20 rotate-12 rounded-full bg-[#750014]/20" />
      <div className="absolute bottom-8 right-9 h-24 w-20 rounded-t-full border-4 border-slate-700 bg-white" />
      <div className="absolute bottom-20 right-14 h-8 w-8 rounded-full bg-[#750014]/15" />
      <div className="absolute bottom-8 right-[5.5rem] h-8 w-5 rounded-sm bg-[#750014]" />
      <div className="absolute bottom-8 right-9 h-8 w-5 rounded-sm bg-[#750014]" />
      <div className="absolute bottom-5 right-5 h-4 w-36 rounded-full bg-slate-200" />
    </div>
  );
}

function getDestinationTone(destination: string) {
  const normalizedDestination = destination.trim().toLowerCase();

  if (normalizedDestination.includes("japan") || normalizedDestination.includes("tokyo")) {
    return {
      background: "bg-[linear-gradient(135deg,#ffffff,#fff1f3)]",
      copy: "Open the itinerary with transport notes, daily budget, and AI recommendations tuned for a Japan city break.",
      heading: `${destination} itinerary`,
      label: "City route",
    };
  }

  if (normalizedDestination.includes("bali")) {
    return {
      background: "bg-[linear-gradient(135deg,#ffffff,#f7f2ee)]",
      copy: "Revisit the beach days, local food ideas, and spending plan for this Bali trip.",
      heading: `${destination} escape`,
      label: "Island days",
    };
  }

  if (normalizedDestination.includes("singapore")) {
    return {
      background: "bg-[linear-gradient(135deg,#ffffff,#eef6f8)]",
      copy: "Check the city itinerary, budget summary, and recommendations for an efficient Singapore visit.",
      heading: `${destination} city plan`,
      label: "Urban trip",
    };
  }

  return {
    background: "bg-[linear-gradient(135deg,#ffffff,#f8fafc)]",
    copy: `Review the saved itinerary, budget context, and AI recommendations for ${destination}.`,
    heading: `${destination} trip plan`,
    label: "Saved plan",
  };
}

function getDestinationImageUrl(destination: string) {
  const keywords = destination
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map(encodeURIComponent)
    .join(",");
  const searchKeywords = keywords ? `${keywords},city,travel` : "travel,city";

  return `https://loremflickr.com/1200/420/${searchKeywords}?lock=${hashDestination(
    destination,
  )}`;
}

function hashDestination(destination: string) {
  return Math.abs(
    destination.split("").reduce((hash, character) => {
      return (hash << 5) - hash + character.charCodeAt(0);
    }, 0),
  );
}
