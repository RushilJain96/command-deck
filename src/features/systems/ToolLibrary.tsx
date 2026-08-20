"use client";

import { motion } from "framer-motion";
import { useState, type CSSProperties } from "react";
import { HudPanel } from "@/features/hud/HudPanel";
import { cn } from "@/lib/cn";
import { DAILY_TOOLS, SECTION_ICONS, type Tool } from "./data";
import { Mark, markColor } from "./Mark";
import { PANEL_ICON_SIZE, PANEL_LABEL } from "./panelStyle";
import { ViewAllToggle } from "./ViewAllToggle";

/**
 * Three rows of three, and the three columns are fixed for the same reason the
 * technology grid's are — see the note on its constant. Three rather than four
 * because the tile is a ROW: "Google Drive" beside a mark needs about 104 units,
 * and this panel is the narrowest of the three at every tier.
 */
const PREVIEW_COUNT = 9;

/**
 * DELIBERATELY THE SAME FAMILY AS <TechnologyLibrary>, AND DELIBERATELY NOT THE
 * SAME TILE.
 *
 * The two panels sit side by side and are both "a grid of marks", so if they were
 * identical the reader would take them for one control split across two boxes.
 * The distinction the brief asks for is real and it is about SUBJECT — the
 * technologies are the engineering stack, the tools are the workbench — so the
 * form follows it:
 *
 *   THE CELL IS A ROW, NOT A STACK. Mark beside name rather than above it. That
 *   packs three columns into the narrowest panel, makes the section read as a list
 *   of instruments rather than a second wall of icons, and gives it a visibly
 *   denser texture than the logo grid beside it.
 *
 *   THE MARK IS SMALLER. 22px against the technologies' 30 — the tools are the
 *   workbench, not the subject, and the size difference is the fastest way to say
 *   which panel is which from across the frame.
 *
 *   THE PAIR IS CENTRED IN ITS CELL, not flushed left. Left-aligned in a cell this
 *   wide, every row left a third of itself empty on the right and the panel read
 *   as three ragged columns; centred, the mark-and-name pair is the cell's
 *   content and the cell is the grid's unit.
 *
 * The HOUSING is shared: both panels are unbounded cells floating on the panel's
 * own fill, with an outlined control at the foot. Sharing the construction and
 * differing in the cell is the right way round — two panels in one row should look
 * like one instrument with two sections, not like two products.
 */
export function ToolLibrary() {
  const [expanded, setExpanded] = useState(false);
  const hidden = DAILY_TOOLS.length - PREVIEW_COUNT;
  const shown = expanded ? DAILY_TOOLS : DAILY_TOOLS.slice(0, PREVIEW_COUNT);

  return (
    <HudPanel
      label="Tools I Use Daily"
      icon={SECTION_ICONS.tools}
      iconClassName="text-[#46d5e0]"
      iconSize={PANEL_ICON_SIZE}
      labelClassName={PANEL_LABEL}
      corners
      className="flex h-full min-h-0 flex-col"
      // Padded, same construction as the technology grid — see its note.
      bodyClassName="min-h-0 flex-1 flex flex-col gap-2.5 px-3.5 py-3"
    >
      <ul
        id="tool-library"
        className={cn(
          "grid grid-cols-3 gap-1.5",
          expanded
            ? "deck-scroll max-h-full auto-rows-min overflow-y-auto"
            : "auto-rows-min @6xl:h-full @6xl:auto-rows-fr",
        )}
      >
        {shown.map((tool, index) => (
          <ToolItem key={tool.id} tool={tool} index={index} />
        ))}
      </ul>

      {/* THE CONTROL SITS AT THE FOOT, LEFT-ALIGNED — see <ViewAllToggle> for why
          it moved out of the header. `mt-auto` pins it to the bottom of the panel
          so the two libraries' buttons line up with each other whatever their grids
          are doing above them. */}
      {hidden > 0 && (
        <div className="mt-auto">
          <ViewAllToggle
            label="Tools"
            accent="#46d5e0"
            expanded={expanded}
            hiddenCount={hidden}
            controls="tool-library"
            onToggle={() => setExpanded((value) => !value)}
          />
        </div>
      )}
    </HudPanel>
  );
}

function ToolItem({ tool, index }: { tool: Tool; index: number }) {
  const color = markColor(tool.glyph);

  return (
    <motion.li
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.26, ease: "easeOut", delay: 0.38 + index * 0.02 }}
      style={{ "--mark": color } as CSSProperties}
      className="group"
      title={tool.name}
    >
      {/* No fill and no border at rest, for the same reason the technology cells
          have none — see that file. */}
      <div className="relative flex h-full items-center justify-center gap-2.5 rounded-[4px] px-3 py-2 transition-colors duration-200 group-hover:bg-[rgb(190_205_220/0.05)]">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          style={{ background: `radial-gradient(52% 88% at 50% 50%, ${color}24, transparent 74%)` }}
        />
        <span aria-hidden="true" className="relative shrink-0" style={{ color: "var(--mark)" }}>
          <Mark glyph={tool.glyph} size={24} />
        </span>
        <span className="relative min-w-0 truncate text-[12px] leading-none text-[#ccd5df] transition-colors duration-200 group-hover:text-white">
          {tool.name}
        </span>
      </div>
    </motion.li>
  );
}
