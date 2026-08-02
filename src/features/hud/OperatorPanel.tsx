"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useActiveTargetId } from "@/features/app/hooks";
import { getMissionById, MISSION_BRIEFINGS } from "@/features/missions/data";
import { HudDivider, HudPanel } from "./HudPanel";
import { OPERATOR } from "./operator";

/**
 * The introduction — and the deck's narrative thread.
 *
 * First panel in the rail, and deliberately the only one on the deck written in
 * plain language rather than instrument shorthand. A visitor should be able to
 * answer "whose work is this and what do they do?" before touching anything —
 * the rest of the deck is navigation, and navigation is useless until you know
 * whose territory you are navigating.
 *
 * THE BRIEFING LINE FOLLOWS THE POINTER. At rest it states what the operator
 * does; over a mission it states what that mission is for. So the panel narrates
 * the exploration instead of sitting inert, and a visitor who never clicks
 * anything still reads six sentences of substance just by moving the mouse
 * across the deck.
 *
 * It reads the ACTIVE target, not the locked one, on purpose: this is the one
 * place on the rail where reacting to hover is the whole feature. The
 * neighbouring <ActiveMissionPanel> reads the locked target precisely so that
 * it holds still while this one moves.
 */
export function OperatorPanel() {
  const mission = getMissionById(useActiveTargetId());
  const briefing = mission ? MISSION_BRIEFINGS[mission.id] : undefined;

  return (
    <HudPanel label="Operator">
      {/* Fixed min-height so the rail below does not shift as the line swaps.
          Two lines is the longest any briefing runs at this width. */}
      <div className="min-h-[42px]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={mission?.id ?? "standing"}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="text-t1 text-[15px] leading-[1.4] font-medium tracking-[-0.01em]"
          >
            {briefing ?? OPERATOR.thesis}
          </motion.p>
        </AnimatePresence>
      </div>

      <HudDivider />

      <ul className="flex flex-wrap gap-x-2 gap-y-1.5">
        {OPERATOR.focus.map((area) => (
          <li
            key={area}
            className="text-t2 tracking-micro border border-white/[0.09] bg-white/[0.03] px-1.5 py-1 font-mono text-[9px] uppercase"
          >
            {area}
          </li>
        ))}
      </ul>

      <div className="mt-3.5 flex items-baseline gap-2">
        <span className="text-t3 tracking-micro shrink-0 font-mono text-[9px] uppercase">Now</span>
        <span className="text-t2 truncate text-[11px] leading-none">{OPERATOR.currentFocus}</span>
      </div>
    </HudPanel>
  );
}
