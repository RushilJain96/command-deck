"use client";

import { motion } from "framer-motion";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import { useAppDispatch } from "@/features/app/hooks";
import { ARRIVAL } from "@/features/scenes/arrival";
import { cn } from "@/lib/cn";
import { ACTIVATION, MissionPanel } from "./MissionPanel";
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
 * HOVER IS A SEQUENCE, NOT A STATE CHANGE. The module and the hardware it hangs
 * from stage against one shared table — see ACTIVATION in <MissionPanel> — so
 * the mount and the housing can never drift out of step. The marker and the
 * leader are STRUCTURE and answer on the first frame; everything inside the
 * housing follows.
 *
 * NOTHING TRANSLATES ANY MORE. The housing used to rise 4px and the leader's
 * struts used to grow 4px to keep up with it. That was well-built and still
 * wrong: a module bolted to a mast does not climb its mast when you point at it,
 * and the movement was the first thing anyone noticed about the interaction —
 * which is the definition of an effect that is too strong. What acknowledges the
 * pointer now is the same parts returning more light, not moving.
 */

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

        {/* WAYPOINT MARKER — where this mission meets its orbit.
            Structure stage, so it answers on the first frame.

            The 10% hover scale is gone: on a 6px diamond it bought half a pixel
            of growth and cost the module its only claim to not being a hover
            card. Brightness alone says "acknowledged"; selection still owns the
            scale step, which is now the only size change anywhere in the node.

            LIT CYAN AT REST, NOT GREY. It used to be `bg-t3` — an instrument
            label colour on a plate that is not a label. The marker is the one
            place a mission touches the orbital plane, and the plane is lit; a
            waypoint that does not carry the field's own light reads as printed
            on the glass rather than sitting on the track.

            THE BLOOM IS THE PART THAT MATTERS AND IT IS DELIBERATELY MODEST.
            A 6px square with an 8px shadow at full strength is a 22px ball of
            light, and six of those turn a field that was just tuned for restraint
            back into a Christmas tree. At 0.55 and 6px it reads as a lit marker
            from a normal viewing distance and never as a lamp.

            Selection still takes it to `--signal` red, which is the one thing on
            the deck that means "you are pointing at this". Cyan is the resting
            state of everything the plane lights; red is a statement about the
            operator, and the two must not be the same colour. */}
        <span
          aria-hidden="true"
          className={cn(
            "absolute top-0 left-0 h-[6px] w-[6px] -translate-x-1/2 -translate-y-1/2 rotate-45 transition-all duration-200",
            isActive ? "bg-signal scale-125" : "bg-[rgb(120_226_255)] group-hover:bg-white",
          )}
          style={{
            transitionDelay: `${ACTIVATION.structure}ms`,
            boxShadow: isActive
              ? "0 0 9px rgb(255 59 48 / 0.7)"
              : "0 0 6px rgb(0 212 255 / 0.55)",
          }}
        />
        {/* Lock reticle. */}
        <span
          aria-hidden="true"
          className={cn(
            "border-signal absolute top-0 left-0 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45 border transition-all duration-300",
            isActive ? "scale-100 opacity-70" : "scale-50 opacity-0",
          )}
        />

        {/* Housing.
            THE DOCKING LEADER IS GONE. The collar, twin struts, cross-tie and
            bracket that hung each callout off its point on the orbit have been
            removed: with the field rebuilt as light rather than as drawn rings,
            a hairline armature tying a card down to it was the last thing on the
            deck that read as a diagram. The callouts now simply float above the
            plane.

            THE OFFSET STAYS. `--callout-run` / `--callout-rise` still hold each
            housing clear of its own anchor, which is what the layout solver in
            `scripts/deck-layout-check.mjs` models to prove six callouts, the HUD
            rail and the hull can coexist. Removing the connector is a visual
            change; removing the offset would be a layout change. */}
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
              The <li> already uses opacity for the depth ramp and the parent
              span uses transform for the depth scale — sharing either property
              would silently clobber one of them. */}
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
            <MissionPanel mission={mission} lod={placement.lod} isActive={isActive} />
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
