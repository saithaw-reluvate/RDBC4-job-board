const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** "Today", "3 days ago", "2 months ago". */
export function formatRelativeDate(iso: string): string {
  const elapsed = Date.now() - new Date(iso).getTime();

  if (elapsed < HOUR) return "Just now";
  if (elapsed < DAY) return "Today";

  const days = Math.floor(elapsed / DAY);
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;

  const months = Math.floor(days / 30);
  if (months === 1) return "1 month ago";
  if (months < 12) return `${months} months ago`;

  const years = Math.floor(months / 12);
  return years === 1 ? "1 year ago" : `${years} years ago`;
}

/** "12 Mar 2026". */
export function formatAbsoluteDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
