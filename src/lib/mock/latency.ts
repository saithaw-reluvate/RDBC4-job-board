/**
 * Simulated network latency so real loading states are built and visible during
 * Frontend V1. Deleted along with the rest of `lib/mock/` at backend integration.
 */
export function delay(min = 200, max = 400): Promise<void> {
  const ms = min + Math.random() * (max - min);
  return new Promise((resolve) => setTimeout(resolve, ms));
}
