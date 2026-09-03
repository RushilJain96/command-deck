import { Brain, Briefcase, Code2, Hammer, Mail, Puzzle, Users } from "lucide-react";
import { siLeetcode } from "simple-icons";
import type { SimpleIcon } from "simple-icons";
import { LINKS } from "@/features/chrome/links";
import { GithubMark, LinkedinMark } from "@/features/chrome/marks";
import type { Channel, ChannelMark, Opportunity, Trait } from "./types";

/**
 * Wraps a `simple-icons` path in the component shape `ChannelMark` expects, so a
 * brand path and a lucide icon are the same kind of thing to a row. The systems
 * console's <Mark> does the same job for its libraries; this is the one-line
 * version for a page that needs it once.
 */
function brandMark(icon: SimpleIcon): ChannelMark {
  // Named rather than an arrow returned from an arrow: an anonymous component has
  // no display name, so it shows up as `Unknown` in React DevTools and in any stack
  // trace that passes through it. `react/display-name` is right to object.
  function BrandMark({ size = 24, className }: { size?: number; className?: string }) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
        className={className}
      >
        <path d={icon.path} />
      </svg>
    );
  }
  BrandMark.displayName = `BrandMark(${icon.title})`;
  return BrandMark;
}

/**
 * THE OPERATOR PROFILE, AND THIS FILE IS NOW ITS ONLY HOME.
 *
 * `terminal/data.ts` carried a provisional `PROFILE` with a TODO saying to replace
 * it once the About scene existed. This is that scene, so the TODO is discharged:
 * the terminal's `about` command reads these constants, and there is one set of
 * words about who the operator is rather than two that can drift.
 */
export const HEADLINE = "Computer Science Student | Builder | Problem Solver";

export const OPERATOR = "Rushil Jain";

/**
 * Three paragraphs, kept as an array rather than one string with newlines in it.
 *
 * The renderer puts a real gap between them; a single string would need the
 * component to split on `\n\n` and reassemble, which is parsing your own data back
 * out of a format you chose. It also means a fourth paragraph is one array entry.
 */
export const BIO: readonly string[] = [
  "I'm a computer science student who enjoys building scalable systems and solving real-world problems through code.",
  "My interests lie in system design, AI, and backend development.",
  "I believe in clean code, continuous learning, and building things that create real impact.",
];

export const TRAITS: readonly Trait[] = [
  {
    id: "curious",
    label: "Curious Mind",
    blurb: "Always exploring new technologies and ideas.",
    icon: Brain,
    accent: "#33d693",
  },
  {
    id: "clean-code",
    label: "Clean Code",
    blurb: "Writing code that is readable, maintainable and scalable.",
    icon: Code2,
    accent: "#a78bff",
  },
  {
    id: "problem-solver",
    label: "Problem Solver",
    blurb: "Breaking down complex problems and building simple solutions.",
    icon: Puzzle,
    accent: "#ffab3d",
  },
  {
    id: "team-player",
    label: "Team Player",
    blurb: "Collaborate, communicate and build great things together.",
    icon: Users,
    accent: "#46d5e0",
  },
];

/**
 * THE ADDRESSES COME FROM `links.ts` WHERE `links.ts` HAS THEM.
 *
 * The footer and this panel both publish the operator's GitHub and email. Typing
 * them again here would create two places to change one address, and the failure is
 * the worst kind — silent, and only visible to a reader who happens to compare the
 * footer glyph with the row above it.
 *
 * `find` rather than an index: the footer's list is ordered for the footer, and a
 * reorder there must not silently repoint a row here.
 */
const linkHref = (id: string) => LINKS.find((link) => link.id === id)?.href ?? null;

/**
 * THE FULL ROSTER, IN THE ORDER A READER SHOULD TRY THEM.
 *
 * `PUBLISHED_CHANNELS` below is what actually renders. An entry with no address is
 * kept here — so the intent, the blurb and the mark survive until the URL arrives —
 * and filtered out of every surface, because a visitor should never be shown a row
 * that says a link is coming.
 *
 * TODO(rushil): fill in the LinkedIn and LeetCode addresses. Each is a one-line
 * edit below and the row APPEARS on its own once `href` and `handle` are set — on
 * this page and in the terminal's `contact` command together.
 *
 * The reference also drew a fifth row for a deployed portfolio at `rushil.dev`.
 * It is deliberately absent: the site is not deployed, the README keeps its own
 * live-demo link commented out for exactly that reason, and a contact page linking
 * to the page it is printed on would be circular even once it is.
 */
export const CHANNELS: readonly Channel[] = [
  {
    id: "email",
    label: "Email",
    blurb: "Best for detailed discussions",
    icon: Mail,
    accent: "#ff3d3d",
    handle: "rushilpjain@gmail.com",
    href: linkHref("mail"),
    action: "copy",
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    blurb: "Professional updates & network",
    icon: LinkedinMark,
    accent: "#3b9cf0",
    handle: null,
    href: null,
    action: "open",
  },
  {
    id: "github",
    label: "GitHub",
    blurb: "Code, projects & contributions",
    icon: GithubMark,
    accent: "#d5dbe3",
    handle: "github.com/RushilJain96",
    href: linkHref("github"),
    action: "open",
  },
  {
    id: "leetcode",
    label: "LeetCode",
    blurb: "Problem solving journey",
    icon: brandMark(siLeetcode),
    accent: "#ffab3d",
    handle: null,
    href: null,
    action: "open",
  },
];

/**
 * WHAT THE OPERATOR IS ACTUALLY OPEN TO. Three, and all three are true of a
 * student — no full-time roles, no founder language, nothing that would have a
 * reader arriving with the wrong idea of what is on offer.
 */
export const OPPORTUNITIES: readonly Opportunity[] = [
  {
    id: "internships",
    label: "Internships",
    blurb: "Actively looking for internship opportunities to learn, contribute and grow.",
    icon: Briefcase,
    accent: "#ffab3d",
  },
  {
    id: "collaborations",
    label: "Collaborations",
    blurb: "Open to collaborating on interesting projects and innovative ideas.",
    icon: Users,
    accent: "#a78bff",
  },
  {
    // "Full-time roles" was wrong about the operator: he is a student, and a band
    // that advertises availability he does not have is the one kind of inaccuracy
    // a visitor can act on and be misled by. Learning and building is the true
    // third answer, and it is also the one that follows from the other two.
    id: "learning",
    label: "Learning / Building",
    blurb:
      "Interested in opportunities that help me learn, build and contribute to meaningful engineering work.",
    icon: Hammer,
    accent: "#46d5e0",
  },
];

/**
 * WHAT RENDERS — and the reason unresolved channels vanish rather than announce
 * themselves.
 *
 * The first version of this page drew every channel and labelled the two without
 * addresses "NOT PUBLISHED YET" beside a dashed PENDING chip. That is honest, and
 * it is still wrong: it is a note from the person building the site to themselves,
 * shown to a stranger who came to find an email address. A visitor cannot act on
 * "pending" — it tells them only that the page is unfinished, which is the one
 * impression a portfolio cannot afford.
 *
 * So an unresolved channel is simply absent. The panel shows what works; nothing
 * on screen refers to something that does not exist. This is filtered once, here,
 * rather than in each consumer — the console and the terminal's `contact` command
 * both read it, and a second copy of the predicate is a second chance to disagree
 * about which channels are live.
 */
export const PUBLISHED_CHANNELS: readonly Channel[] = CHANNELS.filter(
  (channel) => channel.href !== null && channel.handle !== null,
);
