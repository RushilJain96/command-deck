"use client";

import { motion } from "framer-motion";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useAppDispatch } from "@/features/app/hooks";
import { cn } from "@/lib/cn";
import { SPRING } from "@/lib/motion/springs";
import type { MissionSlot } from "./types";

const STATUS_DOT: Record<MissionSlot["status"], string> = {
  online: "bg-red-500",
  standby: "bg-zinc-400",
  locked: "bg-zinc-700",
};

/**
 * Positions itself with pure CSS polar geometry — no trigonometry, no viewport
 * measurement, correct on first paint and immune to resize.
 *
 * The transform reads right-to-left: centre the box on the origin, spin it back
 * by -theta so its content stays upright, push it out along the orbit, then
 * rotate the whole arm to theta. `transform-origin: 0 0` anchors that chain to
 * the world origin rather than the node's own centre.
 *
 * The polar transform lives on the <li> and the interactive scaling on the
 * inner motion element, so Framer Motion never fights the layout transform for
 * the same style property.
 */
export function MissionNode({ mission, isActive }: { mission: MissionSlot; isActive: boolean }) {
  const dispatch = useAppDispatch();

  // Touch fires pointerenter with no matching pointerleave, which would latch
  // the target permanently. Touch targeting is a tap concern, not a hover one.
  const handlePointerEnter = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.pointerType === "touch") return;
    dispatch({ type: "target/pointer", id: mission.id });
  };

  const handlePointerLeave = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.pointerType === "touch") return;
    dispatch({ type: "target/pointer", id: null });
  };

  return (
    <li
      className="absolute left-0 top-0 origin-top-left"
      style={{
        transform: `rotate(${mission.theta}deg) translateY(calc(-1 * var(--orbit-radius))) rotate(${-mission.theta}deg) translate(-50%, -50%)`,
      }}
    >
      <motion.button
        type="button"
        animate={{ scale: isActive ? 1.12 : 1 }}
        transition={SPRING.ui}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onFocus={() => dispatch({ type: "target/focus", id: mission.id })}
        onBlur={() => dispatch({ type: "target/focus", id: null })}
        onClick={() => dispatch({ type: "target/lock", id: mission.id })}
        aria-current={isActive ? "true" : undefined}
        aria-label={`Mission slot ${mission.label}, ${mission.status}`}
        className={cn(
          "flex h-16 w-16 cursor-pointer flex-col items-center justify-center gap-1 rounded-full border text-xs font-medium",
          "outline-none transition-colors duration-200",
          "focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black",
          isActive
            ? "border-red-500/60 bg-zinc-900 text-zinc-50"
            : "border-white/10 bg-zinc-950/80 text-zinc-400 hover:border-white/25",
        )}
      >
        <span
          aria-hidden="true"
          className={cn("h-1.5 w-1.5 rounded-full", STATUS_DOT[mission.status])}
        />
        <span aria-hidden="true" className="font-mono tracking-widest">
          {mission.label}
        </span>
      </motion.button>
    </li>
  );
}
