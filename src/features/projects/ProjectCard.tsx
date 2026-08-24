"use client";

import { motion } from "framer-motion";
import { Calendar, ExternalLink } from "lucide-react";
import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";
import { TAG_ALIAS, TAG_PREVIEW_COUNT } from "./data";
import { ProjectPreview } from "./previews/ProjectPreview";
import { STATUS_LABEL, STATUS_TONE, type Project } from "./types";

/**
 * THE CARD IS A RECTANGLE, AND THAT IS A DECISION.
 *
 * Every other housing in this project is chamfered — mission callouts, the emblem,
 * the HUD rail — and the obvious move is to cut these corners too so the roster
 * matches the deck. The reference does not, and it is right not to.
 *
 * The mitre means something specific here: it marks the things floating in the
 * scene, the parts of the deck that are OUT THERE. A card in a 4x2 grid inside a
 * bordered console is not out there; it is a cell in a table. Cutting eight of
 * them produces sixteen diagonal notches in a regular grid, and a grid whose cells
 * disagree with its own geometry reads as decorated rather than as machined.
 *
 * So: the chamfer vocabulary stays on the plane, and the console keeps square
 * corners at the same 3-4px radius as <HudPanel>.
 */
export function ProjectCard({ project, index }: { project: Project; index: number }) {
  const Icon = project.icon;
  const accent = project.accent;
  const hidden = project.stack.length - TAG_PREVIEW_COUNT;
  const shown = project.stack.slice(0, TAG_PREVIEW_COUNT);

  return (
    <motion.article
      // Staggered by grid position and capped, the same way the systems console
      // brings its domain cards up. Eight simultaneous fades read as a page load;
      // a sequence reads as instruments coming online.
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.36, ease: "easeOut", delay: 0.06 + Math.min(index, 7) * 0.04 }}
      className="group relative h-full"
      style={
        {
          "--project-accent": accent,
          // Hex alpha rather than an opacity modifier: the value is read back out
          // of a custom property by an arbitrary utility, and `bg-[var(--x)]/45`
          // does not compose that way.
          //
          // THE REST EDGE CARRIES THE PROJECT'S COLOUR AROUND THE WHOLE PERIMETER.
          // A neutral hairline says "this is a box". A tinted one says "this is
          // THAT system", and it says it before any type is read — which is the
          // only way eight cards in one field are distinguishable at a glance.
          "--project-rest": `${accent}7d`,
        } as CSSProperties
      }
    >
      {/* Bloom behind the card, off at rest. A card that is already lit has nothing
          left to say when you point at it. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -inset-[4px] rounded-[6px] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: `radial-gradient(120% 100% at 50% 0%, ${accent}2b, transparent 68%)` }}
      />

      {/* BEZEL. One pixel of accent under the face, taking full strength on hover —
          the edge is reflecting the console's ambient light, and pointing at a part
          only changes how much of that fixed light it returns. */}
      <div
        className={cn(
          "relative h-full rounded-[4px] p-px transition-[background-color,transform] duration-300",
          "bg-[var(--project-rest)] group-hover:bg-[var(--project-accent)]",
          // Two pixels. One is below the threshold at which movement registers as
          // movement; more and a grid of eight reads as jumping.
          "group-hover:-translate-y-0.5",
        )}
      >
        <div
          className={cn(
            "relative flex h-full flex-col overflow-hidden rounded-[3px] px-3.5 pt-3 pb-2",
            // Three near-black stops. The ramp gives the face a form rather than a
            // wash, but its range is deliberately tiny: this card is the ground the
            // preview well, the glyph and the accent rules are lit against, and
            // every unit of luminance here is a unit of contrast taken off them.
            "bg-[linear-gradient(180deg,#0b0f16_0%,#07090e_44%,#040508_100%)]",
            "transition-shadow duration-300",
            "shadow-[inset_0_1px_0_0_rgb(255_255_255/0.09),inset_0_0_30px_-16px_var(--project-rest)]",
            "group-hover:shadow-[inset_0_1px_0_0_rgb(255_255_255/0.16),inset_0_0_34px_-12px_var(--project-accent)]",
          )}
        >
          {/* HEAD RULE along the top edge in the project's hue. At a glance across
              the grid this is what separates eight cards into eight subjects. */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-60 transition-opacity duration-300 group-hover:opacity-100"
            style={{ backgroundColor: accent, boxShadow: `0 0 10px ${accent}99` }}
          />

          {/* NAMEPLATE. The glyph has no housing, matching the systems console's
              domain cards: a 30px box inside a card that already has a bezel is two
              nested outlines where the inner one means nothing. The bloom follows
              the STROKES via `drop-shadow` instead. */}
          <header className="flex shrink-0 items-start gap-3">
            <span
              aria-hidden="true"
              className="relative shrink-0 transition-[filter] duration-300 group-hover:brightness-110"
              style={{ color: accent, filter: `drop-shadow(0 0 8px ${accent}5c)` }}
            >
              <Icon size={26} strokeWidth={1.55} />
            </span>

            <div className="min-w-0 flex-1">
              <h3 className="text-t1 tracking-micro truncate font-mono text-[14px] leading-none font-semibold uppercase">
                {project.name}
              </h3>
              <p className="mt-[7px] truncate text-[11.5px] leading-none text-[#a9b4c0]">
                {project.kind}
              </p>
            </div>

            {/* FEATURED IS ALWAYS SIGNAL RED, NEVER THE CARD'S ACCENT.
                It is a statement by the ROSTER about this project — the same claim
                on every card that carries it — so it has to look identical on the
                red card and the cyan one. Painted in each card's accent it would
                read as another property of the project, and two featured cards
                would announce themselves in two different colours. */}
            {project.featured && (
              <span className="text-signal tracking-micro shrink-0 rounded-[3px] border border-[rgb(255_42_42/0.5)] bg-[rgb(255_42_42/0.08)] px-2 py-1 font-mono text-[9.5px] leading-none uppercase">
                Featured
              </span>
            )}
          </header>

          <div className="mt-[5px] shrink-0">
            <ProjectPreview kind={project.preview} accent={accent} />
          </div>

          {/* THE TEXT BLOCK IS WHERE THE SLACK GOES. Everything else in this column
              is fixed, so `flex-1` here means a card whose summary runs two lines
              instead of three leaves its gap BELOW the prose rather than stretching
              the preview well — which would give the grid eight schematics at eight
              different heights and lose the one thing that makes a roster scan. */}
          <p className="mt-1.5 line-clamp-3 min-h-0 flex-1 text-[12.5px] leading-[1.5] text-[#ccd5df]">
            {project.summary}
          </p>

          {/* THE STACK, AS CHIPS RATHER THAN A COMMA LIST.
              The systems console prints its domain stacks as prose because those
              cards list practices alongside products — "Secure Architecture" is not
              a chip. Everything here is an installable thing with a name, and a
              row of bounded tokens is how a reader scans for one. */}
          {/* `flex-nowrap` IS A STRUCTURAL GUARANTEE, NOT A STYLE.
              A wrapping tag row does not push the card taller — the card's height
              is set by the grid — it pushes the SUMMARY out through the top of
              itself, which is how SENTINEL shipped with its third line sliced in
              half while seven other cards looked correct. Refusing to wrap turns
              that class of failure into a clipped chip, which is legible as a
              clipped chip. `TAG_ALIAS` is what keeps it from having to. */}
          <ul className="flex shrink-0 flex-nowrap items-center gap-1.5 overflow-hidden pt-0.5">
            {shown.map((entry) => (
              <li
                key={entry}
                className="border-panel-rule text-t2 rounded-[3px] border px-2 py-[5px] font-mono text-[9.5px] leading-none tracking-[0.06em] whitespace-nowrap uppercase"
              >
                {TAG_ALIAS[entry] ?? entry}
              </li>
            ))}
            {hidden > 0 && (
              // Counted off `stack.length` rather than authored, so it cannot drift
              // from the list it is summarising. See the note on `Project.stack`.
              <li
                className="text-t3 rounded-[3px] border px-2 py-[5px] font-mono text-[9.5px] leading-none tracking-[0.06em] tabular-nums"
                style={{ borderColor: `${accent}40` }}
                title={project.stack.slice(TAG_PREVIEW_COUNT).join(", ")}
              >
                +{hidden}
              </li>
            )}
          </ul>

          <div className="bg-panel-rule mt-2 h-px shrink-0" />

          <footer className="flex shrink-0 items-center gap-3 pt-[7px]">
            <Calendar size={12} strokeWidth={1.7} aria-hidden="true" className="text-t3 shrink-0" />
            <span className="text-t2 font-mono text-[11px] leading-none tabular-nums">
              {project.year}
            </span>
            <span aria-hidden="true" className="bg-panel-rule h-3 w-px" />
            <span
              className={cn(
                "font-mono text-[11px] leading-none tracking-[0.08em] uppercase",
                STATUS_TONE[project.status],
              )}
            >
              {STATUS_LABEL[project.status]}
            </span>

            {/* THE LINK GLYPH IS FURNITURE UNTIL THERE IS SOMEWHERE TO GO.
                Every card carries it so the eight footers line up, and an entry
                with no `href` draws it at `--text-quaternary` — the deck's tone for
                inactive and locked, the same one the top bar's unbuilt destinations
                use. A glyph that appears on five cards and not on three would read
                as three broken footers. */}
            {project.href === null ? (
              <span
                aria-hidden="true"
                className="text-t4 ml-auto shrink-0"
                title={`${project.name} — no public link`}
              >
                <ExternalLink size={14} strokeWidth={1.7} />
              </span>
            ) : (
              <a
                href={project.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${project.name} — open repository`}
                // Hover resolves through `--project-accent` rather than an inline
                // handler, so the colour lives in the same custom property the
                // bezel and the head rule read and there is no second source for it.
                className="text-t3 focus-visible:ring-signal/70 ml-auto shrink-0 rounded-[2px] outline-none transition-colors duration-200 hover:text-[var(--project-accent)] focus-visible:ring-2"
              >
                <ExternalLink size={14} strokeWidth={1.7} />
              </a>
            )}
          </footer>
        </div>
      </div>
    </motion.article>
  );
}
