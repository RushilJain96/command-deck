"use client";

import { motion } from "framer-motion";
import { useScene } from "@/features/app/hooks";
import { MissionClock } from "@/features/hud/MissionClock";
import { hudChamfer } from "@/lib/chamfer";
import { cn } from "@/lib/cn";
import { DESTINATIONS, type Destination } from "./destinations";
import { Emblem } from "./Emblem";

/**
 * Persistent top navigation.
 *
 * Rendered as a SIBLING of <SceneHost>, not inside a scene. Inside, it would
 * fade out and back in on every scene transition, which is wrong for chrome
 * that represents the application rather than the current view — and it would
 * sit inside a wrapper whose animating opacity makes it a backdrop root.
 *
 * THIS IS A MODE SELECTOR, NOT A MENU. Six words in a row is the one element
 * that read as a website while everything around it read as software, and the
 * fix is not styling — it is changing what the control *is*. So the
 * destinations live inside a single machined housing, divided by hairline
 * seams, each segment carrying a channel number, a glyph and a status lamp. A
 * visitor reads it as a switch with six positions, four of which are not
 * wired yet, which is exactly the truth.
 *
 * It reads SceneContext only, so pointing at mission nodes never re-renders it.
 */
export function TopBar() {
  const scene = useScene();

  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="absolute inset-x-0 top-0 z-40 flex h-14 items-center justify-between gap-6 px-5"
    >
      {/* Operator identity */}
      <div className="flex shrink-0 items-center gap-2.5">
        <Emblem />
        <span className="flex flex-col leading-none">
          <span className="text-t1 text-[14px] font-medium tracking-tight">Rushil Jain</span>
          {/* Red, not tertiary grey. This line is the deck's own name, and the
              deck's accent is red — it is the one place identity and system
              colour are the same statement. Everything else in this register on
              the deck is a label for something; this is a title. */}
          <span className="text-signal tracking-label mt-1 font-mono text-[8.5px] uppercase">
            Engineering Command Center
          </span>
        </span>
      </div>

      <DestinationSelector activeSceneId={scene.id} />

      {/* System state */}
      <div className="flex shrink-0 items-center gap-4">
        <span className="deck-md:hidden flex items-center gap-2">
          <span className="signal-blink bg-nominal h-1.5 w-1.5" />
          <span className="text-t3 tracking-label font-mono text-[9px] uppercase">
            All systems nominal
          </span>
        </span>
        <MissionClock />
      </div>
    </motion.header>
  );
}

function DestinationSelector({ activeSceneId }: { activeSceneId: string }) {
  return (
    <nav aria-label="Primary" className="deck-md:hidden min-w-0">
      {/* One housing, cut from the same chamfer vocabulary as the HUD panels and
          the mission callouts. The bezel-over-face construction is the same
          two-layer trick used everywhere else on the deck: a border on a
          clipped box loses its mitred corners. */}
      {/* Matched to <HudPanel>'s darkened values. The rails and this housing are
          one instrument; leaving the selector at its old level while the side
          panels dropped would read as the top bar being lit by something the
          rest of the deck is not. */}
      <div className="bg-white/[0.07] p-px" style={{ clipPath: hudChamfer("left") }}>
        <ul
          className={cn(
            "flex items-stretch",
            "bg-[linear-gradient(168deg,rgb(13_16_21/0.96),rgb(4_5_8/0.98))]",
            "shadow-[inset_0_1px_0_0_rgb(255_255_255/0.05),inset_0_-1px_0_0_rgb(0_0_0/0.55)]",
          )}
          style={{ clipPath: hudChamfer("left") }}
        >
          {DESTINATIONS.map((destination, index) => (
            <Segment
              key={destination.id}
              destination={destination}
              isActive={destination.sceneId === activeSceneId}
              isFirst={index === 0}
            />
          ))}
        </ul>
      </div>
    </nav>
  );
}

function Segment({
  destination,
  isActive,
  isFirst,
}: {
  destination: Destination;
  isActive: boolean;
  isFirst: boolean;
}) {
  // Locked until its sprint lands. aria-disabled rather than the `disabled`
  // attribute keeps it focusable, so a keyboard user can still discover the
  // structure.
  const isLocked = destination.sceneId === null;
  const Icon = destination.icon;

  return (
    <li className="relative">
      {/* Seam between positions. Inset vertically so it reads as a division in
          the faceplate rather than a full-height table rule. */}
      {!isFirst && <span aria-hidden="true" className="absolute inset-y-1.5 left-0 w-px bg-white/[0.09]" />}

      <button
        type="button"
        aria-current={isActive ? "page" : undefined}
        aria-disabled={isLocked || undefined}
        title={isLocked ? `${destination.label} — not yet available` : undefined}
        className={cn(
          "group relative flex h-full items-center gap-2 px-3 py-2",
          "outline-none transition-colors duration-200",
          "focus-visible:ring-signal/70 -outline-offset-2 focus-visible:ring-2",
          // THE WHOLE SEGMENT GOES RED WHEN IT IS THE CURRENT ONE, label and
          // icon together, not just the underline beneath it. A red rule under
          // white text says "the rule marks this position"; red text says "this
          // position is the one running". The deck has exactly one live channel
          // and it should be readable at a glance from across the room.
          isActive
            ? "text-signal"
            : isLocked
              ? "text-t4 cursor-not-allowed"
              : "text-t3 hover:text-t1",
        )}
      >
        {isActive && (
          // layoutId gives the indicator a spring-driven slide for free the
          // moment a second scene becomes reachable.
          <motion.span
            layoutId="nav-active"
            className="absolute inset-0 bg-[rgb(255_42_42/0.07)]"
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
          >
            {/* Underline in signal red. Together with the lamp it says "you are
                here AND this workspace is running", which a highlight box alone
                never communicates.
                The bloom is what makes it read as lit rather than printed —
                it is the same treatment the waypoint markers get on the plane,
                and for the same reason. */}
            <span
              className="bg-signal absolute inset-x-0 bottom-0 h-[1.5px]"
              style={{ boxShadow: "0 0 8px rgb(255 42 42 / 0.75)" }}
            />
          </motion.span>
        )}

        <span className="relative flex items-center gap-2">
          {/* Channel number. The single cheapest thing that makes a row of
              words read as switch positions. */}
          <span
            className={cn(
              "font-mono text-[8px] leading-none tabular-nums transition-colors duration-200",
              isActive ? "text-signal" : "text-t4",
            )}
          >
            {destination.index}
          </span>

          <Icon size={12} strokeWidth={1.75} aria-hidden="true" className="shrink-0" />

          <span className="tracking-micro font-mono text-[10px] uppercase">{destination.label}</span>

          {/* Status lamp: lit and blinking where the channel is live, a dark
              slug where it is not. Locked positions are shown rather than
              hidden — the shape of the whole system should be legible on
              arrival, including the parts that do not exist yet. */}
          <span
            aria-hidden="true"
            className={cn(
              "h-1 w-1 shrink-0 transition-colors duration-200",
              isActive
                ? "bg-nominal signal-blink"
                : isLocked
                  ? "bg-t4/60"
                  : "bg-t3 group-hover:bg-nominal",
            )}
          />
        </span>
      </button>
    </li>
  );
}
