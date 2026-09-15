/** Locations offered in the job form and the location filter. */
export const JOB_LOCATIONS = [
  "Remote",
  "Bangkok, Thailand",
  "Singapore",
  "London, UK",
  "Berlin, Germany",
  "New York, NY",
  "San Francisco, CA",
  "Sydney, Australia",
] as const;

export type JobLocation = (typeof JOB_LOCATIONS)[number];
