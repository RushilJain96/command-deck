"use client";

import { motion } from "framer-motion";
import { Mail } from "lucide-react";
import { useScene } from "@/features/app/hooks";
import { LINKS } from "./links";

/**
 * The deck's floor.
 *
 * TAKES THE SPACE THE DOCK USED TO OWN, and that is a trade rather than a
 * deletion. The dock repeated the top bar's six destinations in short codes,
 * which on a wide deck is the same control twice — the second copy carries no
 * information and takes the one strip of the frame where a portfolio actually has
 * something to say. <Dock> is stood down entirely — the frame no longer
 * reflows, so there is no viewport at which the short codes are needed.
 *
 * THREE REGISTERS, ONE ROW. The tagline is the operator's thesis — the line
 * <OperatorPanel> was built to carry before it stood down, finally in the place
 * a thesis belongs on a deck whose top bar already states the name. The glyphs
 * are the only way off this page. The colophon is the machine describing itself,
 * which is the correct note to end an engineering surface on.
 *
 * Red on the tagline and on the two technology names, and nowhere else here. It
 * is the same rule the top bar's subtitle follows: red is identity when it is not
 * targeting, and both of those lines are the deck saying what it is.
 */
/**
 * GitHub and LinkedIn are drawn here rather than imported.
 *
 * This version of `lucide-react` ships no brand marks — the set was removed
 * upstream — and Mail is the only one of the three that is a generic glyph. A
 * envelope-plus-two-substitutes row would be worse than either alternative:
 * these two services are recognised by their marks and by nothing else, so a
 * "link" or "user" icon in their place is a link nobody can identify.
 *
 * Both are `fill="currentColor"` on a 24 grid, so they inherit the same colour
 * transition as the Lucide envelope beside them. `strokeWidth` does not apply —
 * these are filled marks next to a stroked one, which is a real inconsistency and
 * an unavoidable one; it is invisible at 19px.
 */
function GithubMark({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .5C5.73.5.5 5.73.5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.55v-2.1c-3.2.7-3.88-1.37-3.88-1.37-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.24 2.76.12 3.05.74.81 1.19 1.84 1.19 3.1 0 4.43-2.7 5.4-5.27 5.69.42.36.78 1.07.78 2.16v3.2c0 .3.21.66.8.55A11.5 11.5 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5Z" />
    </svg>
  );
}

function LinkedinMark({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM2.4 21.5h5.16V9.75H2.4V21.5ZM10.2 9.75h4.95v1.6h.07c.69-1.24 2.37-2.55 4.88-2.55 5.22 0 6.18 3.3 6.18 7.6v5.1h-5.15v-4.52c0-1.08-.02-2.47-1.55-2.47-1.55 0-1.79 1.18-1.79 2.4v4.59H12.2V9.75h-2Z" />
    </svg>
  );
}

const ICONS = {
  github: GithubMark,
  linkedin: LinkedinMark,
  mail: ({ size }: { size: number }) => <Mail size={size} strokeWidth={1.6} aria-hidden="true" />,
} as const;

/**
 * SCENES THAT OWN THE WHOLE FRAME GET NO FLOOR.
 *
 * The footer is a colophon — a tagline, three outbound glyphs and a "built with"
 * line. On the deck that is exactly right: the mission field is a composition
 * with air around it, and the floor is what closes the frame.
 *
 * The systems console is not a composition, it is a screenful of instruments, and
 * it needs every unit of height it can get — six domain cards, a capability
 * matrix and three panels are budgeted against 1024 units. Sixty-six of those
 * spent on "BUILT WITH NEXT.JS" is the least defensible trade on the deck, and
 * worse than the arithmetic: a website colophon under a console reframes the
 * console as page content.
 *
 * So the floor is scene-aware rather than deleted. This is a list of ids, not a
 * flag on the scene, because it is a fact about the FOOTER — which scenes it
 * declines to appear under — and the scenes should not have to know it exists.
 */
const FLOORLESS_SCENES = new Set<string>(["systems"]);

export function Footer() {
  const scene = useScene();
  if (FLOORLESS_SCENES.has(scene.id)) return null;

  return (
    <motion.footer
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.08, ease: "easeOut" }}
      className="pointer-events-none absolute inset-x-0 bottom-0 z-40 h-[66px]"
    >
      {/* Hairline across the full width, not inset with the content. It is the
          floor of the frame — a rule that stops short of the edges reads as an
          underline beneath the text rather than as the edge of the deck. */}
      <div className="bg-panel-rule absolute inset-x-0 top-0 h-px" />

      <div className="flex h-full items-center justify-between gap-6 px-9">
        <p className="text-signal tracking-[0.05em] font-mono text-[12.5px] whitespace-nowrap uppercase">
          Engineer. Builder. Problem solver.
        </p>

        <nav aria-label="Elsewhere" className="pointer-events-auto flex items-center gap-6">
          {LINKS.map((link) => {
            const Icon = ICONS[link.id as keyof typeof ICONS];
            return (
              <a
                key={link.id}
                href={link.href}
                aria-label={link.label}
                title={link.label}
                // Every one of these leaves the deck, so every one opens away
                // from it. `noreferrer` rides along with `noopener` as the
                // default pairing for untrusted outbound targets.
                target="_blank"
                rel="noopener noreferrer"
                className="text-t3 hover:text-t1 focus-visible:ring-signal/70 rounded-[2px] outline-none transition-colors duration-200 focus-visible:ring-2"
              >
                <Icon size={19} />
              </a>
            );
          })}
        </nav>

        <p className="text-t3 tracking-[0.05em] font-mono text-[12.5px] whitespace-nowrap uppercase">
          Built with <span className="text-signal">Next.js</span> &amp;{" "}
          <span className="text-signal">TypeScript</span>
        </p>
      </div>
    </motion.footer>
  );
}
