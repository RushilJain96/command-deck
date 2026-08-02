"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { TargetAnnouncer } from "@/components/TargetAnnouncer";
import { ARRIVAL } from "@/features/scenes/arrival";
import { ActiveMissionPanel } from "./ActiveMissionPanel";
import { OperatorPanel } from "./OperatorPanel";
import { StatsPanel } from "./StatsPanel";
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
const LEFT_RAIL = [OperatorPanel, ActiveMissionPanel, StatsPanel];
const RIGHT_CLUSTER = [SystemsPanel, TargetReadout, Telemetry];

export function CommandHud() {
  return (
    <div className="pointer-events-none absolute inset-0">
      {/* Left rail: identity, then commitment, then record. */}
      <div className="deck-md:hidden pointer-events-auto absolute top-20 left-5 flex w-60 flex-col gap-2.5">
        {LEFT_RAIL.map((Panel, index) => (
          <Reveal key={Panel.name} from={-14} index={index}>
            <Panel />
          </Reveal>
        ))}
      </div>

      {/* Right cluster: what the machine is doing. Pinned to the BOTTOM so it
          sits below the orbit's widest band — anchoring it to the top would put
          it straight through the two outermost missions. */}
      <div className="deck-md:hidden pointer-events-auto absolute right-5 bottom-20 flex w-60 flex-col gap-2.5">
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
