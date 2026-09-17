"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { JOURNEY_CLOSE } from "./data";
import { RAIL_COLUMNS } from "./JourneyRail";

/**
 * THE PAGE'S SIGN-OFF, SET ON A BASELINE THE JOURNEY STANDS ON.
 *
 * The first two attempts at this strip put more DATA at the foot of the page — a
 * stats band that contradicted other consoles, then a spine that restated the rail
 * sideways. Both were cut, and the sentence that replaced them is still the right
 * content: a timeline ends, and what belongs at the end of one is a sentence.
 *
 * What the sentence lacked was a place to stand. Bare centred type between two
 * fading rules, sitting wherever the rail happened to stop, read as a caption left
 * floating in the space above the footer rather than as the end of anything.
 *
 * So it is now a BASELINE, anchored to the bottom of the content column:
 *
 *   - one hairline across the whole width, closed with a short bracket tick at each
 *     end — the same corner language the HUD panels use, pared down to a line;
 *   - a node on it laid out on the rail's own column template, so it lands exactly
 *     under the dots above. The rail and its conclusion share an axis, which is
 *     what connects them without drawing the timeline any further;
 *   - the three beats sitting on the line, a size up from before, with the last one
 *     lit and given the faintest glow — and a low wash of the same red under the
 *     band, falling toward the footer, so the page's last colour meets the chrome
 *     instead of stopping a panel's height above it.
 *
 * IT IS STILL NOT A HUD PANEL. A bordered housing would file it beside CURRENTLY
 * and UP NEXT as a fourth instrument, and a reader would look for a reading in it.
 */
export function ClosingLine() {
  return (
    <motion.aside
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut", delay: 0.5 }}
      className="relative flex h-full flex-col justify-end"
    >
      {/* The wash. Wide and very low, so it tints the foot of the page rather than
          reading as a spotlight on the words. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-[8%] -bottom-6 h-[120px]"
        style={{
          background:
            "radial-gradient(50% 60% at 50% 100%, rgb(255 61 61 / 0.075), transparent 100%)",
        }}
      />

      <div className={cn("relative grid items-center", RAIL_COLUMNS)}>
        {/* WHEN column: the rule leads in from the frame edge. */}
        <div aria-hidden="true" className="flex items-center">
          <Tick />
          <span className="bg-panel-rule h-px flex-1" />
        </div>

        {/* AXIS column: the node under the rail's dots. */}
        <div aria-hidden="true" className="relative flex items-center justify-center">
          <span className="bg-panel-rule absolute -inset-x-3 top-1/2 h-px @3xl:-inset-x-4" />
          <span
            className="relative block h-[9px] w-[9px] rotate-45 border"
            style={{
              borderColor: "rgb(255 61 61 / 0.8)",
              backgroundColor: "rgb(255 61 61 / 0.16)",
              boxShadow: "0 0 10px rgb(255 61 61 / 0.35)",
            }}
          />
        </div>

        {/* CARD column, which spans the side panels too: the line with the sentence
            set into it. Below @2xl the beats stack, left-aligned, since the full
            sentence is wider than a phone-width column. */}
        <div className="flex min-w-0 items-center gap-5">
          <span aria-hidden="true" className="bg-panel-rule hidden h-px flex-1 @2xl:block" />

          <p className="tracking-micro flex shrink-0 flex-col gap-2 font-mono text-[13px] leading-none uppercase @2xl:flex-row @2xl:items-baseline @2xl:gap-4 @2xl:text-[14px]">
            {JOURNEY_CLOSE.map((beat, index) => {
              // The last beat is the one the sentence is FOR — the two before it
              // are the setup. Lighting all three would flatten the cadence.
              const last = index === JOURNEY_CLOSE.length - 1;
              return (
                <span
                  key={beat}
                  className={last ? "text-signal" : "text-t2"}
                  style={last ? { textShadow: "0 0 14px rgb(255 61 61 / 0.35)" } : undefined}
                >
                  {beat}
                </span>
              );
            })}
          </p>

          <span aria-hidden="true" className="bg-panel-rule h-px min-w-6 flex-1" />
          <Tick />
        </div>
      </div>
    </motion.aside>
  );
}

/** The bracket end of the baseline — a short upright, like a HUD panel's corner. */
function Tick() {
  return <span className="bg-panel-edge block h-[9px] w-px shrink-0" />;
}
