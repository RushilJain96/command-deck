import { Brain, Briefcase, Code2, Mail, Puzzle, Star, Users } from "lucide-react";
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
 * FOUR CHANNELS, TWO OF THEM UNRESOLVED — see the note on `Channel.href`.
 *
 * TODO(rushil): fill in the LinkedIn and LeetCode addresses. They are the only two
 * strings this page is waiting on, and each is a one-line edit below; the rows
 * light up on their own once `href` and `handle` are set.
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
    id: "opportunities",
    label: "Opportunities",
    blurb: "Exploring full-time roles and projects that create real-world impact.",
    icon: Star,
    accent: "#46d5e0",
  },
];
