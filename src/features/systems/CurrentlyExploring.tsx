"use client";

import { motion } from "framer-motion";
import { Telescope } from "lucide-react";
import { HudPanel } from "@/features/hud/HudPanel";
import { cn } from "@/lib/cn";
import { PANEL_ICON_SIZE, PANEL_LABEL } from "./panelStyle";
import {
  CURRENTLY_EXPLORING,
  DOMAIN_ACCENT,
  EXPLORATION_FOCUS,
  STAGE_TONE,
  type ExplorationTrack,
} from "./data";

/**
 * Trajectory, not inventory.
 *
 * This panel is the honest counterweight to the two libraries beside it. A wall of
 * technology names implies uniform command of all of them; this says which ones
 * the operator is currently IN, and it is the reason the domain cards are allowed
 * to be as broad as they are.
 *
 * THE FIGURES ARE OFF AGAIN — bar and stage word only. `data.ts` records the full
 * history; the short version is that the numbers were removed, restored at the
 * operator's direction, and are now removed a second time. `depth` is still stored
 * and still sets each bar's length, so the graphic keeps its resolution; what is
 * gone is the printed value beside it.
 *
 * That is the better arrangement and it is worth saying why in one line: a bar of
 * a given length invites the reader to estimate, which is an honest thing for a
 * rough measure to invite. A printed "88%" invites them to believe two significant
 * figures, which nothing here can support.
 *
 * THE BAR IS VIOLET, NEVER GREEN. Green on this deck means "deployed"
 * (`--nominal`), and a green bar at four-fifths would read as a competence score.
 * Violet is the AI/ML domain's accent, which is what all six of these tracks are,
 * so the bar says "how far into this subject" in the colour the subject has.
 *
 * IT OUTRANKS THE TWO LIBRARIES BESIDE IT, AND THE FRAME IS WHERE THAT IS SAID.
 * All three panels are the same size and the same housing, so at rest the row read
 * as three equal inventories — which understates this one: the libraries are what
 * the operator HAS, this is where the operator is GOING. A lit violet top edge and
 * a glowing focus badge separate it, and neither adds an element.
 */
const TRAJECTORY = DOMAIN_ACCENT.intelligence;

export function CurrentlyExploring() {
  return (
    <HudPanel
      label="Currently Exploring"
      icon={Telescope}
      // Same violet as the panel's head rule, its bars and its focus badge — every
      // mark on this panel is one statement, not four decisions.
      iconClassName="text-[#a78bff]"
      iconSize={PANEL_ICON_SIZE}
      labelClassName={PANEL_LABEL}
      corners
      // The top edge only. `border-t-[...]` overrides the housing's border colour
      // on one side and leaves the other three on the shared token, so the panel
      // is still the same housing — lit along its head, the way the domain cards
      // are. The shadow restates `--panel-shadow` because a `shadow-*` utility
      // here would otherwise replace it outright rather than adding to it.
      className={cn(
        "flex h-full min-h-0 flex-col",
        "border-t-[rgb(167_139_255/0.6)]",
        "shadow-[var(--panel-shadow),0_-10px_26px_-20px_rgb(167_139_255/0.6)]",
      )}
      bodyClassName="min-h-0 flex-1 flex flex-col px-4 py-3"
    >
      {/* THE ROW PITCH IS THE PANEL'S TIGHTEST CONSTRAINT. Six rows, a badge and
          a guaranteed gap have to land inside 303 units once the heading went to
          13px and the labels to 12 — and the panel is the tallest of the three in
          this row, so it is what the row's height is solved against. 8 between
          rows and 7 under each label is the least that still reads as six separate
          readings rather than a block. */}
      <ul className="mb-3 flex flex-col gap-2">
        {CURRENTLY_EXPLORING.map((track, index) => (
          <TrackRow key={track.id} track={track} index={index} />
        ))}
      </ul>

      {/* THE FOCUS BADGE — the thesis the six rows add up to, in its own lit
          housing. Violet throughout rather than the violet-to-red wash it carried
          before: the badge is the conclusion of a violet panel, and running it into
          the deck's identity red made it read as a second subject rather than as
          this panel's own summary. The outward glow is the only place on the
          console where a housing emits rather than reflects, which is what makes it
          the last thing the eye lands on. */}
      <div
        className="mt-auto flex items-center gap-2 rounded-[3px] border px-3 py-2.5"
        style={{
          borderColor: `${TRAJECTORY}80`,
          background: `linear-gradient(90deg, ${TRAJECTORY}26, ${TRAJECTORY}0f)`,
          boxShadow: `0 0 18px -6px ${TRAJECTORY}73, inset 0 1px 0 0 rgb(255 255 255 / 0.07)`,
        }}
      >
        <span
          aria-hidden="true"
          className="signal-blink h-1.5 w-1.5 shrink-0 rounded-full"
          style={{ backgroundColor: TRAJECTORY }}
        />
        <span
          className="tracking-micro shrink-0 font-mono text-[10px] leading-none uppercase"
          style={{ color: TRAJECTORY }}
        >
          Focus
        </span>
        <span className="text-t1 min-w-0 truncate text-[12.5px] leading-none font-medium">
          {EXPLORATION_FOCUS}
        </span>
      </div>
    </HudPanel>
  );
}

function TrackRow({ track, index }: { track: ExplorationTrack; index: number }) {
  return (
    <li className="group">
      <div className="flex items-baseline justify-between gap-3">
        {/* UPPERCASE, matching the reference and the console's other row labels.
            Sentence case read as body copy in a panel whose neighbours are all
            labels, and at 11.5px it was the quietest line in a section that is
            supposed to be the loudest. */}
        <span className="text-t1 min-w-0 truncate text-[12px] leading-none font-medium tracking-[0.06em] uppercase">
          {track.label}
        </span>
        {/* THE STAGE WORD IS THE WHOLE READOUT NOW. It was 9.5px beside a 13px
            figure, sized to be the figure's qualifier; with the figure gone it is
            the only thing on this side of the row and it is set to say so. */}
        <span
          className={cn(
            "shrink-0 font-mono text-[11px] leading-none tracking-[0.14em] uppercase",
            STAGE_TONE[track.stage],
          )}
        >
          {track.stage}
        </span>
      </div>

      {/* The bar GROWS to its value on arrival rather than fading in — growth is
          the only motion that means progress, and a fade would just be the row
          appearing. Width rather than `scaleX` so the track's own rounded end is
          not squashed by the transform. */}
      <div
        aria-hidden="true"
        className="mt-[7px] h-[4px] w-full overflow-hidden rounded-full bg-[rgb(190_205_220/0.09)]"
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${track.depth}%` }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.42 + index * 0.06 }}
          className="h-full rounded-full"
          style={{
            background: `linear-gradient(90deg, ${TRAJECTORY}b3, ${TRAJECTORY})`,
            boxShadow: `0 0 8px -1px ${TRAJECTORY}99`,
          }}
        />
      </div>
    </li>
  );
}
