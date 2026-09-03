/**
 * Format an ISO timestamp string or Date object into a user-friendly time format (e.g. "14:30" or "3 Sep, 14:30").
 */
export function formatMessageTime(dateInput?: string | Date | null): string {
  if (!dateInput) return "";

  try {
    const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return "";

    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    // Format hour and minute: "14:30"
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const timeStr = `${hours}:${minutes}`;

    if (isToday) {
      return timeStr;
    }

    const day = date.getDate();
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "Mei",
      "Jun",
      "Jul",
      "Agu",
      "Sep",
      "Okt",
      "Nov",
      "Des",
    ];
    const month = monthNames[date.getMonth()] || "";

    return `${day} ${month}, ${timeStr}`;
  } catch {
    return "";
  }
}
