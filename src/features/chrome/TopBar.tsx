"use client";

import { motion } from "framer-motion";
import { useScene } from "@/features/app/hooks";
import { MissionClock } from "@/features/hud/MissionClock";
import { cn } from "@/lib/cn";
import { DESTINATIONS, type Destination } from "./destinations";

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
 * seams, each segment carrying a glyph and a label. A visitor reads it as a
 * switch with six positions, four of which are not wired yet, which is exactly
 * the truth.
 *
 * TWO THINGS CAME OFF EACH SEGMENT: the channel number and the status lamp. Both
 * were doing the switch-position job, and with the housing, the seams and the lit
 * underline all doing it too the segment had five separate cues for one fact.
 * What that cost is measurable — a number plus a glyph plus a lamp plus a label
 * inside 138px leaves the label about half the segment, so the type could not go
 * up to a size that reads across a room. It is 11.5px now with a 15px glyph,
 * which is the reference's proportion and the reason the bar finally looks like
 * hardware rather than like a toolbar.
 *
 * 92px TALL AT A 14px INSET, up from a flush 56. The bar carries three registers
 * now (name over subtitle, glyph over label, status over clock) and 56px cannot
 * set two lines of type twice without them touching.
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
      // 92px AT `lg`, 56 BELOW IT. The bar is 92 tall because it sets two lines
      // of type in three places — name over subtitle, glyph over label, status
      // over clock. Below `deck-md` the middle one is gone: <DestinationSelector>
      // hides and the bar carries identity and the clock only.
      //
      // Holding 92 there was not free. The layout solver reports the taller bar
      // as the binding constraint on `--orbit-radius` at every `md` viewport
      // under about 740px, because the highest callout has to clear it — so 36px
      // of chrome reserved for a control that is not drawn was costing roughly
      // 50px of orbit and putting ORION through NEXUS at 1280x720.
      className="deck-md:h-[56px] absolute top-[14px] right-[14px] left-[14px] z-40 flex h-[92px] items-stretch justify-between gap-4"
    >
      {/* Operator identity, in its own cell.
          NO EMBLEM. The mark was a miniature of the deck sitting next to a deck
          you can already see, and at 30px beside 19px type it was the first thing
          the eye landed on — a logo introducing the thing directly behind it. The
          insignia vocabulary is not lost; it is on the legend card bottom-right,
          where it has a panel to be the signature OF. */}
      <div className="border-panel-edge bg-panel flex w-[321px] shrink-0 flex-col justify-center rounded-[3px] border px-6">
        <span className="text-t1 text-[19px] leading-none font-medium tracking-[0.01em] uppercase">
          Rushil Jain
        </span>
        {/* Red, not tertiary grey. This line is the deck's own name, and the
            deck's accent is red — it is the one place identity and system
            colour are the same statement. Everything else in this register on
            the deck is a label for something; this is a title. */}
        <span className="text-signal tracking-label mt-2 font-mono text-[9.5px] leading-none uppercase">
          Engineering Command Center
        </span>
      </div>

      <DestinationSelector activeSceneId={scene.id} />

      {/* System state. Two lines rather than one, matching the identity cell's
          rhythm on the opposite edge: what the deck IS on top, what time it is
          underneath. The old single "ALL SYSTEMS NOMINAL" string was one long
          line with no register above it, so the right end of the bar had a
          different vertical structure from the left and the whole thing read
          slightly untuned. */}
      <div className="deck-md:hidden flex shrink-0 flex-col items-end justify-center gap-2">
        <span className="flex items-center gap-2">
          <span className="text-t3 tracking-label font-mono text-[9.5px] leading-none uppercase">
            System Status
          </span>
          <span className="text-nominal tracking-label font-mono text-[9.5px] leading-none uppercase">
            Online
          </span>
          <span className="signal-blink bg-nominal h-1.5 w-1.5 rounded-full" />
        </span>
        <MissionClock />
      </div>
    </motion.header>
  );
}

function DestinationSelector({ activeSceneId }: { activeSceneId: string }) {
  return (
    // NOT `flex-1`. Stretching the selector across everything the identity cell
    // and the status block leave over gave each segment ~250px on a 1536 frame,
    // which spaces a six-position switch out until it reads as a menu bar again —
    // the exact thing the housing exists to prevent. Sized to its content and
    // centred by the header's `justify-between`, the segments land at the
    // reference's ~138px and the switch reads as one instrument.
    <nav aria-label="Primary" className="deck-md:hidden min-w-0 shrink">
      {/* One housing, matched to <HudPanel>'s values. The rails and this housing
          are one instrument; leaving the selector on its own fill while the side
          panels moved to the shared tokens would read as the top bar being lit by
          something the rest of the deck is not.

          THE CHAMFER IS GONE. It was a two-layer bezel-over-face construction
          purely because a border on a `clip-path` box loses its mitred corners —
          real complexity bought for a corner cut. With the HUD panels back to
          plain rectangles the mitre had become the only one in the chrome, and a
          single chamfered element among square ones reads as an inconsistency
          rather than as a motif. The mitre vocabulary stays where it means
          something: the mission callouts. */}
      <ul
        className={cn(
          "border-panel-edge bg-panel flex h-full items-stretch rounded-[3px] border",
          "shadow-[inset_0_1px_0_0_rgb(255_255_255/0.04)]",
        )}
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
      {!isFirst && <span aria-hidden="true" className="bg-panel-edge absolute inset-y-4 left-0 w-px" />}

      <button
        type="button"
        aria-current={isActive ? "page" : undefined}
        aria-disabled={isLocked || undefined}
        title={isLocked ? `${destination.label} — not yet available` : undefined}
        className={cn(
          "group relative flex h-full w-full items-center justify-center gap-2.5 px-5 py-2",
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
              className="bg-signal absolute inset-x-0 bottom-0 h-[2px]"
              style={{ boxShadow: "0 0 8px rgb(255 42 42 / 0.75)" }}
            />
          </motion.span>
        )}

        <span className="relative flex items-center gap-2.5">
          <Icon size={15} strokeWidth={1.75} aria-hidden="true" className="shrink-0" />
          <span className="tracking-micro font-mono text-[11.5px] whitespace-nowrap uppercase">
            {destination.label}
          </span>
        </span>
      </button>
    </li>
  );
}
