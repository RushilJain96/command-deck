"use client";

import { motion } from "framer-motion";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import { useAppDispatch } from "@/features/app/hooks";
import { ARRIVAL } from "@/features/scenes/arrival";
import { cn } from "@/lib/cn";
import { MissionPanel } from "./MissionPanel";
import { CALLOUT_TIER, type Mission } from "./types";

/**
 * Sits between the hero band (50) and SHIP_Z_INDEX (60), so a targeted module
 * covers every other card and the hull still covers it.
 */
const ACTIVE_Z = 55;

/**
 * How far the flanking cards rotate inward, and how close the eye sits.
 *
 * THE ANGLE WAS NEVER THE PROBLEM — THE EYE DISTANCE WAS. The old pair was 12deg
 * at `perspective(1200px)`, and the note here claimed the far edge foreshortened
 * to about 96% of the near one, which "reads clearly as a turn". Probing the
 * rendered corners says 162.5px against 169.2px — a 4% difference, which is not
 * a turn anyone can see. The cards were correctly rotated and visually flat.
 *
 * The reason is the perspective divide. For a card of half-width `a` rotated by
 * theta at eye distance `d`, the near and far edges scale by
 * `1 / (1 -/+ a*sin(theta)/d)`, so the visible ratio is governed by
 * `a*sin(theta)/d`. At a=118, 12deg and d=1200 that term is 0.020 — the card is
 * so small against the eye distance that the projection is very nearly
 * orthographic, and an orthographic rotation of a flat rectangle is almost
 * invisible.
 *
 * SO THE FIX IS MOSTLY `d`, NOT `theta`. Bringing the eye in to 460px takes the
 * term to 0.079 and the edge ratio to about 1.17 — a 17% difference, which reads
 * unmistakably as a panel angled toward the middle of the deck.
 *
 * The angle still goes up, but only to 18, because the old note's OTHER claim is
 * sound: past roughly 18deg the sub-pixel sampling on the receding half starts to
 * show on the summary line and the card reads blurry rather than angled. Taking
 * the visible turn out of the eye distance instead of the rotation is what keeps
 * the type crisp while making the tilt obvious.
 */
const TILT_DEG = 18;

/**
 * Eye distance for the card's own perspective divide, in CSS pixels.
 *
 * PER-ELEMENT, and that is load-bearing — see the note at the transform. A shared
 * `perspective` on the plane would give every card a different vanishing point
 * depending on where it sits, so the two flanks would tilt by visibly different
 * amounts.
 */
const TILT_PERSPECTIVE = 460;

/**
 * How far the CENTRE-BAND cards pitch, in degrees.
 *
 * ORION and DATAFLOW sit on the deck's centre line with the spacecraft directly
 * below them, so a yaw does nothing for them — turning a card left or right when
 * the thing it should face is straight down is a rotation about the wrong axis.
 * What points their faces at the nose is a PITCH: the top edge goes back, the
 * bottom edge comes forward.
 *
 * NEGATIVE: top edge forward, bottom edge away. The card leans over the deck
 * toward the viewer rather than lying back from it.
 *
 * THE SIGN WAS POSITIVE FOR ONE PASS AND IT LOOKED WRONG. The argument for it was
 * that the ship sits below, so a card facing it should turn its face downward —
 * top away, bottom forward, the laptop-lid direction. The edge probe confirmed
 * the geometry did exactly that. What it produced on screen was a card lying back
 * like a lectern, which reads as leaning AWAY from the deck rather than toward it,
 * and that is the read that matters.
 *
 * The geometric argument had a gap: the spacecraft is not only below these cards,
 * it is also nearer the camera, sitting at a standoff in front of the plane the
 * cards float above. A panel angled to present itself over that vehicle tips its
 * top toward the viewer, not away.
 *
 * MEASURED EITHER WAY. On a pitched card the nearer edge is the WIDER one; at
 * -12deg the TOP edge measures wider than the bottom. Use `runprobe.mjs` in the
 * scratchpad rather than reasoning about the sign — this axis and the yaw on the
 * flanks have both now been got backwards by argument alone.
 *
 * 12 rather than the flanks' 18. A pitch reads more strongly than a yaw at equal
 * angle, because the perspective term scales with whichever half-dimension is
 * rotating away and a card is wider than it is tall.
 */
const PITCH_DEG = -12;

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

  // A targeted module lifts ABOVE the hero band rather than into it, so it clears
  // whatever might be in front of it if a resize ever brings two cards together.
  const zIndex = isActive ? ACTIVE_Z : CALLOUT_TIER[mission.tier].z;

  // Inward tilt, driven by which flank the card sits on. `side` already carries
  // that — it is derived from the sign of `x` against CENTRE_BAND — so the tilt
  // needs no new field on the roster and cannot disagree with the position.
  //
  // POSITIVE ON THE LEFT. The console is CONCAVE toward the viewer, so a flank
  // card's OUTER edge is the nearer one.
  //
  // THIS WAS FLIPPED TO NEGATIVE FOR ONE PASS AND THAT WAS WRONG. The reasoning
  // that flipped it was: "the inner edge should come forward, because the card
  // faces the ship." Work it as a door instead. A door facing you head-on, and
  // you want its face to point to your right: you pull the LEFT edge toward you
  // and swing the right edge away. So a left-hand card whose face turns toward
  // the centre of the deck has its left — outer — edge nearer. Inner-edge-forward
  // is a CONVEX arc, a cylinder seen from outside, which points every card's face
  // away from the middle.
  //
  // The corner probe that "confirmed" the flip measured correctly and was asked
  // the wrong question: it reported which edge was nearer, and the flip assumed
  // without checking that nearer-inner meant facing-centre. The symptom that
  // prompted it — the tilt being invisible — was a magnitude problem in
  // TILT_PERSPECTIVE, not a direction problem here.
  const tiltDeg = placement.side === "left" ? TILT_DEG : placement.side === "right" ? -TILT_DEG : 0;

  // Centre-band cards pitch instead of yawing — see PITCH_DEG. The two are
  // mutually exclusive by construction: `side` is "center" exactly when |x| is
  // inside CENTRE_BAND, which is the case where a yaw has nothing to aim at.
  const pitchDeg = placement.side === "center" ? PITCH_DEG : 0;

  return (
    <li
      className={cn(
        "absolute top-0 left-0 h-0 w-0 transition-opacity duration-500",
        "focus-within:z-[45] focus-within:opacity-100",
      )}
      style={
        {
          "--node-x": placement.x,
          "--node-y": placement.y,
          // Authored. `placement.zIndex` is still computed and still correct as a
          // depth ordering — it is simply not what sorts these any more, because
          // overlap is now the ONLY depth cue the cards carry and it has to be
          // deliberate rather than derived.
          zIndex,
          // Atmospheric recession, AND IT IS NOW ALMOST FLAT ON PURPOSE.
          //
          // This was `0.52 + depth * 0.48`, a range of 0.52 to 1.0. Against the
          // old scale ramp it was defensible; as the last remaining depth cue it
          // was not, because the two compounded on exactly the wrong module.
          // DATAFLOW sits furthest out at depth 0.106, so it was drawn at 0.57
          // opacity AND 0.65 scale — a small faint card that had effectively
          // left the composition.
          //
          // Every module has to be legible, because the operator is choosing
          // between them and cannot choose what they cannot read. 0.88 to 1.0 is
          // enough to feel as air between the near rank and the far one, and not
          // enough to cost anybody a word.
          opacity: isActive ? 1 : 0.88 + placement.depth * 0.12,
          // Straight from the authored position, and NO LONGER MULTIPLIED BY THE
          // TILT. The vertical term used to carry `--orbit-tilt` so the card
          // arrangement squashed along with the plane. That was defensible while
          // the cards were projected ONTO the plane; it is wrong now that they
          // float above it, and it bit immediately — flattening the plane from
          // 0.64 to 0.46 to make it read as a floor would have compressed the
          // card layout by 28% as a side effect, for no reason anyone could name.
          //
          // The cards keep their own vertical rhythm in plain --orbit-radius
          // units. The floor can be re-pitched underneath them without touching
          // the composition standing on top of it.
          // A PLAIN TRANSLATE. The card-arrangement gains are NOT applied here;
          // they are folded into the stored offset by `gainedStation` in
          // placement.ts, so --node-x and --node-y already name the drawn
          // position. Applying them at paint time instead left `derivePlacement`
          // — and therefore the bearing beam — reasoning about a different
          // position from the one on screen. See that function's note.
          transform:
            "translate(" +
            "calc(var(--orbit-radius) * var(--node-x)), " +
            "calc(var(--orbit-radius) * var(--node-y))" +
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
        {/* NOTHING IS DRAWN ON THE PLANE ANY MORE.

            A footprint shadow, a lit cyan waypoint diamond, a lock reticle and a
            1px tether all used to live here — the apparatus for saying "this card
            belongs to that point on the orbit". All four are gone together,
            because the premise they served is gone: the cards are a composed
            arrangement floating above the plane, and no mission occupies a
            particular point on the ring.

            They had to go as a set. Keeping the dot without the tether leaves an
            orphan that lights up red when you hover a card somewhere else
            entirely, which reads as a bug rather than as restraint.

            What still points at a mission is the spacecraft: the hull swings to
            the card's own bearing and the bearing vector runs out toward it. That
            is one relationship, drawn once, by the object whose job it is. */}

        {/* Housing, CENTRED ON THE AUTHORED POSITION.
            `--callout-rise` is gone with the tether: there is no anchor beneath
            the card to stand clear of, so `x`/`y` name the card's own centre and
            the box is simply centred on it. That also makes the roster read the
            way it looks — `x: -1.02` is where the card IS, not where something
            underneath it is.

            Growth is about the CENTRE now rather than the bottom edge, so a
            module promoted to the active size expands evenly instead of rising.
            The layout solver models the same box; change the size there too. */}
        {/* WRAPAROUND TILT. The flanks rotate inward so the six cards read as a
            curved console facing the operator rather than as flat sheets pinned
            to the glass.

            `translate` AND `transform` ARE SEPARATE PROPERTIES HERE, ON PURPOSE.
            CSS applies the individual `translate`/`rotate`/`scale` properties
            BEFORE `transform`, so the -50%/-50% centring lands first and the
            rotation then happens about the card's own middle. Folding the
            centring into the transform string would rotate the card about the
            node's anchor point instead and swing it out of its own quadrant.

            THE PERSPECTIVE IS PER-ELEMENT, not on an ancestor. A shared
            `perspective` on the plane would give every card a different vanishing
            point depending on where it sits, so the two flanks would tilt by
            visibly different amounts. `perspective()` inside each card's own
            transform gives all of them the same eye distance — see
            TILT_PERSPECTIVE, which is what actually controls how much turn is
            visible.

            NO `transform: scale()` and NO `translateY()` EITHER. This is
            rotation only. A selection scale rode here briefly and is withdrawn —
            see CALLOUT_TIER. The 20px elevation that used to live here moved
            into `CARD_Y_LIFT`, because a translate applied at paint time is a
            position `derivePlacement` cannot see — and it was mis-aiming the
            bearing beam by exactly that 20px. See that constant's note.

            Sign convention: a card on the LEFT turns its right edge away from the
            viewer, which is a POSITIVE rotateY. The right flank mirrors it. */}
        <span
          className="absolute top-0 left-0"
          style={{
            translate: "-50% -50%",
            transform: `perspective(${TILT_PERSPECTIVE}px) rotateY(${tiltDeg}deg) rotateX(${pitchDeg}deg)`,
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
      {/* The status pip that used to sit out here on the plane is gone with the
          rest of the plane-side apparatus. It existed so a mission's lifecycle
          was readable when the card shrank to a bare marker; there is no marker
          tier any more, and every card carries its own status strip. */}
    </li>
  );
}
