export function naira(amount: number): string {
  return `₦${amount.toLocaleString("en-NG")}`;
}

export function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
  });
}

export function shortDate(ts: number): string {
  return new Date(ts).toLocaleDateString("en-NG", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

/** Customer-facing tracking ID, e.g. TPP-K3F9A */
export function orderRef(id: string): string {
  return `TPP-${id.slice(-5).toUpperCase()}`;
}

/** Normalizes "tpp-k3f9a", "#K3F9A", "TPPK3F9A" etc. to the 5-char suffix. */
export function normalizeTrackingInput(input: string): string {
  return input
    .trim()
    .toUpperCase()
    .replace(/^#?\s*TPP[-\s]?/, "")
    .replace(/[^A-Z0-9]/g, "")
    .slice(-5);
}
