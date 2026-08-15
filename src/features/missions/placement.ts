import { angleTo } from "@/lib/math/angle";

/**
 * Vertical squash of the orbital plane. This is the entire 2.5D effect: the
 * ring is an ellipse, not a CSS 3D scene.
 *
 * IT IS ALSO THE CAMERA'S ELEVATION. Under an orthographic projection a
 * horizontal circle seen from elevation phi projects to an ellipse whose minor
 * axis is sin(phi) of its major, so this number IS sin(phi) — 0.64 puts the
 * camera 39.8deg above the plane.
 *
 * IT DOES NOT INVALIDATE THE SHIP FRAMES, AND THE NOTE HERE THAT SAID SO WAS
 * WRONG. It claimed `scripts/render-ship-frames.py` derives its camera elevation
 * from this constant. It does not — the renderer reads SHIP_CAMERA_TILT (0.6871,
 * 43.4deg), which is DELIBERATELY decoupled, and so do <ShipSprite> and
 * `plumeScreenAngle`. The app has always absorbed a disagreement between the two
 * elevations; the stale warning simply froze this value for no reason.
 *
 * WHAT IT DOES COST IS THAT DISAGREEMENT. The hull is rendered from 43.4deg and
 * the plane is drawn at asin(this). The gap was 3.6deg; at 0.46 it is 16deg,
 * which is the real price of flattening the floor without a Blender re-render.
 * It is payable because the hull is a foreground object seen against the plane
 * rather than lying in it — what reads is the FLOOR receding, and the ship is
 * simply a vehicle above it. If the gap ever needs closing, re-render at a lower
 * `--elevation` rather than raising this back.
 *
 * 0.64 -> 0.46 IS THE WHOLE "MAKE IT A FLOOR" CHANGE. sin(phi) is the ellipse
 * squash, so this is the camera's height above the plane: 0.64 put it 39.8deg
 * up, looking down INTO a disc, and 0.46 puts it at 27.4deg, looking ACROSS a
 * surface that recedes. Nothing else produces that read — perspective sharpens
 * it and the bias positions it, but the elevation is what decides whether you
 * are above the plane or on it.
 *
 * It also sets how TALL the field is: the ring system spans 2 * R * tilt
 * vertically, so flattening buys back a third of the frame height that the
 * ellipse used to occupy — which is what leaves room for the cards to sit
 * clearly ABOVE it.
 *
 * SINGLE SOURCE OF TRUTH. CSS receives this as an inline `--orbit-tilt` on
 * <OrbitPlane>; never write the literal into a stylesheet. If the two drift,
 * the ship mis-aims by a degree or two and nothing will ever point at the cause.
 *
 * MUST NOT become responsive. `screenAngle` below is viewport-independent only
 * because the radius cancels out of `atan2`. A tilt that varied by breakpoint
 * would force JS viewport measurement for the ship's aim, which is banned.
 */
export const ORBIT_TILT = 0.46;

/**
 * How far the spacecraft's station sits BELOW the centre of the orbital plane,
 * in units of `--orbit-radius * --orbit-tilt`.
 *
 * THIS IS THE WHOLE CAMERA CONCEIT. The deck is not viewed from directly above
 * its centre — it is viewed from close behind and below the vehicle, looking
 * forward into the plane. Every mission lies ahead of the ship, which is why the
 * hull only ever swings through a narrow forward arc instead of spinning a full
 * 360. A ship that can point backwards at something has no "forward", and
 * without a forward there is no sense of flying anything.
 *
 * GREATER THAN 1.0 ON PURPOSE. The entire mission field lies ahead and above,
 * so the vehicle reads as looking into the system rather than standing in the
 * middle of it.
 *
 * BUT ONLY JUST GREATER. At 1.45 the hull sat half an orbit beyond the
 * outermost ring, which put the whole ellipse — every arc, every graduation —
 * strictly ABOVE the ship: near arc at y=532 against a hull starting at y=569
 * on a 1600x900 deck. Nothing ever crossed the vehicle, and a ship that never
 * intersects its own orbital plane reads as parked underneath a diagram rather
 * than operating inside a system. At 1.20 the near arc passes BEHIND the upper
 * fifth of the hull (the ship holds z-index 50, the guides none), so the
 * outermost ring is interrupted by the vehicle and the plane visibly continues
 * past it on both sides. That occlusion is the whole reason for the value.
 *
 * The structural outer rings in <OrbitGuides> extend to 2.16, still well past
 * this, so an arc keeps sweeping around and below the hull.
 *
 * HARD FLOOR IS 0.851, AND IT MOVED WHEN PERSPECTIVE LANDED. It used to be
 * 0.766 — `max(ring * -cos theta)` over the roster, which is AURORA. That is
 * now the UNPROJECTED reach; what matters is AURORA's reach after the plane
 * divide, `0.766 / (1 - 0.13*0.766)` = 0.851. At or below it that mission sits
 * level with or behind the ship and the hull has to aim sideways or backwards;
 * a ship that can point backwards has no forward, and the whole conceit
 * collapses. Recompute this whenever ORBIT_PERSPECTIVE changes.
 *
 * 1.05 KEEPS A 0.20 MARGIN, DOWN FROM 0.43 AT 1.20. It came down to drop the
 * plane's centre roughly 60px further down the frame at 1080p — the field was
 * sitting high enough that the composition read as looking AT the plane rather
 * than across it. Because the plane's screen position depends on
 * `DECK_BIAS - SHIP_STANDOFF_SCREEN`, lowering the standoff alone moves the
 * plane down and leaves the ship where it is, which is exactly the wanted move.
 *
 * The margin is now thin enough to matter: move any mission onto ring 1.0 near
 * theta 180, or raise ORBIT_PERSPECTIVE, and re-check this before anything else.
 *
 * COST OF LOWERING IT: bearings widen. The nearer the ship sits to the field,
 * the larger the angle subtended by the same node, so the hull swings through a
 * wider arc. Max screen bearing goes 55.9deg at 1.45 to 66.6deg at 1.20, paid
 * almost entirely by AURORA and FORGE on the flanks. The RENDERED hull is
 * unaffected — `renderYaw` saturates at SHIP_YAW_LIMIT either way — so what
 * actually widens is the gap between where the bearing vector points and where
 * the nose points. That decoupling is already sanctioned in `shipFrames.ts`;
 * this makes it about 10deg wider at the extremes.
 *
 * MOVE IT WITH DECK_BIAS. Dropping both by the same amount holds the plane
 * still on screen and raises only the ship — see the note below.
 */
export const SHIP_STANDOFF = 0.85;

/**
 * PERSPECTIVE. THE PLANE IS A FLOOR BELOW THE CAMERA, NOT A DISC ON THE GLASS.
 *
 * This deck was orthographic: every plane point was `(u sin t, u cos t * TILT)`,
 * a circle with its vertical axis scaled. That is a real projection — it is what
 * you get from a camera infinitely far away — and it has one property that gave
 * the whole composition away. Under a pure squash the ring spacing ABOVE the
 * centre and BELOW it are identical by construction: the top of a ring sits at
 * `cy - r*TILT` and the bottom at `cy + r*TILT`, so concentric rings step by the
 * same amount in both directions. A real floor does not do that. Its far rings
 * bunch toward the horizon and its near rings spread toward your feet, and that
 * asymmetry is most of what tells you a surface is receding rather than facing
 * you. Without it the field read as concentric circles pinned to the middle of
 * the screen, however well it was lit.
 *
 * THE WHOLE FIX IS ONE DIVIDE. For a plane point at ring radius `u` (in units of
 * --orbit-radius) and angle `t`, take the orthographic coordinates and divide
 * both by `1 + P*u*cos(t)`. That is the perspective divide of a pinhole camera
 * whose distance to the plane's centre is `1/P` in the same units — near points
 * (cos t = -1) get a divisor below 1 and spread outward, far points (cos t = +1)
 * get one above 1 and compress. Nothing else about the model changes: angles are
 * still degrees clockwise from screen-up, depth is still carried by z-index and
 * parallax, and the tilt still sets the overall squash.
 *
 * 0.20 IS A COMPOSITION CHOICE, NOT A MEASUREMENT. It is the camera distance
 * that makes the outermost ring's near arc sweep below the hull and off the
 * bottom of the frame while its far arc stays inside the top. Raising it
 * strengthens the recession and eventually pushes the near arc off-screen;
 * lowering it walks back toward the orthographic look. The hard ceiling is
 * `1 / FIELD.outerRing` (~0.645), where the near arc's divisor reaches zero and
 * the projection blows up.
 *
 * THE SPRITE FRAMES ARE UNAFFECTED. They are rendered orthographically at
 * SHIP_CAMERA_TILT and that is still correct — the hull is a small object close
 * to the camera, where perspective distortion within the object is negligible.
 * This projection applies to the PLANE, which spans many times the hull's size.
 */
export const ORBIT_PERSPECTIVE = 0.28;

/**
 * The perspective divisor at a point on the plane. `cosTheta` is `cos` of the
 * angle measured clockwise from screen-up, so +1 is the FAR side of the ring and
 * -1 the near side — the same convention as `lightAt` in `orbit.data.ts`.
 *
 * Every projection of the plane must go through this: the field canvas, the
 * mission nodes, the bodies riding the rings, and the layout solver's mirror of
 * all three. A consumer that skips it draws on a different surface than the rest
 * of the deck, and the symptom is a mission node sitting just off its own orbit.
 */
export function planeDivisor(ring: number, cosTheta: number): number {
  return 1 + ORBIT_PERSPECTIVE * ring * cosTheta;
}

/**
 * The ship's standoff AS DRAWN, after the perspective divide.
 *
 * SHIP_STANDOFF is a world quantity: the vehicle sits `1.20` out from the
 * plane's centre on the near side. Its screen offset is that number put through
 * the same projection at `cos t = -1`, which is a larger number — 1.50 at
 * P = 0.20. Using the world value directly for the screen offset would put the
 * hull where the plane's u = 1.20 arc USED to be and leave the arc itself well
 * below it, which reads as the ship floating above a floor it is supposed to be
 * flying over.
 *
 * This is what <OrbitPlane> publishes as `--ship-standoff`, and it is why that
 * variable is TypeScript-owned rather than a literal in the stylesheet.
 */
export const SHIP_STANDOFF_SCREEN = SHIP_STANDOFF / planeDivisor(SHIP_STANDOFF, -1);

/**
 * How far the whole world is pushed DOWN the viewport, in the same units.
 *
 * The camera looks ahead of the vehicle, not at it: parking the ship dead centre
 * would waste the top half of the frame and leave the plane cramped. Published
 * to CSS as `--deck-bias` and applied to the world-origin anchor, so it scales
 * with the deck instead of drifting on resize.
 *
 * TIED TO THE HULL'S SIZE. This came down from 1.0, then to 0.55, as the ship
 * grew: the hull is anchored at its centre, so it expands toward the dock in
 * both directions.
 *
 * MOVE IT WITH SHIP_STANDOFF, NOT ALONE. Lowering this raises the ship AND the
 * whole plane with it, because the plane is positioned relative to the vehicle —
 * which put the topmost mission under the top bar at four viewport sizes. To
 * raise the ship against a STATIONARY plane, drop this and SHIP_STANDOFF by the
 * same amount; the two shifts cancel for the plane and compose for the ship.
 *
 * THAT IS EXACTLY WHAT THE 1.45/0.80 -> 1.20/0.55 PAIR DID. Screen position is
 * `H/2 + R*TILT*DECK_BIAS` for the ship and `H/2 + R*TILT*(DECK_BIAS -
 * SHIP_STANDOFF)` for the plane, so the plane depends only on the DIFFERENCE.
 * Holding it at -0.65 left all six missions on the exact pixel they occupied
 * before and lifted the ship 0.25*R*TILT (59px at 1600x900) into the ring.
 *
 * 0.55 -> 0.93 IS THE SAME MOVE RUN BACKWARDS, FOR PERSPECTIVE. The ship's
 * standoff AS DRAWN is now SHIP_STANDOFF_SCREEN (1.50 at P = 0.20, against a
 * world value of 1.20), and the plane tracks the drawn one. Left alone that
 * lifted the entire field 0.30*R*TILT up the viewport and put NEXUS, ECHO and
 * DATAFLOW through the top bar at eleven of the twenty-five checked viewports.
 * Raising the bias by the same 0.38 restores the difference to -0.65, which
 * holds every mission on the pixel it was already on and spends the whole
 * change on the ship instead — which is the correct place for it, because a
 * receding floor is supposed to put the viewer HIGHER above the plane.
 *
 * This is the property that makes the move safe: the callout collision set the
 * layout solver clears is a function of mission positions, and those did not
 * change. Only the ship-vs-callout pairs had to be re-checked.
 */
export const DECK_BIAS = 1.24;

/**
 * Depth cutoffs for level of detail. Distance reduces prominence, never
 * identity — even a marker carries its codename.
 *
 * THESE VALUES ARE LOAD-BEARING FOR LAYOUT, not just for legibility. Six
 * full-size callouts, a full-height HUD rail and a 196px spacecraft provably do
 * not fit in a 1536x1024 frame without overlapping — a headless solver that
 * enumerates panel-vs-panel, panel-vs-rail and panel-vs-ship collisions finds no
 * feasible orbit radius at all. The thresholds below are what make the
 * composition solvable: they resolve to one marker, two compact and three full
 * across the current roster, and hover promotes any of them to full.
 *
 * So if you widen a panel, re-space the missions, or add a seventh, expect to
 * retune these — and check the result rather than eyeballing it. Depth also no
 * longer spans the full 0-1 range: the ship holds the near station, so nothing
 * sits at depth 1.
 *
 * To collapse to two levels (compact/full), set `marker: 0`. No other code
 * changes: `resolveLod` simply stops returning "marker".
 */
/**
 * BOTH ARE ZERO, WHICH MEANS THERE IS ONE LEVEL AND EVERY MODULE IS DRAWN AT IT.
 *
 * The note above records why they were 0.2 / 0.34, and the layout argument it
 * makes was true: six full-size callouts, a full-height rail and the hull did
 * not fit, and stepping the far modules down to compact and marker is what made
 * the composition solvable.
 *
 * It stopped being the right trade when the callouts were centred and the size
 * bands were flattened. A depth-derived level of detail means the operator is
 * shown less about the missions that happen to sit further round the ring, and
 * "further round the ring" is not a statement about the work — it is an artefact
 * of where the composition put it. The marker tier in particular reduced a
 * mission to two lines of type, which is not a distant card, it is an absent
 * one.
 *
 * The layout budget that paid for it came from elsewhere instead: the column is
 * narrower (168px against 220px), the cards are centred rather than side-hung,
 * and the roster was re-spaced. `npm run check:layout` is what proves it, and it
 * models a uniform full-size box for every mission now.
 *
 * The machinery is deliberately left standing rather than deleted — `resolveLod`
 * and `clampLod` still work, and the responsive cap below deck-md still uses
 * them — so restoring a tier is a matter of putting a number back here.
 */
export const LOD_THRESHOLDS = { marker: 0, compact: 0 } as const;

export type MissionLod = "marker" | "compact" | "full";

/** Level-of-detail ranking, so a viewport cap can clamp the depth-derived LOD. */
const LOD_RANK: Record<MissionLod, number> = { marker: 0, compact: 1, full: 2 };

export function clampLod(lod: MissionLod, cap: MissionLod): MissionLod {
  return LOD_RANK[lod] <= LOD_RANK[cap] ? lod : cap;
}

/**
 * Horizontal offset below which a callout is centred over its anchor instead of
 * hung to one side, in units of `--orbit-radius`.
 *
 * A node almost directly ahead of the ship has no meaningful side: pushing its
 * panel left or right would break the straight sight line from the nose, which
 * is the single clearest statement the deck makes about what the ship is aiming
 * at. Centred callouts get a purely vertical leader.
 */
export const CENTRE_BAND = 0.12;

/** Which way a callout opens; "center" stacks it directly above the anchor. */
export type CalloutSide = "left" | "right" | "center";

export interface MissionPlacement {
  /** Authored x offset from the plane centre, in units of --orbit-radius. */
  readonly x: number;
  /** Authored y offset, BEFORE the tilt squash. Negative is up the screen. */
  readonly y: number;
  /** 0 = furthest, 1 = nearest. Derived from `y`: higher up reads as further. */
  readonly depth: number;
  readonly lod: MissionLod;
  /**
   * Apparent heading FROM THE SHIP to the projected position, degrees clockwise
   * from screen-up. This is what the hull must aim at — NOT theta.
   *
   * Two corrections are folded in here and both are invisible until they are
   * wrong. Squashing the circle moves a node's apparent direction; and the ship
   * sits a standoff below the plane centre, so even an unsquashed bearing taken
   * from the centre would be wrong by a wide margin for anything nearby. Feed
   * raw theta and the ship points at empty space.
   *
   * Still a true constant: --orbit-radius is a common factor of both components
   * and cancels inside `atan2`, so this survives any viewport without
   * measurement.
   */
  readonly screenAngle: number;
  /**
   * `radialAngle` USED TO BE HERE — the bearing from the plane's CENTRE to the
   * projected point, for orienting graduation ticks tangent to their ring. It is
   * removed rather than left computing: it was a property of a mission's polar
   * coordinate, missions no longer have one, and nothing outside this file ever
   * read it. The orbit guides draw their own ticks from their own geometry.
   */
  /**
   * Ship-to-node distance in units of --orbit-radius, for the bearing vector's
   * length and the target readout's RANGE row. Same cancellation as above.
   */
  readonly range: number;
  /** Depth ordering. Always below the ship — see the note in <MissionOrbit>. */
  readonly zIndex: number;
  readonly side: CalloutSide;
}

export function resolveLod(depth: number): MissionLod {
  if (depth < LOD_THRESHOLDS.marker) return "marker";
  if (depth < LOD_THRESHOLDS.compact) return "compact";
  return "full";
}

/**
 * Converts an apparent screen heading back into the ship's REAL yaw on the
 * orbital plane, in degrees clockwise from screen-up.
 *
 * These two numbers are not the same and the difference is large. The plane is
 * squashed vertically by `tilt`, so a heading that is only 50deg off the axis in
 * the world appears as 69deg on screen. Un-projecting means dividing the
 * vertical component back out.
 *
 * WHY THIS EXISTS AT ALL: a flat vector ship can be rotated on screen by
 * `screenAngle` and look right, because a stylised shape carries no information
 * about where its camera was. A pre-rendered hull does — the viewpoint is baked
 * into the pixels. Spin one of those 70deg on screen and it reads as a ship
 * lying on its side rather than a ship turning, because the silhouette never
 * changes and the tail never comes into view. So the sprite is INDEXED by this
 * yaw instead of rotated by the screen angle, and each frame is a render of the
 * hull actually turned that far.
 *
 * Quadrant-safe: goes through `atan2` on the un-projected direction vector
 * rather than `atan(tilt * tan S)`, which collapses at +/-90deg and silently
 * loses a half-turn.
 */
export function screenAngleToWorldYaw(screenAngle: number, tilt: number = ORBIT_TILT): number {
  const rad = (screenAngle * Math.PI) / 180;
  // Screen direction, then divide the squash back out of the vertical part.
  return angleTo({ x: 0, y: 0 }, { x: Math.sin(rad), y: -Math.cos(rad) * (1 / tilt) });
}

/**
 * The exact inverse: a real yaw on the plane, projected back to the heading it
 * APPEARS to have on screen.
 *
 * Same operation with the squash applied rather than divided out, so
 * `worldYawToScreenAngle(screenAngleToWorldYaw(a, t), t) === a` for every a in
 * (-180, 180].
 *
 * This exists for the exhaust. The hull is not drawn at the heading it aims at —
 * `renderYaw` compresses it — so anything that has to stay physically attached to
 * the hull (the plume, the engine wash on the floor) must be oriented by the
 * heading the ship is actually DRAWN at, which means going world -> screen. See
 * `plumeScreenAngle` in shipFrames.ts.
 */
export function worldYawToScreenAngle(worldYaw: number, tilt: number = ORBIT_TILT): number {
  const rad = (worldYaw * Math.PI) / 180;
  return angleTo({ x: 0, y: 0 }, { x: Math.sin(rad), y: -Math.cos(rad) * tilt });
}

/**
 * Z-band for the spacecraft.
 *
 * The ship now holds the NEAREST station on the plane, so it is unconditionally
 * the frontmost object in the world and nodes no longer interleave around it.
 * That is a simplification the old centred framing could not have: every node
 * sorts strictly below this value.
 *
 * 50 -> 60 WHEN THE CALLOUT TIERS LANDED. `CALLOUT_TIER.hero` is z-index 50, and
 * a targeted module is promoted to it — so at 50 the hero card and the hull were
 * tied, and a tie is resolved by DOM order, which put a mission callout in front
 * of the vehicle for exactly the missions that happen to render later. The band
 * moved rather than the tier's, because 50/40/30/20 is the authored scale and the
 * ship's number is an implementation detail. Any new tier must stay below this.
 */
export const SHIP_Z_INDEX = 60;

/* CALLOUT_STANDOFF is gone, along with `--callout-rise` in globals.css. It
 * described how far a card floated above its waypoint on the plane. Cards are
 * detached now — `x`/`y` in the roster name the card's own centre and there is
 * no waypoint beneath it — so there is no standoff left to describe. */

/**
 * How far BELOW a card's centre the spacecraft actually aims, in the same
 * pre-tilt `y` units as the roster.
 *
 * The target is the card's bottom-middle edge. That is where a sight line should
 * terminate on a panel you are meant to read — through the middle and it crosses
 * the title and the summary, which is the one place a targeting cue must not go.
 *
 * 0.31 IS A HALF-CARD AT THE COMMON RADIUS, AND IT IS AN APPROXIMATION. The
 * card is a fixed pixel height (145, or 167 at the active scale) while
 * --orbit-radius varies continuously, so the exact drop is
 * `83 / (R * tilt)` — 0.31 at R = 420, which is what a 1600x900 deck solves to.
 * It cannot be exact at every radius without measuring the viewport in JS, which
 * is banned, and the error is benign in both directions: at a larger radius the
 * beam stops a little short of the edge, at a smaller one a little inside it.
 * Never near the text either way, which is the property that matters.
 */
export const BEAM_TARGET_DROP = 0.176;

/**
 * Projects a POLAR station on the orbital plane into the screen offsets the
 * roster stores as `x`/`y`, in units of --orbit-radius.
 *
 * `theta` is degrees clockwise from screen-up, so it reads as a clock face: 0 is
 * twelve, 90 is three, 240 is eight. `ring` is the orbit, as a fraction of
 * --orbit-radius.
 *
 * WHY THIS EXISTS RATHER THAN HAND-AUTHORED x/y. The cards were briefly placed
 * by typing screen offsets directly, which was the right move at the time — it
 * broke the orbit's grip on how big they could be. But it also meant the
 * arrangement was a list of six coordinates with no shape to them, and asking
 * for "eight o'clock, mid ring" had to be solved backwards by hand.
 *
 * This restores the polar vocabulary WITHOUT restoring the old coupling. The
 * projection runs once at module load and what the components consume is still a
 * plain offset — nothing at runtime knows an angle, the cards are still free to
 * be any size, and nothing is tethered to a point on the ring. The ellipse is
 * back as a way of SPEAKING about the layout, not as a constraint on it.
 *
 * The tilt is folded in here, which is why `y` needs no further squashing
 * downstream: a station's vertical offset is already the projected one.
 */
export function orbitalStation(
  theta: number,
  ring: number,
  tilt: number = ORBIT_TILT,
): { x: number; y: number } {
  const rad = (theta * Math.PI) / 180;
  const d = planeDivisor(ring, Math.cos(rad));
  return {
    x: (ring * Math.sin(rad)) / d,
    y: (tilt * (ring * -Math.cos(rad))) / d,
  };
}

/**
 * Resolves an AUTHORED card position into everything the deck needs from it.
 *
 * `x` and `y` are offsets from the plane's centre in units of --orbit-radius,
 * with `y` measured BEFORE the tilt squash. There is no trigonometry left here
 * and no projection: the card is where the roster says it is. What this function
 * still does is derive the things that must stay consistent with that position —
 * chiefly the bearing the spacecraft has to aim along.
 *
 * THE SHIP AIMS AT THE CARD. It used to aim at a waypoint on the orbital plane,
 * which was correct while the card was tethered to that waypoint. With the cards
 * detached, the waypoint is not a thing any more — there is nothing there and
 * nothing drawn there — so pointing the hull at it would be aiming at empty
 * space beside the object the operator is looking at.
 */
export function derivePlacement(
  x: number,
  y: number,
  /**
   * The card's resting tier scale. The beam aims at the card's BOTTOM EDGE, and
   * a card drawn at 0.75 has a bottom edge nearer its centre than one at 1.2 —
   * so the drop has to scale with it or the beam lands mid-card on the small
   * ones and short of the large ones.
   */
  cardScale: number = 1,
  tilt: number = ORBIT_TILT,
): MissionPlacement {
  // Depth: further UP the frame reads as further away. `y` runs roughly -0.75
  // (back rank) to +0.18 (front rank), so this maps to about 0.13 and 0.59.
  const depth = (y + 1) / 2;

  // Displacement from the SHIP, not from the plane centre. Screen y grows
  // downward and the ship sits one standoff below the centre, so subtracting the
  // standoff is what puts the card ahead of the vehicle.
  //
  // AIMED AT THE CARD'S BOTTOM EDGE, NOT ITS CENTRE — see BEAM_TARGET_DROP. The
  // bearing beam runs along this heading, and a beam aimed at the centre crosses
  // the title and the summary to get there. Shortening such a beam does not fix
  // it: the tip only ever walks back along the SAME line, so it leaves the card
  // through whichever corner faces the ship rather than through the bottom
  // middle. The line itself has to point lower.
  const dx = x;
  const dy = y + BEAM_TARGET_DROP * cardScale - tilt * SHIP_STANDOFF_SCREEN;

  return {
    x,
    y,
    depth,
    lod: resolveLod(depth),
    screenAngle: angleTo({ x: 0, y: 0 }, { x: dx, y: dy }),
    range: Math.hypot(dx, dy),
    zIndex: 10 + Math.round(depth * 35),
    side: Math.abs(x) < CENTRE_BAND ? "center" : x < 0 ? "left" : "right",
  };
}
