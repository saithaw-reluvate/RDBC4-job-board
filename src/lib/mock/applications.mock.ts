import type { Application } from "@/types/application";

const DAY = 24 * 60 * 60 * 1000;
const daysAgo = (n: number): string => new Date(Date.now() - n * DAY).toISOString();

/**
 * Seeded applications for the demo employer's jobs.
 * job-008 deliberately has none, so the drawer's empty state is reachable.
 */
export const seedApplications: Application[] = [
  {
    id: "app-001",
    jobId: "job-001",
    applicantName: "Maya Lindqvist",
    applicantEmail: "maya.lindqvist@example.com",
    coverLetter:
      "I have spent the last six years building design systems and component libraries for products with large accessibility requirements, most recently leading the frontend rebuild of a healthcare booking platform. What draws me to this role is the emphasis on ownership of the component architecture — that is the work I do best and enjoy most. I would bring immediate depth in TypeScript, Next.js App Router, and the performance work that usually gets deferred until it is expensive.",
    submittedAt: daysAgo(1),
    status: "New",
  },
  {
    id: "app-002",
    jobId: "job-001",
    applicantName: "Daniel Okafor",
    applicantEmail: "d.okafor@example.com",
    coverLetter:
      "After five years at a mid-size fintech I am looking for a team small enough that engineering decisions still get made by the people writing the code. I have shipped and maintained three production React applications, and I care a great deal about the boring parts: error states, loading behaviour, and keyboard access. Happy to talk through the architecture decisions I would want to revisit in the first month.",
    submittedAt: daysAgo(2),
    status: "Reviewed",
  },
  {
    id: "app-003",
    jobId: "job-003",
    applicantName: "Priya Raghunathan",
    applicantEmail: "priya.r@example.com",
    coverLetter:
      "Django and PostgreSQL have been my daily tools for seven years, the last three of them on a marketplace with a similar shape to yours — high read volume on search, bursty writes on submission. I write tests first as a matter of course, not policy. I would want to spend the first weeks understanding your query patterns before proposing anything, but I suspect there is meaningful work in the indexing strategy.",
    submittedAt: daysAgo(1),
    status: "New",
  },
  {
    id: "app-004",
    jobId: "job-003",
    applicantName: "Tomás Ferreira",
    applicantEmail: "tferreira@example.com",
    coverLetter:
      "I am a backend engineer with a strong bias toward simple systems. My last role involved migrating a sprawling service back into a well-factored Django monolith, which cut our deploy time by two thirds and made the codebase legible again. I am particularly interested in the API design side of this role.",
    submittedAt: daysAgo(4),
    status: "New",
  },
  {
    id: "app-005",
    jobId: "job-014",
    applicantName: "Anong Suwannakit",
    applicantEmail: "anong.s@example.com",
    coverLetter:
      "I am in my final year of a computer science degree in Bangkok and have been building React side projects for two years, most recently a course-scheduling tool now used by about two hundred students at my university. I learn fastest with code review, so a mentored internship is exactly what I am looking for.",
    submittedAt: daysAgo(3),
    status: "New",
  },
  {
    id: "app-006",
    jobId: "job-014",
    applicantName: "Kevin Mbeki",
    applicantEmail: "kevin.mbeki@example.com",
    coverLetter:
      "I graduated three months ago and have been contributing small fixes to open source React libraries while job hunting. I would rather join somewhere that takes teaching seriously than somewhere that pays slightly more and leaves me alone with a ticket queue.",
    submittedAt: daysAgo(5),
    status: "Reviewed",
  },
  {
    id: "app-007",
    jobId: "job-015",
    applicantName: "Sarah Whitfield",
    applicantEmail: "s.whitfield@example.com",
    coverLetter:
      "I have documented REST APIs at two developer-tools companies and can read enough Python and JavaScript to verify every example I publish. I noticed this listing is closed — I would still welcome a conversation if the role reopens in a different shape.",
    submittedAt: daysAgo(30),
    status: "Reviewed",
  },
];
