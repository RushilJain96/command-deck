"use client";

import { motion } from "framer-motion";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import { useAppDispatch } from "@/features/app/hooks";
import { ARRIVAL } from "@/features/scenes/arrival";
import { cn } from "@/lib/cn";
import { MissionPanel } from "./MissionPanel";
import { STATUS_TONE, type Mission } from "./types";

/**
 * Positions a mission on the elliptical orbital plane using pure CSS — no
 * trigonometry at runtime, no viewport measurement, correct on first paint and
 * immune to resize.
 *
 * The projection is a plain translate: `sx`/`sy` are sin/-cos of theta baked at
 * module load, scaled by the mission's own `ring` so nodes ride different
 * orbits, with the vertical component additionally squashed by `--orbit-tilt`.
 * No rotation is involved anywhere, which is why nodes stay upright by
 * construction rather than by counter-transform.
 *
 * Coordinates are measured from the CENTRE of the plane. <PlaneSurface> has
 * already lifted this whole subtree off the ship's origin, so nothing here
 * needs to know where the vehicle is parked.
 *
 * LAYOUT: this <li> is a ZERO-SIZE point sitting exactly on its orbit. The
 * footprint pad marks that point; the panel is held out and up from it on a
 * leader. Anchoring the point rather than centring the whole assembly is what
 * lets the panel float above the plane while its footprint stays mathematically
 * on the ring.
 *
 * HOVER IS A SEQUENCE, NOT A STATE CHANGE. The delays below are the difference
 * between "six properties changed" and "a mechanism engaged": the marker reacts
 * instantly, the leader lights a beat later, the housing lifts after that, and
 * the glow arrives last. Delays are applied ONLY on the hover side — releasing
 * snaps everything back together, because a staggered retreat reads as lag
 * rather than as choreography.
 */

/** Staged engage delays, in ms. Release is always immediate. */
const STAGE = { marker: 0, leader: 40, lift: 90, glow: 140 } as const;

export function MissionNode({
  mission,
  index,
  isActive,
}: {
  mission: Mission;
  index: number;
  isActive: boolean;
}) {
  const dispatch = useAppDispatch();
  const { placement } = mission;
  const { side } = placement;
  const isLeft = side === "left";
  const isCentred = side === "center";
  const tone = STATUS_TONE[mission.status];

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

  // Closer missions stand notably larger. Combined with the opacity ramp this
  // is atmospheric perspective: distance costs both size and contrast. The
  // spread is wider than it looks — depth only spans about 0.15 to 0.55 now
  // that the ship occupies the near station, so a shallow coefficient would
  // flatten the ring into a sticker sheet.
  const depthScale = 0.78 + placement.depth * 0.5;

  // A centred callout has no side to hang from, so its leader is vertical only.
  const run = isCentred ? "0px" : "var(--callout-run)";
  const anchorEdge = isLeft ? "right" : "left";

  return (
    <li
      className={cn(
        "absolute top-0 left-0 h-0 w-0 transition-opacity duration-500",
        "focus-within:z-[45] focus-within:opacity-100",
      )}
      style={
        {
          "--node-sx": placement.sx,
          "--node-sy": placement.sy,
          "--node-ring": placement.ring,
          zIndex: isActive ? 46 : placement.zIndex,
          // Continuous recession on top of the discrete level-of-detail steps.
          // Without it, depth reads as abrupt tiers instead of a field falling
          // away.
          opacity: isActive ? 1 : 0.52 + placement.depth * 0.48,
          transform:
            "translate(" +
            "calc(var(--orbit-radius) * var(--node-ring) * var(--node-sx)), " +
            "calc(var(--orbit-radius) * var(--orbit-tilt) * var(--node-ring) * var(--node-sy))" +
            ")",
        } as CSSProperties
      }
    >
      {/* `group` on the point so the pad, leader and housing all respond to one
          hover together. Coordinating them is what makes the interaction feel
          like a single mechanism engaging rather than four transitions firing
          at once. */}
      <button
        type="button"
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onFocus={() => dispatch({ type: "target/focus", id: mission.id })}
        onBlur={() => dispatch({ type: "target/focus", id: null })}
        onClick={() => dispatch({ type: "target/lock", id: mission.id })}
        aria-current={isActive ? "true" : undefined}
        aria-describedby={`${mission.id}-summary`}
        className="group absolute top-0 left-0 cursor-pointer outline-none"
      >
        {/* Footprint on the plane. Squashed by the same tilt as the ring, so it
            reads as a shadow cast onto the surface rather than a dot floating
            in front of it. */}
        <span
          aria-hidden="true"
          className="absolute top-0 left-0 h-2 w-6 -translate-x-1/2 -translate-y-1/2 rounded-[50%] transition-all duration-300"
          style={{
            background: isActive
              ? "radial-gradient(closest-side, rgb(255 59 48 / 0.45), transparent)"
              : "radial-gradient(closest-side, rgb(0 0 0 / 0.85), transparent)",
          }}
        />

        {/* Marker on the plane. First thing to react — no delay. */}
        <span
          aria-hidden="true"
          className={cn(
            "absolute top-0 left-0 h-[5px] w-[5px] -translate-x-1/2 -translate-y-1/2 rotate-45 transition-all duration-300",
            isActive ? "bg-signal scale-125" : "bg-t3 group-hover:bg-t1 group-hover:scale-110",
          )}
          style={{ transitionDelay: `${STAGE.marker}ms` }}
        />
        {/* Lock reticle. */}
        <span
          aria-hidden="true"
          className={cn(
            "border-signal absolute top-0 left-0 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45 border transition-all duration-300",
            isActive ? "scale-100 opacity-70" : "scale-50 opacity-0",
          )}
        />

        <DockingLeader
          isActive={isActive}
          isCentred={isCentred}
          run={run}
          anchorEdge={anchorEdge}
        />

        {/* Housing, in two nested elements ON PURPOSE: the outer carries the
            static depth scale and the inner carries the hover lift. Putting
            both on one element would mean the inline `transform` and the
            utility class fight over the same property, and the lift would be
            silently dropped. Hinged at the bottom so the housing stays attached
            to the top of its leader. */}
        <span
          className="absolute"
          style={{
            bottom: "var(--callout-rise)",
            [anchorEdge]: run,
            transform: `scale(${depthScale})`,
            transformOrigin: isCentred ? "center bottom" : isLeft ? "right bottom" : "left bottom",
            // A centred housing straddles its leader instead of hanging off it.
            ...(isCentred ? { translate: "-50% 0" } : {}),
          }}
        >
          {/* Arrival fade lives on its own element, animating ONLY opacity.
              The <li> already uses opacity for the depth ramp and the sibling
              span already uses transform for the hover lift — sharing either
              property would silently clobber one of them. */}
          <motion.span
            className="block"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: 0.6,
              delay: ARRIVAL.missions + index * ARRIVAL.missionStep,
              ease: "easeOut",
            }}
          >
            <span
              className={cn(
                "block origin-bottom transition-transform duration-300 ease-out",
                "group-hover:-translate-y-1 group-focus-visible:-translate-y-1",
              )}
              style={{ transitionDelay: `${STAGE.lift}ms` }}
            >
              <MissionPanel
                mission={mission}
                lod={placement.lod}
                isActive={isActive}
                glowDelay={STAGE.glow}
              />
            </span>
          </motion.span>
        </span>

        {/* Always in the accessibility tree, regardless of visual level of
            detail — depth reduces prominence, never information. */}
        <span id={`${mission.id}-summary`} className="sr-only">
          {`${mission.title}. ${mission.summary}. Status ${mission.status.replace("_", " ")}.`}
        </span>
      </button>

      {/* Status pip on the plane, outside the housing, so a mission's stage is
          readable even at marker level. */}
      <span
        aria-hidden="true"
        className={cn(
          "absolute top-0 left-0 h-1 w-1 -translate-y-1/2 transition-opacity duration-300",
          tone.dot,
          isCentred
            ? "translate-x-2 -translate-y-[calc(100%+6px)]"
            : isLeft
              ? "-translate-x-[calc(100%+8px)]"
              : "translate-x-2",
        )}
      />
    </li>
  );
}

/**
 * The leader, drawn as a docking mechanism rather than a line.
 *
 * A single hairline says "these two things are associated". A collar, a doubled
 * strut with a cross-tie, and a bracket at the far end say "this housing is
 * physically mounted to that point on the orbit" — which is the read the deck
 * wants, because it makes the panel belong to the orbital system instead of
 * floating near it. The whole assembly is hairlines and 3px squares; at a
 * glance it registers as engineering, not as ornament.
 *
 * Every piece is decorative and hidden from assistive technology: the mission
 * button already carries the accessible name and description.
 */
function DockingLeader({
  isActive,
  isCentred,
  run,
  anchorEdge,
}: {
  isActive: boolean;
  isCentred: boolean;
  /** Horizontal reach as a CSS length; "0px" for a centred callout. */
  run: string;
  /** Which edge of the assembly the housing hangs from. */
  anchorEdge: "left" | "right";
}) {
  const line = isActive ? "bg-signal/70" : "bg-white/20 group-hover:bg-white/35";
  const stage = { transitionDelay: `${STAGE.leader}ms` } as CSSProperties;

  return (
    <>
      {/* Collar at the orbit end: the fitting the strut bolts into. */}
      <span
        aria-hidden="true"
        className={cn(
          "absolute top-0 left-0 h-[3px] w-[3px] -translate-x-1/2 -translate-y-1/2 rotate-45 transition-colors duration-300",
          isActive ? "bg-signal" : "bg-white/35 group-hover:bg-white/60",
        )}
        style={stage}
      />

      {/* Horizontal run. Absent on a centred callout, which mounts straight up. */}
      {!isCentred && (
        <span
          aria-hidden="true"
          className={cn("absolute top-0 h-px transition-colors duration-300", line)}
          style={{ ...stage, width: "var(--callout-run)", [anchorEdge === "left" ? "left" : "right"]: 0 }}
        />
      )}

      {/* Twin struts, one px apart, spanning the standoff. Two parallel lines
          read as a structural member; one reads as a pointer. */}
      {[0, 3].map((offset) => (
        <span
          key={offset}
          aria-hidden="true"
          className={cn(
            "absolute w-px transition-all duration-300 ease-out",
            "h-[var(--callout-rise)] group-hover:h-[calc(var(--callout-rise)+4px)]",
            line,
            // The outer strut is the lighter one, so the pair reads as a member
            // with a lit edge rather than as a double line.
            offset !== 0 && "opacity-45",
          )}
          style={
            {
              ...stage,
              bottom: 0,
              [anchorEdge]: isCentred ? `${offset}px` : `calc(${run} + ${offset}px)`,
            } as CSSProperties
          }
        />
      ))}

      {/* Cross-tie at mid-height, bracing the two struts. */}
      <span
        aria-hidden="true"
        className={cn("absolute h-px w-1 transition-colors duration-300", line, "opacity-70")}
        style={
          {
            ...stage,
            bottom: "calc(var(--callout-rise) * 0.42)",
            [anchorEdge]: isCentred ? "0px" : run,
          } as CSSProperties
        }
      />

      {/* Bracket where the strut meets the housing: a short flange turning back
          under the panel, so the join reads as a clamp rather than a butt. */}
      <span
        aria-hidden="true"
        className={cn("absolute h-px w-[7px] transition-colors duration-300", line)}
        style={
          {
            ...stage,
            bottom: "var(--callout-rise)",
            [anchorEdge]: isCentred ? "-3px" : `calc(${run} - 1px)`,
          } as CSSProperties
        }
      />
    </>
  );
}
