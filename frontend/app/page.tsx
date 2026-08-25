"use client";

import { FormEvent, ReactNode, useEffect, useState } from "react";

type TripResult = {
  destination: string;
  budget: number;
  travel_style?: string;
  category?: string;
  ai_recommendation?: string | null;
};

function renderInlineMarkdown(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }

    return <span key={index}>{part}</span>;
  });
}

function renderMarkdown(markdown: string) {
  const lines = markdown.split("\n").filter((line) => line.trim().length > 0);
  const elements: ReactNode[] = [];
  let listItems: ReactNode[] = [];
  let listType: "ul" | "ol" | null = null;

  function flushList() {
    if (!listType || listItems.length === 0) {
      return;
    }

    const className =
      listType === "ol"
        ? "ml-5 list-decimal space-y-1"
        : "ml-5 list-disc space-y-1";

    elements.push(
      listType === "ol" ? (
        <ol className={className} key={`list-${elements.length}`}>
          {listItems}
        </ol>
      ) : (
        <ul className={className} key={`list-${elements.length}`}>
          {listItems}
        </ul>
      ),
    );
    listItems = [];
    listType = null;
  }

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    const bulletMatch = trimmed.match(/^[-*]\s+(.+)/);
    const numberMatch = trimmed.match(/^\d+\.\s+(.+)/);

    if (bulletMatch || numberMatch) {
      const nextListType = numberMatch ? "ol" : "ul";
      if (listType && listType !== nextListType) {
        flushList();
      }

      listType = nextListType;
      listItems.push(
        <li key={`item-${index}`}>
          {renderInlineMarkdown((bulletMatch ?? numberMatch)?.[1] ?? "")}
        </li>,
      );
      return;
    }

    flushList();

    if (trimmed.startsWith("### ")) {
      elements.push(
        <h4 className="mt-5 text-base font-semibold text-slate-950" key={index}>
          {renderInlineMarkdown(trimmed.replace("### ", ""))}
        </h4>,
      );
      return;
    }

    if (trimmed.startsWith("## ")) {
      elements.push(
        <h3 className="mt-6 text-xl font-semibold text-slate-950" key={index}>
          {renderInlineMarkdown(trimmed.replace("## ", ""))}
        </h3>,
      );
      return;
    }

    if (trimmed.startsWith("# ")) {
      elements.push(
        <h2 className="mt-6 text-2xl font-semibold text-slate-950" key={index}>
          {renderInlineMarkdown(trimmed.replace("# ", ""))}
        </h2>,
      );
      return;
    }

    elements.push(
      <p className="leading-7 text-slate-700" key={index}>
        {renderInlineMarkdown(trimmed)}
      </p>,
    );
  });

  flushList();

  return elements;
}

function getLocalFoodImageUrl(destination: string) {
  const normalizedDestination = destination.trim().toLowerCase();
  const foodImages: Record<string, string> = {
    bali: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=900&q=80",
    indonesia:
      "https://images.unsplash.com/photo-1562607635-46033eebcba9?auto=format&fit=crop&w=900&q=80",
    japan:
      "https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?auto=format&fit=crop&w=900&q=80",
    tokyo:
      "https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=900&q=80",
    paris:
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=900&q=80",
    italy:
      "https://images.unsplash.com/photo-1498579150354-977475b7ea0b?auto=format&fit=crop&w=900&q=80",
  };

  const matchedDestination = Object.keys(foodImages).find((key) =>
    normalizedDestination.includes(key),
  );

  return matchedDestination
    ? foodImages[matchedDestination]
    : "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80";
}

function getDestinationHeroImageUrl(destination: string) {
  const normalizedDestination = destination.trim().toLowerCase();
  const destinationImages: Record<string, string> = {
    bali: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1800&q=80",
    indonesia:
      "https://images.unsplash.com/photo-1539367628448-4bc5c9d171c8?auto=format&fit=crop&w=1800&q=80",
    japan:
      "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?auto=format&fit=crop&w=1800&q=80",
    tokyo:
      "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1800&q=80",
    paris:
      "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1800&q=80",
    london:
      "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1800&q=80",
    italy:
      "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=1800&q=80",
    rome: "https://images.unsplash.com/photo-1529260830199-42c24126f198?auto=format&fit=crop&w=1800&q=80",
    singapore:
      "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=1800&q=80",
    "new york":
      "https://images.unsplash.com/photo-1485871981521-5b1fd3805eee?auto=format&fit=crop&w=1800&q=80",
    jepang:
      "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?auto=format&fit=crop&w=1800&q=80",
  };

  const matchedDestination = Object.keys(destinationImages).find((key) =>
    normalizedDestination.includes(key),
  );

  if (matchedDestination) {
    return destinationImages[matchedDestination];
  }

  if (normalizedDestination) {
    return `https://loremflickr.com/1600/600/${encodeURIComponent(
      `${normalizedDestination},travel`,
    )}`;
  }

  return "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1800&q=80";
}

export default function Home() {
  const [destination, setDestination] = useState("");
  const [heroDestination, setHeroDestination] = useState("");
  const [days, setDays] = useState("3");
  const [budget, setBudget] = useState("");
  const [travelStyle, setTravelStyle] = useState("Family");
  const [result, setResult] = useState<TripResult | null>(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const heroImageUrl = getDestinationHeroImageUrl(heroDestination);
  const [loadedHeroImageUrl, setLoadedHeroImageUrl] = useState("");
  const heroImageLoaded = loadedHeroImageUrl === heroImageUrl;

  useEffect(() => {
    let isCancelled = false;
    const image = new window.Image();
    image.onload = () => {
      if (!isCancelled) {
        setLoadedHeroImageUrl(heroImageUrl);
      }
    };
    image.onerror = () => {
      if (!isCancelled) {
        setLoadedHeroImageUrl(heroImageUrl);
      }
    };
    image.src = heroImageUrl;

    return () => {
      isCancelled = true;
    };
  }, [heroImageUrl]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setResult(null);
    setHeroDestination(destination.trim());
    setIsSubmitting(true);

    try {
      const response = await fetch("http://localhost:8000/api/v1/trips", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          destination,
          budget: Number(budget),
          days: Number(days),
          travel_style: travelStyle,
          recommendations: "",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create trip");
      }

      const data = (await response.json()) as TripResult;
      setResult({
        ...data,
        travel_style: data.travel_style ?? travelStyle,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative min-h-screen bg-slate-50 px-4 py-6 text-slate-950 sm:px-6 sm:py-8 lg:px-8">
      {isSubmitting ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-white/55 px-6 backdrop-blur-[1px]">
          <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white/95 p-8 text-center shadow-2xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#750014]">
              Loading
            </p>
            <div className="mx-auto mb-5 h-2 w-full overflow-hidden rounded-full bg-slate-200">
              <div className="h-full w-1/2 animate-pulse rounded-full bg-[#750014]" />
            </div>
            <p className="text-2xl font-semibold text-slate-950">
              Creating Trip...
            </p>
          </div>
        </div>
      ) : null}

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 sm:gap-8">
        <header className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div
            aria-label="Destination hero image"
            className="relative min-h-[220px] bg-cover bg-center sm:min-h-[340px]"
            key={heroImageUrl}
            role="img"
            style={{
              backgroundImage: `linear-gradient(90deg, rgba(0,0,0,0.72), rgba(0,0,0,0.28), rgba(0,0,0,0.08)), url("${heroImageUrl}")`,
            }}
          >
            {!heroImageLoaded ? (
              <div className="absolute inset-0 z-10 flex items-end bg-slate-950/20 p-6 sm:p-10">
                <div className="w-full max-w-sm rounded-lg border border-white/20 bg-white/75 p-4 shadow-lg backdrop-blur-[1px]">
                  <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full w-2/3 animate-pulse rounded-full bg-[#750014]" />
                  </div>
                </div>
              </div>
            ) : null}
            <div className="flex min-h-[220px] max-w-3xl flex-col justify-end p-5 text-white sm:min-h-[340px] sm:p-10">
              <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/80">
                Travel planner
              </p>
              <h1 className="text-3xl font-semibold leading-tight sm:text-6xl">
                Kelana AI
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-white/85">
                Generate a structured trip plan with budget context, travel
                style, and local food recommendations.
              </p>
            </div>
          </div>
        </header>

        <div className="grid min-w-0 gap-6 sm:gap-8 lg:grid-cols-[minmax(320px,420px)_minmax(0,1fr)] lg:items-start">
          <form
            onSubmit={handleSubmit}
            className="flex w-full min-w-0 flex-col gap-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
          >
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Destination
              <input
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-950 outline-none transition focus:border-[#750014] focus:ring-4 focus:ring-[#750014]/10"
                value={destination}
                onChange={(event) => setDestination(event.target.value)}
                onBlur={() => setHeroDestination(destination.trim())}
                placeholder="Tokyo"
                required
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Days
              <input
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-950 outline-none transition focus:border-[#750014] focus:ring-4 focus:ring-[#750014]/10"
                type="number"
                min="1"
                value={days}
                onChange={(event) => setDays(event.target.value)}
                required
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Budget (USD)
              <input
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-950 outline-none transition focus:border-[#750014] focus:ring-4 focus:ring-[#750014]/10"
                type="number"
                min="1"
                step="0.01"
                value={budget}
                onChange={(event) => setBudget(event.target.value)}
                placeholder="1500"
                required
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Travel style
              <select
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-950 outline-none transition focus:border-[#750014] focus:ring-4 focus:ring-[#750014]/10"
                value={travelStyle}
                onChange={(event) => setTravelStyle(event.target.value)}
                required
              >
                <option value="Family">Family</option>
                <option value="Backpacker">Backpacker</option>
                <option value="Standard">Standard</option>
                <option value="Luxury">Luxury</option>
              </select>
            </label>

            <button
              className="mt-1 w-full rounded-md bg-[#750014] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#5f0010] focus:outline-none focus:ring-4 focus:ring-[#750014]/20 disabled:cursor-not-allowed disabled:bg-slate-400"
              type="submit"
              disabled={isSubmitting}
            >
              Submit
            </button>
          </form>

          <aside className="min-w-0 space-y-4 lg:sticky lg:top-8">
            {error ? (
              <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
                {error}
              </p>
            ) : null}

            {result ? (
              <section className="min-w-0 rounded-lg border border-slate-200 bg-white p-5 text-slate-950 shadow-sm sm:p-6">
                <h2 className="mb-5 text-2xl font-semibold leading-tight text-slate-950">
                  AI Trip Plan
                </h2>
                <dl className="grid gap-3 border-y border-slate-200 py-4 md:grid-cols-3">
                  <div className="rounded-md bg-slate-50 p-4">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-[#750014]">
                      Destination
                    </dt>
                    <dd className="mt-1 text-lg font-semibold text-slate-950">
                      {result.destination}
                    </dd>
                  </div>
                  <div className="rounded-md bg-slate-50 p-4">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-[#750014]">
                      Budget
                    </dt>
                    <dd className="mt-1 text-lg font-semibold text-slate-950">
                      {result.budget} USD
                    </dd>
                  </div>
                  <div className="rounded-md bg-slate-50 p-4">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-[#750014]">
                      Travel style
                    </dt>
                    <dd className="mt-1 text-lg font-semibold text-slate-950">
                      {result.travel_style ?? result.category ?? "Unknown"}
                    </dd>
                  </div>
                </dl>

                <div className="mt-6">
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#750014]">
                    Generative AI Output
                  </h3>
                  <div className="max-h-[60vh] overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800">
                    <figure className="mb-5 overflow-hidden rounded-md border border-slate-200 bg-white">
                      <div
                        aria-label={`${result.destination} local food thumbnail`}
                        className="h-44 w-full bg-cover bg-center"
                        role="img"
                        style={{
                          backgroundImage: `url("${getLocalFoodImageUrl(
                            result.destination,
                          )}")`,
                        }}
                      />
                      <figcaption className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[#750014]">
                        Local food recommendation thumbnail
                      </figcaption>
                    </figure>

                    <div className="space-y-3">
                      {renderMarkdown(
                        result.ai_recommendation ??
                          "AI recommendation is not available in the API response.",
                      )}
                    </div>
                  </div>
                </div>
              </section>
            ) : (
              <section className="rounded-lg border border-dashed border-slate-300 bg-white p-6 shadow-sm">
                <h2 className="text-2xl font-semibold text-slate-950">
                  Trip Detail
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-500">
                  Result will appear here
                </p>
              </section>
            )}
          </aside>
        </div>

        <footer className="border-t border-slate-200 py-6 text-sm text-slate-500">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <p>
              &copy; {new Date().getFullYear()} Kelana AI. All rights reserved.
            </p>

            <nav aria-label="Footer navigation">
              <ul className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-5">
                <li>
                  <a
                    className="font-medium text-slate-600 underline-offset-4 hover:text-[#750014] hover:underline"
                    href="https://www.tripadvisor.com/Attractions"
                    rel="noreferrer"
                    target="_blank"
                  >
                    Travel Agent
                  </a>
                </li>
                <li>
                  <a
                    className="font-medium text-slate-600 underline-offset-4 hover:text-[#750014] hover:underline"
                    href="https://www.booking.com"
                    rel="noreferrer"
                    target="_blank"
                  >
                    Hotels
                  </a>
                </li>
                <li>
                  <a
                    className="font-medium text-slate-600 underline-offset-4 hover:text-[#750014] hover:underline"
                    href="https://www.google.com/travel/flights"
                    rel="noreferrer"
                    target="_blank"
                  >
                    Flights
                  </a>
                </li>
                <li>
                  <a
                    className="font-medium text-[#750014] underline-offset-4 hover:underline"
                    href="mailto:contact@kelana.ai"
                  >
                    contact@kelana.ai
                  </a>
                </li>
              </ul>
            </nav>
          </div>
        </footer>
      </div>
    </main>
  );
}
