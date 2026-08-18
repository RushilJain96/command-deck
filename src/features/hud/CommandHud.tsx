"use client";

import { useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { PanelLeft, X } from "lucide-react";
import { TargetAnnouncer } from "@/components/TargetAnnouncer";
import { ARRIVAL } from "@/features/scenes/arrival";
import { cn } from "@/lib/cn";
import { SPRING } from "@/lib/motion/springs";
import { CommandCenterPanel } from "./CommandCenterPanel";
import { LatestCommitPanel } from "./LatestCommitPanel";
import { LaunchPrompt } from "./LaunchPrompt";
import { MissionControlCard } from "./MissionControlCard";

/**
 * Scene-scoped HUD.
 *
 * SCREEN SPACE — every child here is a sibling of <CameraRig>, never inside it.
 * A transformed ancestor would become the containing block for any fixed
 * descendant, open a stacking context, and scale these panels with camera zoom.
 *
 * These panels are scene-specific (they describe the deck), so unlike the top
 * bar and dock they live inside the scene and are free to transition with it.
 *
 * THE LEFT RAIL IS ONE READOUT, NOT A STACK OF CARDS.
 *
 * It used to open with <OperatorPanel> (a thesis line that followed the pointer)
 * and <ActiveMissionPanel> (the locked target) above the figures. Both are stood
 * down. Three cards in a column read as three unrelated widgets, and they pushed
 * the record — the only part of the rail carrying actual data — into the bottom
 * third where nobody looks first. A command centre's side column is a single
 * continuous instrument.
 *
 * Neither panel's content is lost. The operator thesis belongs in the footer
 * tagline, which is where an introduction goes on a deck whose top bar already
 * states the name; the locked target is still reported by <TargetReadout> on the
 * right, and the selected mission's own callout carries its state. Both
 * components are kept rather than deleted — see their files.
 *
 * COMPOSITION: A FULL-HEIGHT LEFT RAIL AND ONE BOTTOM-RIGHT CARD.
 *
 * The deck used to run four panels left and one right, which pulled the whole
 * frame off balance — the eye kept returning to the left edge instead of to the
 * vehicle. The obvious fix, a matching right rail, is not available: two
 * full-height rails plus an orbit wide enough to keep six callouts apart has NO
 * solution below about 1600px, which a headless collision solver says outright
 * and which showed up live as missions sitting under both sidebars.
 *
 * So the right-hand mass sits low instead, under the plane's widest band where
 * there is nothing to collide with. That balances the frame without stealing the
 * flanks.
 *
 * THE RIGHT SIDE IS NOW A LEGEND, NOT A STACK OF READOUTS. <SystemsPanel> and
 * <Telemetry> are stood down (their files are kept). The three of them together
 * were the deck describing its own internals to a visitor who had not yet been
 * told what the deck was — targeting state, nav slots, frame time and zoom are
 * meaningful once you are using the thing and noise before then. What belongs in
 * the resting frame is the instruction, so <MissionControlCard> takes the space.
 *
 * <TargetReadout> is stood down with them. It existed to report hover and focus
 * where the rails were hidden, and nothing is hidden any more; the selected
 * callout says everything it did, in the place the operator is already looking.
 *
 * Each side still has a subject: the left is the OPERATOR (who they are, what
 * they have built, what they last shipped), the right is the DECK ITSELF (what
 * this is and how to work it). Adding a panel means deciding which it belongs to
 * — and if it goes right, checking it still clears the orbit.
 *
 * Both reveal AFTER the camera has begun settling, so the instruments read as
 * coming online around an arriving vehicle rather than as a page loading.
 */
/**
 * The left rail is now TWO groups rather than one stack, because it spans the
 * full height and pins each end of itself.
 *
 * The split is not arbitrary: the top group is the operator's STANDING RECORD,
 * which is true whether or not anything is happening, and the bottom is the most
 * recent EVENT. Fixed facts hang from the top bar, the latest thing sits on the
 * floor, and the deck breathes in between.
 */
const LEFT_RAIL_TOP = [CommandCenterPanel];
const LEFT_RAIL_BOTTOM = [LatestCommitPanel];

/**
 * DECK GEOMETRY, in one place, because five call sites below have to agree and
 * `scripts/deck-layout-check.mjs` mirrors all of them by hand.
 *
 * The frame runs on a 14px inset rather than 20 — the reference frames the whole
 * composition tighter, and 6px on each edge is 12px of orbit the callouts get
 * back. RAIL_TOP is the top bar's own inset plus its height plus a gap; RAIL_BOTTOM
 * clears the footer with a real margin rather than sitting on it.
 */
const FRAME_INSET = 14;
const RAIL_WIDTH = 226;
const RAIL_TOP = 86; // 14 inset + 62 bar + 10 gap
const RAIL_BOTTOM = 96; // 66 footer + 30 clearance
const LEGEND_WIDTH = 320;

export function CommandHud() {
  const [railOpen, setRailOpen] = useState(true);

  return (
    <div className="pointer-events-none absolute inset-0">
      {/* Left rail: identity, then commitment, then record.
          226px, UP FROM 208. The rail is the single largest term in the
          --orbit-radius reserve, so its width is what decides how far down the
          viewport range this whole composition survives — 240 stopped it at
          1500px, where most laptops never saw it. 226 is the reference's measured
          width and it is affordable because the frame inset came in by 6px on
          each side at the same time, so the net cost to the orbit is 6px rather
          than 18. Change the solver's TIER.rail with it.

          THE RAIL SLIDES, IT DOES NOT UNMOUNT. Unmounting would remount the
          <Reveal> wrappers below, which carry the arrival choreography — so
          every re-open would replay a 0.75s staggered entrance that only makes
          sense once, when the deck first comes online. `inert` takes it out of
          the tab order and the accessibility tree while it is away, which is
          the part that actually matters and the part `opacity: 0` alone does
          not do. */}
      {/* FULL HEIGHT, SPACE-BETWEEN. The rail used to be a `top-[72px]` stack
          that ended wherever its content ran out, which left the record floating
          in the upper-middle of the frame with a large dead gap beneath it — the
          column read as a card that had been placed rather than as a rail built
          into the chrome.

          Anchoring the bottom group to the floor is what makes it structural: the
          stats hang from the top bar, the record sits on the dock, and the empty
          space between them belongs to the deck instead of trailing off the end
          of a list.

          RAIL_BOTTOM CLEARS THE FOOTER RATHER THAN THE FRAME. The record used to
          sit 20px off the floor, which was correct when the floor was empty; the
          footer now owns the bottom 66px, and a panel resting on a footer reads as
          part of it. 96 is the footer plus 30, which is enough that the two are
          obviously separate objects.

          THE TOP IS NOT 0. A literal `top: 0` would run the rail up behind the
          top bar, which is a sibling drawn over it — the stats would be clipped by
          chrome rather than hanging from it. RAIL_TOP is the bar's inset plus its
          height plus a gap, which is where "the top of the usable frame" actually
          is. The gap between the two groups is not fixed — it absorbs whatever
          height the viewport has, which is also why this cannot be a plain `gap-2`
          stack. */}
      <motion.div
        id="instrument-rail"
        inert={!railOpen}
        animate={{ x: railOpen ? 0 : -(RAIL_WIDTH + FRAME_INSET + 20), opacity: railOpen ? 1 : 0 }}
        transition={SPRING.ui}
        style={{
          top: RAIL_TOP,
          bottom: RAIL_BOTTOM,
          left: FRAME_INSET,
          width: RAIL_WIDTH,
        }}
        className={cn(
          "pointer-events-auto absolute",
          // STACKED FROM THE TOP, NOT `justify-between`. Pinning the record to
          // the floor was meant to make it structural — stats hanging from the
          // top bar, the record sitting on the deck. What it produced was a 100px
          // hole in the middle of the column, because the two groups do not
          // together fill the rail's height and space-between puts every spare
          // pixel between exactly the two things that should read as one
          // instrument. `bottom` stays set: it is the height BUDGET the row
          // padding in <CommandCenterPanel> solves against, whether or not the
          // content reaches it.
          "flex flex-col gap-2",
        )}
      >
        {/* Top group: the standing record. */}
        <div className="flex flex-col gap-2">
          {LEFT_RAIL_TOP.map((Panel, index) => (
            <Reveal key={Panel.name} from={-14} index={index}>
              <Panel />
            </Reveal>
          ))}
        </div>

        {/* Bottom group, anchored to the floor of the frame. */}
        <div className="flex flex-col gap-2">
          {LEFT_RAIL_BOTTOM.map((Panel, index) => (
            <Reveal key={Panel.name} from={-14} index={LEFT_RAIL_TOP.length + index}>
              <Panel />
            </Reveal>
          ))}
        </div>
      </motion.div>

      <RailToggle open={railOpen} onToggle={() => setRailOpen((v) => !v)} />

      {/* The legend. Pinned to the BOTTOM so it sits below the orbit's widest
          band — anchoring it to the top would put it straight through the two
          outermost missions. Bottom-aligned with the rail's record, so the two
          low masses sit on one line. */}
      <div
        style={{ right: FRAME_INSET, bottom: RAIL_BOTTOM, width: LEGEND_WIDTH }}
        className="pointer-events-auto absolute"
      >
        <Reveal from={14} index={0}>
          <MissionControlCard />
        </Reveal>
      </div>

      <LaunchPrompt />

      <TargetAnnouncer />
    </div>
  );
}

/**
 * Dismiss control for the instrument rail.
 *
 * Rides the rail's outboard edge: RAIL_WIDTH + 8 out when the rail is open, back
 * to the deck margin when it is closed. So the button is always the thing
 * immediately to the right of wherever the rail currently is, and it never has to
 * be hunted for.
 *
 * A SEPARATE ELEMENT FROM THE RAIL, deliberately. If it lived inside the rail it
 * would slide off-screen with it and there would be no way back — and it cannot
 * inherit the rail's `inert` either, since the whole point is that it stays
 * operable while the rail is away.
 *
 * The radius is NOT recomputed when the rail closes. `--orbit-radius` reserves
 * space for the rail unconditionally, and making it conditional would resize the
 * entire orbit — every mission, the ship's standoff, the field — on a button
 * press. Collapsing the rail buys a clear view of the deck, not a bigger one.
 */
function RailToggle({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <motion.div
      animate={{ x: open ? RAIL_WIDTH + 8 : 0 }}
      transition={SPRING.ui}
      style={{ top: RAIL_TOP, left: FRAME_INSET }}
      className="pointer-events-auto absolute"
    >
      <motion.button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls="instrument-rail"
        aria-label={open ? "Hide instrument rail" : "Show instrument rail"}
        title={open ? "Hide instrument rail" : "Show instrument rail"}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: ARRIVAL.hud + 0.2 }}
        className={cn(
          "text-t3 hover:text-t1 flex h-[26px] w-[26px] items-center justify-center",
          "border-panel-edge bg-panel rounded-[3px] border",
          "outline-none transition-colors duration-200",
          "focus-visible:ring-signal/70 focus-visible:ring-2",
        )}
      >
        {open ? (
          <X size={12} strokeWidth={1.75} aria-hidden="true" />
        ) : (
          <PanelLeft size={12} strokeWidth={1.75} aria-hidden="true" />
        )}
      </motion.button>
    </motion.div>
  );
}

function Reveal({ children, from, index }: { children: ReactNode; from: number; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: from }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.55, delay: ARRIVAL.hud + index * 0.07, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
