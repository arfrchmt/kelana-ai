export function TripBadge({ category }: { category: string }) {
  const tone = getCategoryTone(category);

  return (
    <span
      className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold leading-none ${tone.badge}`}
    >
      <TravelStyleIcon name={tone.icon} />
      {category}
    </span>
  );
}

export function getCategoryTone(category: string) {
  const normalizedCategory = category.trim().toLowerCase();

  if (normalizedCategory === "backpacker") {
    return {
      badge: "bg-[#750014]/10 text-[#750014]",
      icon: "backpack",
      iconBackground: "bg-[#750014]/10",
      iconColor: "text-[#750014]",
    };
  }

  if (normalizedCategory === "luxury") {
    return {
      badge: "bg-slate-100 text-slate-800",
      icon: "sparkle",
      iconBackground: "bg-slate-100",
      iconColor: "text-slate-700",
    };
  }

  if (normalizedCategory === "standard") {
    return {
      badge: "bg-slate-200 text-slate-800",
      icon: "check",
      iconBackground: "bg-slate-100",
      iconColor: "text-slate-700",
    };
  }

  return {
    badge: "bg-[#750014]/10 text-[#750014]",
    icon: "group",
    iconBackground: "bg-[#750014]/10",
    iconColor: "text-[#750014]",
  };
}

function TravelStyleIcon({ name }: { name: string }) {
  if (name === "backpack") {
    return (
      <svg
        aria-hidden="true"
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M9 7V6a3 3 0 0 1 6 0v1M7 10h10M8 7h8a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3v-8a3 3 0 0 1 3-3ZM8 14h3"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </svg>
    );
  }

  if (name === "sparkle") {
    return (
      <svg
        aria-hidden="true"
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3ZM18 15l.8 2.2L21 18l-2.2.8L18 21l-.8-2.2L15 18l2.2-.8L18 15Z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </svg>
    );
  }

  if (name === "check") {
    return (
      <svg
        aria-hidden="true"
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="m5 12 4 4L19 6"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3 20a5 5 0 0 1 10 0M11 20a5 5 0 0 1 10 0"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}
