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
import { SystemsPanel } from "./SystemsPanel";
import { TargetReadout } from "./TargetReadout";
import { Telemetry } from "./Telemetry";

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
 * COMPOSITION: A FULL-HEIGHT LEFT RAIL AND A BOTTOM-RIGHT CLUSTER.
 *
 * The deck used to run four panels left and one right, which pulled the whole
 * frame off balance — the eye kept returning to the left edge instead of to the
 * vehicle. The obvious fix, a matching right rail, is not available: two
 * full-height 224px rails plus an orbit wide enough to keep six callouts apart
 * has NO solution below about 1600px, which a headless collision solver says
 * outright and which showed up live as missions sitting under both sidebars.
 *
 * So the right-hand mass sits low instead, beside the dock, under the plane's
 * widest band where there is nothing to collide with. That balances the frame
 * without stealing the flanks. Each side still has a subject: the left is the
 * OPERATOR (who they are, what is selected, what has been built), the right is
 * the MACHINE (what is being pointed at, what the subsystems report). Adding a
 * panel means deciding which it belongs to — and if it goes right, checking it
 * still clears the orbit.
 *
 * Both reveal AFTER the camera has begun settling, so the instruments read as
 * coming online around an arriving vehicle rather than as a page loading.
 */
const LEFT_RAIL = [CommandCenterPanel, LatestCommitPanel];
const RIGHT_CLUSTER = [SystemsPanel, TargetReadout, Telemetry];

export function CommandHud() {
  const [railOpen, setRailOpen] = useState(true);

  return (
    <div className="pointer-events-none absolute inset-0">
      {/* Left rail: identity, then commitment, then record.
          208px, NOT 240. The rail is the single largest term in the
          --orbit-radius reserve, so its width is what decides how far down the
          viewport range this whole composition survives — 240 stopped it at
          1500px, where most laptops never saw it. See the `deck-md` note in
          globals.css, and change the solver's TIER.lg.rail with it.

          THE RAIL SLIDES, IT DOES NOT UNMOUNT. Unmounting would remount the
          <Reveal> wrappers below, which carry the arrival choreography — so
          every re-open would replay a 0.75s staggered entrance that only makes
          sense once, when the deck first comes online. `inert` takes it out of
          the tab order and the accessibility tree while it is away, which is
          the part that actually matters and the part `opacity: 0` alone does
          not do. */}
      <motion.div
        id="instrument-rail"
        inert={!railOpen}
        animate={{ x: railOpen ? 0 : -248, opacity: railOpen ? 1 : 0 }}
        transition={SPRING.ui}
        className="deck-md:hidden pointer-events-auto absolute top-[72px] left-5 flex w-52 flex-col gap-2"
      >
        {LEFT_RAIL.map((Panel, index) => (
          <Reveal key={Panel.name} from={-14} index={index}>
            <Panel />
          </Reveal>
        ))}
      </motion.div>

      <RailToggle open={railOpen} onToggle={() => setRailOpen((v) => !v)} />

      {/* Right cluster: what the machine is doing. Pinned to the BOTTOM so it
          sits below the orbit's widest band — anchoring it to the top would put
          it straight through the two outermost missions. */}
      <div className="deck-md:hidden pointer-events-auto absolute right-5 bottom-20 flex w-52 flex-col gap-2.5">
        {RIGHT_CLUSTER.map((Panel, index) => (
          <Reveal key={Panel.name} from={14} index={index}>
            <Panel />
          </Reveal>
        ))}
      </div>

      {/* Below deck-md both rails are gone, so the target readout is promoted
          to its own strip above the dock — dropping it entirely would leave
          hover and focus with no feedback anywhere on screen. */}
      <div className="deck-md:block pointer-events-auto absolute right-4 bottom-20 left-4 hidden">
        <Reveal from={0} index={0}>
          <TargetReadout />
        </Reveal>
      </div>

      <TargetAnnouncer />
    </div>
  );
}

/**
 * Dismiss control for the instrument rail.
 *
 * Rides the rail's outboard edge: 216px out when the rail is open (208 wide plus
 * an 8px gap), back to the deck margin when it is closed. So the button is
 * always the thing immediately to the right of wherever the rail currently is,
 * and it never has to be hunted for.
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
      animate={{ x: open ? 216 : 0 }}
      transition={SPRING.ui}
      className="deck-md:hidden pointer-events-auto absolute top-[72px] left-5"
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
          "text-t3 hover:text-t1 flex h-[22px] w-[22px] items-center justify-center",
          "border border-white/[0.09] bg-[linear-gradient(158deg,rgb(13_16_21/0.96),rgb(4_5_8/0.98))]",
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
