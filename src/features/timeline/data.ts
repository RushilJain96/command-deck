import {
  FlaskConical,
  GraduationCap,
  Lightbulb,
  Milestone as MilestoneIcon,
  Rocket,
  School,
  ShieldCheck,
} from "lucide-react";
import type { EntryKind, JourneyEntry, Milestone } from "./types";

/**
 * THE DEGREE IS 2024–2028, AND CORRECTING THAT FIXED THREE THINGS AT ONCE.
 *
 * The reference dated it 2026–2030, which left a two-year hole between finishing
 * school in 2024 and starting university, and put the May–Aug 2025 research
 * assistantship a full year BEFORE the degree it was attached to — a research role
 * at a university not yet enrolled in. `2026` was the current-year marker on the
 * rail leaking into the degree's own range.
 *
 * With 2024–2028 the whole rail closes: school ends 2024, the degree starts, the
 * research is the summer after first year, and September 2026 is the start of year
 * three. Nothing else had to be invented to make it consistent.
 */
export const DEGREE = {
  title: "B.Tech in Computer Science",
  org: "BITS Pilani, Dubai Campus",
  from: 2024,
  to: 2028,
  /** Counted, not typed — see `currentYearOfStudy`. */
  totalYears: 4,
} as const;

/**
 * WHICH YEAR OF THE DEGREE IT IS, DERIVED FROM THE CLOCK.
 *
 * Typing "third year" would be correct for about eleven months and then quietly
 * wrong, on a page whose entire subject is time. The academic year rolls over in
 * September, so anything before that month still belongs to the previous intake —
 * which is the one piece of arithmetic a hardcoded string cannot do.
 *
 * Clamped to the programme's length so the page degrades into "graduated" rather
 * than announcing a fifth year of a four-year course.
 */
export function currentYearOfStudy(now: Date = new Date()): number {
  const academicYearStart = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
  return Math.min(Math.max(academicYearStart - DEGREE.from + 1, 1), DEGREE.totalYears);
}

/** "2026 — 27", the academic year the operator is currently in. */
export function currentAcademicYear(now: Date = new Date()): string {
  const start = DEGREE.from + currentYearOfStudy(now) - 1;
  return `${start} — ${String(start + 1).slice(2)}`;
}

export const ENTRY_KIND_LABEL: Record<EntryKind, string> = {
  academics: "Academics",
  research: "Research",
  internship: "Internship",
  milestone: "Milestone",
};

/**
 * THE RAIL, IN STRICT REVERSE-CHRONOLOGICAL ORDER BY START YEAR.
 *
 * Reading down the left the years are 2026, 2025, 2024, 2022, 2018 — monotonic,
 * with every number meaning the same thing. The reference led with the ongoing
 * degree instead, which put a "2026 PRESENT" label above entries that had actually
 * happened later; ordering by one rule and labelling by another is what made its
 * rail look sorted while it was not.
 *
 * The project entry the reference carried is gone — the Projects console holds it
 * in full, with its own card and schematic. Nothing was invented to replace it. A
 * timeline padded to look fuller has started making things up, and what is here is
 * what there is.
 */
export const ENTRIES: readonly JourneyEntry[] = [
  {
    id: "internship",
    kind: "internship",
    title: "Cybersecurity Intern",
    org: "TMEN Systems Pvt. Ltd.",
    period: "May 2026 — Jul 2026",
    range: "May 2026 — Jul 2026",
    phase: "First Industry Role",
    status: "complete",
    /**
     * TODO(rushil): one or two lines on what the work actually involved. The line
     * below is the only thing derivable from what you have said — the dates place
     * it in the summer after second year — and inventing the rest is exactly what
     * this file has refused to do everywhere else.
     */
    points: ["Summer internship in cybersecurity, following the second year"],
    icon: ShieldCheck,
    accent: "#46d5e0",
    logo: "/logos/tmen-systems.png",
  },
  {
    id: "research",
    kind: "research",
    title: "Research Assistant",
    org: DEGREE.org,
    period: "May 2025 — Aug 2025",
    range: "May 2025 — Aug 2025",
    phase: "Research",
    status: "complete",
    /**
     * TODO(rushil): the topic and scope lines are still missing. The reference
     * described this as privacy-preserving synthetic video surveillance, which came
     * out of an image generator rather than out of you — so it is not printed here
     * until you confirm it. Everything below is what you have confirmed: the role,
     * the institution, the dates, and that it ran with a faculty supervisor and
     * student researchers.
     *
     * The supervisor is deliberately unnamed — your call, and the phrasing below is
     * the version that keeps the collaboration without putting someone else's name
     * on a public page.
     */
    points: [
      "Summer research assistantship following the first year",
      "Worked alongside a faculty supervisor and student researchers",
    ],
    icon: FlaskConical,
    accent: "#a78bff",
    logo: "/logos/bits-pilani-dubai.png",
  },
  {
    id: "btech",
    kind: "academics",
    title: DEGREE.title,
    org: DEGREE.org,
    period: `${DEGREE.from} — ${DEGREE.to}`,
    range: `${DEGREE.from} — Present`,
    phase: "Building Forward",
    status: "ongoing",
    points: [
      "Undergraduate programme in computer science",
      "Coursework across systems, algorithms and machine learning",
    ],
    icon: GraduationCap,
    accent: "#ff3d3d",
    logo: "/logos/bits-pilani-dubai.png",
  },
  {
    id: "school",
    kind: "academics",
    title: "Senior School",
    org: "Prudence School",
    period: "2022 — 2024",
    range: "Sep 2022 — 2024",
    phase: "High School",
    status: "complete",
    points: [
      "Senior secondary with a science and mathematics focus",
      "Where computer science stopped being a hobby and became the direction",
    ],
    icon: School,
    accent: "#52b6ff",
    logo: "/logos/prudence-school.png",
  },
  {
    id: "started",
    kind: "milestone",
    title: "Started Building",
    org: null,
    period: "2018 — 2022",
    range: "2018 — 2022",
    phase: "Early Exploration",
    status: "complete",
    points: [
      "First programs, small tools and things that mostly did not work",
      "Where the interest in how systems work underneath began",
    ],
    icon: Lightbulb,
    accent: "#ffab3d",
    logo: null,
  },
];

/**
 * WHAT COMES NEXT, AND IT IS DELIBERATELY NOT THE CONTACT PAGE'S LIST.
 *
 * The reference filled this panel with "Internship Opportunity" and "Exciting
 * Projects" — which is, almost word for word, the Contact console's opportunities
 * band. Two screens making the same ask is one screen too many, and it left this
 * one with nothing of its own to say.
 *
 * So UP NEXT carries what this console alone can: the rest of the timeline. Dated,
 * already determined, and true whether or not anyone ever gets in touch. The ask
 * stays on the page built for it.
 */
export const UP_NEXT: readonly Milestone[] = [
  {
    id: "year-three",
    label: "Third Year",
    when: "2026 — 27",
    detail: "Advanced coursework in systems and AI",
    icon: MilestoneIcon,
    accent: "#ff3d3d",
  },
  {
    id: "year-four",
    label: "Final Year",
    when: "2027 — 28",
    detail: "Specialisation and capstone work",
    icon: MilestoneIcon,
    accent: "#ffab3d",
  },
  {
    id: "graduation",
    label: "Graduation",
    when: "2028",
    detail: `${DEGREE.title}, ${DEGREE.org}`,
    icon: Rocket,
    accent: "#33d693",
  },
];


/**
 * TWO LINES, AT OPPOSITE ENDS OF THE PAGE — and they are different registers.
 *
 * The header's is descriptive: it tells a reader what they are looking at before
 * they read a single date. The closing line is the operator's own, and it is the
 * page's sign-off, so it sits under everything rather than over it. An earlier
 * pass had both at the top, where the second one just read as a subtitle competing
 * with the first.
 */
export const JOURNEY_BLURB = "A timeline of learning, building, and everything in between.";
export const JOURNEY_STAMP = "// progressing";
export const JOURNEY_CLOSE = ["Same curiosity.", "Bigger problems.", "Further ahead."] as const;
