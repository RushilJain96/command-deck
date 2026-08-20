"use client";

import { motion } from "framer-motion";
import { useState, type CSSProperties } from "react";
import { HudPanel } from "@/features/hud/HudPanel";
import { cn } from "@/lib/cn";
import { SECTION_ICONS, TECHNOLOGIES, type Technology } from "./data";
import { Mark, markColor } from "./Mark";
import { PANEL_ICON_SIZE, PANEL_LABEL } from "./panelStyle";
import { ViewAllToggle } from "./ViewAllToggle";

/**
 * Two rows at rest. See <ViewAllToggle> for why it pages rather than grows.
 *
 * 12 NO LONGER HAS TO DIVIDE THE COLUMN COUNT, and that is worth recording because
 * for several passes it did. While the cells were drawn by a 1px gap over a
 * rule-coloured ground, a row that did not fill left the PANEL showing through
 * where the missing cells would be — a lighter rectangle, not blank space. 14
 * across seven columns looked right at the design frame and put two of those holes
 * in the last row of every phone.
 *
 * The rules are gone now; the cells float on the panel's own fill, so a short last
 * row is simply space. 12 is kept because it still happens to be whole at both
 * counts — four columns below @6xl, six at and above — and a full rectangle reads
 * better than a ragged one even when nothing is drawn around it.
 *
 * THE COLUMN COUNTS ARE STILL FIXED rather than `auto-fill`. That constraint has
 * not changed: `auto-fill` with a min column width fails on any frame that is not
 * the design frame — a 1440x800 laptop draws a 1843-unit frame and fits a different
 * number of columns — so the tile WIDTH varies with the frame and the SHAPE never
 * does.
 *
 * It is a presentation constant and lives here rather than in `data.ts`: the roster
 * is content, how much of it fits is layout.
 */
const PREVIEW_COUNT = 12;

export function TechnologyLibrary() {
  const [expanded, setExpanded] = useState(false);
  const hidden = TECHNOLOGIES.length - PREVIEW_COUNT;
  const shown = expanded ? TECHNOLOGIES : TECHNOLOGIES.slice(0, PREVIEW_COUNT);

  return (
    <HudPanel
      label="Technologies I Work With"
      icon={SECTION_ICONS.technologies}
      // The header glyph takes the panel's own accent. It is 12px of hue in a
      // header that is otherwise grey, and it is what stops four identical
      // housings from reading as one undifferentiated column.
      iconClassName="text-[#52b6ff]"
      iconSize={PANEL_ICON_SIZE}
      labelClassName={PANEL_LABEL}
      corners
      className="flex h-full min-h-0 flex-col"
      // PADDED AGAIN, NOW THAT THE CELLS FLOAT. The body used to be full-bleed so
      // the 1px grid gap could reach the housing on every side and draw a clean
      // faceplate. With the rules gone there is nothing to reach the edge, and a
      // grid of unbounded marks needs a margin or the outermost logos sit against
      // the panel border.
      bodyClassName="min-h-0 flex-1 flex flex-col gap-2.5 px-3.5 py-3"
    >
      {/* COLLAPSED, THE ROWS DIVIDE WHAT IS LEFT OF THE PANEL; EXPANDED, THEY
          SCROLL INSIDE IT. `auto-rows-fr` against `flex-1` is what makes the preview
          fill its housing at any panel height without a magic tile size — the rows
          split whatever the console's bottom row leaves after the button at the
          foot has taken its share. Only at @6xl, because that is the only tier where
          the row has a fixed height to divide.

          Expanded, the extra rows have to go somewhere that is not off the bottom of
          the frame, so the list becomes a scroller bounded by the same box. */}
      <ul
        id="technology-library"
        className={cn(
          "grid grid-cols-4 gap-1.5 @6xl:grid-cols-6",
          expanded
            ? "deck-scroll max-h-full auto-rows-min overflow-y-auto"
            : "auto-rows-min @6xl:h-full @6xl:auto-rows-fr",
        )}
      >
        {shown.map((technology, index) => (
          <TechnologyItem key={technology.id} technology={technology} index={index} />
        ))}
      </ul>

      {/* THE CONTROL SITS AT THE FOOT, LEFT-ALIGNED — see <ViewAllToggle> for why
          it moved out of the header. `mt-auto` pins it to the bottom of the panel
          so the two libraries' buttons line up with each other whatever their grids
          are doing above them. */}
      {hidden > 0 && (
        <div className="mt-auto">
          <ViewAllToggle
            label="Technologies"
            accent="#52b6ff"
            expanded={expanded}
            hiddenCount={hidden}
            controls="technology-library"
            onToggle={() => setExpanded((value) => !value)}
          />
        </div>
      )}
    </HudPanel>
  );
}

/**
 * THE MARK IS THE TILE. EVERYTHING ELSE GETS OUT OF ITS WAY.
 *
 * Three changes together, because none of them works alone:
 *
 *   30px, UP FROM 21. A logo is recognised by SILHOUETTE, and silhouette is the
 *   first thing scale takes away. Python's two coils and Kubernetes' helm are
 *   shapes at 30 and textures at 21.
 *
 *   FULL OPACITY. The marks sat at 0.9 on the argument that a wall of nineteen
 *   brand colours needs damping. On a near-black ground it needs no damping — the
 *   ground does that job — and the 10% was coming straight off the one property
 *   the marks were brought in for.
 *
 *   NOTHING AROUND IT. Each tile was first a bordered box with its own gradient, so
 *   every mark competed with a rectangle drawn at higher contrast than the mark
 *   itself; then a cell in a ruled grid, which traded six rectangles for a lattice.
 *   Now the marks float on the panel's own fill and the only things with edges in
 *   this panel are the logos.
 *
 * The label is 12px on a near-white tone. It has been raised twice — 9.5, then 11,
 * now 12 — and the reason it kept being too small is that it was being judged
 * against the panel heading above it, which was itself set at 9px. Once the heading
 * went to 13 the tile label had a real level to sit under, and 12 is where a
 * nineteen-item library reads as a list of NAMES rather than as captions on icons.
 *
 * An earlier version went the other way entirely: nineteen identical grey glyphs,
 * revealing a category hue on hover, on the argument that a wall of colour is a
 * legend the reader has to decode. That is right for INVENTED category colours and
 * wrong for brand marks — nobody decodes Docker's blue, they recognise it.
 *
 * Brand hexes too dark to read on black are LIFTED rather than replaced; see
 * `markColor` for why that distinction matters most at this size.
 */
function TechnologyItem({ technology, index }: { technology: Technology; index: number }) {
  const color = markColor(technology.glyph);

  return (
    <motion.li
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.26, ease: "easeOut", delay: 0.34 + index * 0.018 }}
      style={{ "--mark": color } as CSSProperties}
      className="group"
      // `title` gives the kind on hover without a bespoke tooltip layer — the name
      // is already on screen and the mark is recognisable, so the only thing left
      // to disclose is what the thing IS in the stack.
      title={`${technology.name} — ${technology.kind}`}
    >
      {/* NO FILL AND NO BORDER AT REST. The cell is a hit area and a hover state,
          nothing more — the mark is the only thing in this panel with edges. */}
      <div className="relative flex h-full flex-col items-center justify-center gap-2 rounded-[4px] px-1.5 py-3 transition-colors duration-200 group-hover:bg-[rgb(190_205_220/0.05)]">
        {/* The mark's own light, pooled behind it. Off at rest; on hover it is the
            richest thing the tile does, and it costs no layout. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          style={{ background: `radial-gradient(58% 54% at 50% 40%, ${color}26, transparent 72%)` }}
        />
        <span aria-hidden="true" className="relative" style={{ color: "var(--mark)" }}>
          <Mark glyph={technology.glyph} size={32} />
        </span>
        <span className="relative w-full truncate text-center text-[12px] leading-none text-[#ccd5df] transition-colors duration-200 group-hover:text-white">
          {technology.name}
        </span>
      </div>
    </motion.li>
  );
}
