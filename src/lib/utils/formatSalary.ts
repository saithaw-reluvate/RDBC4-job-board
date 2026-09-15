import type { Job, SalaryPeriod } from "@/types/job";

const PERIOD_LABEL: Record<SalaryPeriod, string> = {
  year: "yr",
  month: "mo",
  hour: "hr",
};

function compact(amount: number): string {
  if (amount >= 1000 && amount % 1000 === 0) return `${amount / 1000}k`;
  if (amount >= 1000) return `${(amount / 1000).toFixed(1)}k`;
  return String(amount);
}

function symbolFor(currency: string): string {
  const symbols: Record<string, string> = { USD: "$", GBP: "£", EUR: "€" };
  return symbols[currency] ?? `${currency} `;
}

/** "$120k – $160k / yr". */
export function formatSalaryRange(
  job: Pick<Job, "salaryMin" | "salaryMax" | "salaryCurrency" | "salaryPeriod">,
): string {
  const symbol = symbolFor(job.salaryCurrency);
  const period = PERIOD_LABEL[job.salaryPeriod];
  const min = `${symbol}${compact(job.salaryMin)}`;

  if (job.salaryMax === job.salaryMin) return `${min} / ${period}`;
  return `${min} – ${symbol}${compact(job.salaryMax)} / ${period}`;
}
