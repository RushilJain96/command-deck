"use client";

import { motion } from "framer-motion";
import type { CSSProperties } from "react";
import { calloutChamfer } from "@/lib/chamfer";
import { cn } from "@/lib/cn";
import { DOMAIN_ACCENT, STANCE_LAMP, STANCE_TONE, type SystemDomain } from "./data";

/**
 * One engineering domain, cut from the mission callout's geometry.
 *
 * THE MITRE IS BORROWED DELIBERATELY, AND ONLY HERE. `lib/chamfer.ts` records
 * that the cut-corner vocabulary was withdrawn from the HUD housings and kept for
 * the mission callouts, so that a chamfered element in a frame of square ones
 * always means the same thing: this is a CARD — a discrete subject you read as an
 * object — rather than an instrument housing. The six domains are this scene's
 * callouts. The four wide panels below them are housings and stay square, which
 * is why they use <HudPanel>.
 *
 * BEZEL OVER FACE, NOT `border`. A border on a `clip-path` box loses its mitred
 * corners — the stroke is clipped away exactly where the cut is, leaving the one
 * edge that defines the shape undrawn. So the outline is a one-pixel PAD on an
 * outer clipped box, with the face clipped again inside it: the diagonal gets a
 * real hairline, which is the whole point of the geometry.
 *
 * (`MissionPanel` uses `border` instead, and its note explains why — a padded box
 * with a background is a filled rectangle, and a filled rectangle under
 * `backdrop-filter` tints the pane sampling it. Nothing in this scene uses
 * backdrop blur, so the hazard does not exist here and the better corners win.)
 *
 * WHAT MAKES IT READ AS A SUBSYSTEM RATHER THAN A DASHBOARD CARD. Four things,
 * and none of them is colour volume:
 *
 *   A THREE-STOP FACE RAMP instead of two. The card is lit from above and falls
 *   off twice — quickly through the nameplate, then slowly through the body. One
 *   linear ramp reads as a gradient; two rates read as a surface with a form.
 *
 *   THE ACCENT IS STRUCTURAL, NOT DECORATIVE. It is on the bezel that surrounds
 *   the whole card, the head rule, the corner bracket, the icon plate, the segment
 *   that starts the metadata divider, and a rim light inside the face. Every one
 *   of those is a PART of the card — an edge, a housing, a rule terminator. None
 *   of it is a fill, which is why six lit cards still read as dark.
 *
 *   A CORNER BRACKET ON THE MITRE. The cut corner is the card's one piece of
 *   distinctive geometry and it was being drawn by absence. A 1px accent arm along
 *   the diagonal makes the cut deliberate.
 *
 *   THE STATUS LAMP HAS A SOCKET. A bare dot is a bullet; a dot in a ring reads as
 *   an indicator mounted in a panel.
 *
 * THE FACE IS `justify-between` OVER THREE BLOCKS — nameplate, body, footer — and
 * that is a consequence of the six-across row. A 237-unit card is 250 tall, and
 * whatever the content does not use has to go somewhere. Pinned to the bottom with
 * `mt-auto` the footer left ONE large hole in the middle of every card, which is
 * the same emptiness the capability matrix was criticised for; split by
 * `justify-between` the same space becomes two smaller gaps that read as a card
 * with air in it rather than a card that ran out of content.
 *
 * The type went up in the same pass and for the same reason. 13px on the title and
 * the description, 11px on the stack — the six-across card is the console's hero
 * and it had room to spend, so the space went into READING SIZE before it went
 * into padding. That is also the honest answer to "make the text pop": at 237 units
 * wide these three lines are the only prose on the card, and they were set at the
 * size a 485-unit card needed.
 *
 * NOT A BUTTON, AND NOT FOCUSABLE. There is nowhere for a domain to navigate to —
 * project scenes are where an individual system gets described. A `div` that
 * takes focus and does nothing when you press Enter is worse for a keyboard user
 * than one that does not take focus at all.
 */
export function SystemDomainCard({ domain, index }: { domain: SystemDomain; index: number }) {
  const Icon = domain.icon;
  const accent = DOMAIN_ACCENT[domain.accent];
  const clip = { clipPath: calloutChamfer() };

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      // Staggered by position in the grid, capped so the last card is not a
      // second behind the first. The deck's arrival reads as instruments coming
      // up in sequence; six simultaneous fades read as a page loading.
      transition={{ duration: 0.38, ease: "easeOut", delay: 0.06 + index * 0.045 }}
      className="group relative"
      style={
        {
          "--domain-accent": accent,
          // Hex alpha rather than a Tailwind opacity modifier: the value has to
          // survive being read back out of a custom property by an arbitrary
          // utility, and `bg-[var(--x)]/45` does not compose that way.
          // THE REST EDGE IS THE DOMAIN'S OWN COLOUR, and that is the change that
          // stopped these reading as six identical textboxes. A neutral hairline
          // said "this is a box"; a tinted one says "this is THAT subsystem", and
          // it says it around the whole perimeter rather than on one 1px rule at
          // the top. 49% at rest, full on hover: 33% was tuned against the old
          // desaturated palette and, once the hues went up, read as a tint rather
          // than as a colour. What keeps six lit outlines from competing with the
          // deck's mission callouts is that they ARE outlines — no fill on this
          // card carries hue at any strength.
          "--domain-rest": `${accent}7d`,
          "--domain-edge": accent,
        } as CSSProperties
      }
    >
      {/* Bloom behind the card. Off at rest — a lit panel at rest is a panel with
          nothing left to say when you point at it. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -inset-[4px] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          ...clip,
          background: `radial-gradient(130% 108% at 50% 0%, ${accent}30, transparent 70%)`,
        }}
      />

      {/* BEZEL. Cool-white at rest, taking the domain's hue on hover — the edge is
          reflecting the deck's ambient, and the only thing that changes when you
          point at a part is how much of that fixed light it returns. */}
      <div
        className={cn(
          "relative h-full p-px transition-[background-color,transform] duration-300",
          "bg-[var(--domain-rest)] group-hover:bg-[var(--domain-edge)]",
          // ELEVATION IS TWO PIXELS. One was below the threshold at which the
          // movement registered as movement — the card changed colour and the eye
          // read that as the whole response. Two is still under the distance at
          // which a grid of six reads as jumping, and it is enough that the card
          // detaches from the field rather than merely lighting up.
          "group-hover:-translate-y-0.5",
        )}
        style={clip}
      >
        <div
          className={cn(
            "relative flex h-full flex-col justify-between px-4 py-3.5",
            // THREE STOPS, AND ALL THREE ARE NEAR-BLACK. The ramp is what gives
            // the face a form rather than a wash — two falloff rates, quick through
            // the nameplate and slow through the body — but its RANGE is deliberately
            // tiny and its ceiling deliberately low. The card is the ground the icon
            // plate, the head rule and the divider terminator are lit against, and
            // every unit of luminance here is a unit of contrast taken off them.
            "bg-[linear-gradient(180deg,#0b0f16_0%,#07090e_42%,#040508_100%)]",
            "transition-shadow duration-300",
            // The third inset is the accent caught on the inside of the face — a
            // rim light, not a fill. It is what gives the card a sense of being lit
            // FROM its own edge rather than printed on the panel behind it.
            "shadow-[inset_0_1px_0_0_rgb(255_255_255/0.10),inset_0_-1px_0_0_rgb(0_0_0/0.7),inset_0_0_30px_-14px_var(--domain-rest),inset_0_-24px_28px_-24px_rgb(0_0_0/0.8)]",
            "group-hover:shadow-[inset_0_1px_0_0_rgb(255_255_255/0.18),inset_0_-1px_0_0_rgb(0_0_0/0.7),inset_0_0_34px_-12px_var(--domain-edge),inset_0_-24px_28px_-24px_rgb(0_0_0/0.8)]",
          )}
          style={clip}
        >
          {/* HEAD RULE in the domain's hue, along the top edge of the face. It
              gives the card a LIT EDGE, which at a glance across a grid of six is
              what separates them into six subjects before any type is read.
              It starts at 14 units in, where the mitre ends — a rule that ran to
              the corner would cross the cut and hang in space. */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-0 right-0 left-[14px] h-px opacity-55 transition-opacity duration-300 group-hover:opacity-100"
            style={{ backgroundColor: accent, boxShadow: `0 0 10px ${accent}99` }}
          />

          {/* CORNER BRACKET on the top-left cut. A 20-unit arm laid along the
              diagonal — 14px of cut is a 45 degree run, so the arm is rotated to
              match rather than approximated with two straight ticks. */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-[6px] -left-[3px] h-px w-[22px] origin-center -rotate-45 opacity-70 transition-opacity duration-300 group-hover:opacity-100"
            style={{ backgroundColor: accent }}
          />

          {/* NAMEPLATE, AND THE GLYPH HAS NO HOUSING ANY MORE.
              The plate was borrowed from the instrument rail, where a glyph sits in
              a 22px cell beside a figure and needs a box to read as an indicator
              rather than as a bullet. On a card 237 units wide the same box is a
              36px rectangle two units inside the card's own bezel — two nested
              outlines in the same accent, the outer one meaning "this is the
              subsystem" and the inner one meaning nothing. Dropping it lets the
              mark go from 17px to 30 and read as line art, which is what a glyph
              this size wants to be.

              `drop-shadow` rather than `box-shadow`: with no box left, the bloom has
              to follow the STROKES of the glyph instead of the bounds of the element
              around it. */}
          <div className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className="relative shrink-0 transition-[filter] duration-300 group-hover:brightness-110"
              style={{ color: accent, filter: `drop-shadow(0 0 9px ${accent}5c)` }}
            >
              <Icon size={30} strokeWidth={1.55} />
            </span>
            <h3 className="text-t1 tracking-micro min-w-0 font-mono text-[13.5px] leading-[1.3] font-semibold uppercase">
              {domain.label}
            </h3>
          </div>

          {/* Brighter than `--text-secondary` by one step. This is the sentence a
              reader actually reads on a card whose other three lines are labels and
              identifiers, and it was set at the same value as the stack line under
              it — two different jobs at one weight. */}
          {/* MINIMUM GAPS, NOT JUST DISTRIBUTED ONES. `justify-between` spreads
              whatever height is LEFT OVER, and at the three-across tier the card is
              content-sized so there is none — the nameplate, the body and the footer
              ended up flush against each other. These two margins are the floor the
              distribution sits on top of. */}
          <div className="mt-3.5">
            <p className="line-clamp-3 text-[13.5px] leading-[1.5] text-[#ccd5df]">
              {domain.blurb}
            </p>

          {/* METADATA DIVIDER. A hairline that STARTS in the domain's hue and
              falls to the panel rule — the terminator says which instrument the
              rule belongs to, which a plain grey line cannot. */}
            <div
              className="mt-3.5 h-px"
              style={{
                background: `linear-gradient(90deg, ${accent}b3 0, ${accent}b3 22px, var(--panel-rule) 22px, var(--panel-rule) 100%)`,
              }}
            />

          {/* THE STACK. Mono, because these are identifiers rather than prose —
              the same register the deck uses for every machine-readable string. */}
            <p className="mt-3.5 line-clamp-3 font-mono text-[11.5px] leading-[1.55] tracking-[0.01em] text-[#b8c2cd]">
              {domain.stack.join(", ")}
            </p>
          </div>

          {/* FOOTER: A COUNT AND A STANCE, AND NEITHER IS AN ACHIEVEMENT.
              The number is `stack.length` — how many entries this card lists, which
              the reader can verify by counting the line above it. The word is the
              operator's relationship to the domain, not a service state: nothing in
              a portfolio is ONLINE.

              "CORE COMPONENTS", NOT "TECHNOLOGIES". Half of what these cards list
              is not a technology: REST APIs, IaC, Secure Architecture, Encryption
              and Network Security are practices and shapes, not things you install.
              Calling the count "technologies" made the label quietly wrong on four
              of the six cards, and a console should not be quietly wrong about its
              own units. */}
          <div className="flex items-center justify-between gap-3 pt-3.5">
            {/* 10px, AND "CORE" IS GONE TO PAY FOR IT. At 8.5 this line was the
                smallest type on the console and the footer read as a watermark. The
                measure has not changed — a 231-unit card leaves about 197 for the
                count, the stance word and its lamp — so the two could not both go
                up. "6 COMPONENTS" at 10px fits where "6 CORE COMPONENTS" does not,
                and it says the same thing: these are components, some of which are
                practices rather than products, which is the whole reason the label
                stopped saying "technologies". */}
            <span className="text-t2 font-mono text-[10px] leading-none tracking-[0.08em] uppercase tabular-nums">
              {domain.stack.length} Components
            </span>
            <span className="flex items-center gap-2">
              <span
                className={cn(
                  "font-mono text-[10px] leading-none font-medium tracking-[0.08em] uppercase",
                  STANCE_TONE[domain.stance],
                )}
              >
                {domain.stance}
              </span>
              {/* Lamp in a socket. */}
              <span
                aria-hidden="true"
                className="border-panel-rule flex h-[11px] w-[11px] items-center justify-center rounded-full border"
              >
                <span className={cn("h-[5px] w-[5px] rounded-full", STANCE_LAMP[domain.stance])} />
              </span>
            </span>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
