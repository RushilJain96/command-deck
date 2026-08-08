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
 * CHANGING IT INVALIDATES THE SHIP FRAMES. `scripts/render-ship-frames.py`
 * derives its camera elevation from exactly this constant, so every rendered
 * yaw frame in `public/ship/` is baked at the current value. Move it and the
 * hull is lit and foreshortened for a camera that no longer exists — the ship
 * will look composited in from another scene, which is subtle enough that
 * nobody names it and obvious enough that everybody feels it. Re-render.
 *
 * It also sets how TALL the orbital field is: the whole ring system spans
 * 2 * R * tilt vertically. At 0.46 the missions could only occupy about a third
 * of the frame height and left a dead band above the ship.
 *
 * SINGLE SOURCE OF TRUTH. CSS receives this as an inline `--orbit-tilt` on
 * <OrbitPlane>; never write the literal into a stylesheet. If the two drift,
 * the ship mis-aims by a degree or two and nothing will ever point at the cause.
 *
 * MUST NOT become responsive. `screenAngle` below is viewport-independent only
 * because the radius cancels out of `atan2`. A tilt that varied by breakpoint
 * would force JS viewport measurement for the ship's aim, which is banned.
 */
export const ORBIT_TILT = 0.64;

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
export const SHIP_STANDOFF = 1.05;

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
export const ORBIT_PERSPECTIVE = 0.13;

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
export const DECK_BIAS = 0.93;

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
export const LOD_THRESHOLDS = { marker: 0.2, compact: 0.34 } as const;

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
  /** sin(theta). Multiply by --orbit-radius AND `ring` for the x offset. */
  readonly sx: number;
  /** -cos(theta). Multiply by --orbit-radius, --orbit-tilt AND `ring` for y. */
  readonly sy: number;
  /** Which orbit the mission rides, as a fraction of --orbit-radius. */
  readonly ring: number;
  /** 0 = far rim, 0.5 = plane centre, 1 = near rim. */
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
   * Bearing from the PLANE'S CENTRE to the projected point — what `screenAngle`
   * used to be before the ship moved off centre.
   *
   * Only the orbit guides want this: a graduation tick has to lie tangent to
   * the ring it marks, which is a property of the ellipse and has nothing to do
   * with where the vehicle is parked. Feeding the ship-relative `screenAngle`
   * to a tick rotates the entire scale into a spiral.
   */
  readonly radialAngle: number;
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
 */
export const SHIP_Z_INDEX = 50;

/**
 * How far a callout stands off its anchor point on the orbital plane, at the
 * largest tier. `run` is the horizontal reach, `rise` the elevation; together
 * they form an L-shaped leader.
 *
 * The elevation is the whole point: a panel sitting ON the ellipse reads as a
 * card lying flat in the same plane as everything else, whereas a panel visibly
 * held ABOVE its footprint separates the mission layer from the orbital layer.
 * That separation is what makes the deck feel like a space rather than a
 * diagram.
 *
 * THE LIVE VALUES ARE `--callout-run` / `--callout-rise` IN globals.css, which
 * shrink at smaller tiers. These constants exist so the headless geometry check
 * can model the largest case; they are not read at runtime. Change one and you
 * must change the other, then re-run the check — the radius formula reserves a
 * fixed pixel budget tuned against these exact numbers.
 */
export const CALLOUT_STANDOFF = { run: 18, rise: 26 } as const;

export function derivePlacement(
  theta: number,
  ring: number = 1,
  tilt: number = ORBIT_TILT,
): MissionPlacement {
  const rad = (theta * Math.PI) / 180;
  const d = planeDivisor(ring, Math.cos(rad));
  const sx = Math.sin(rad) / d;
  const sy = -Math.cos(rad) / d;

  // Ring radius feeds depth as well as position: a node on an inner orbit is
  // nearer the middle of the plane, so it reads mid-distance no matter which
  // way round the ring it sits.
  const depth = (1 - ring * Math.cos(rad)) / 2;

  // Displacement from the SHIP, not from the plane centre. Screen y grows
  // downward and the ship is one standoff below the centre, so subtracting the
  // standoff is what puts the node ahead of the vehicle.
  const dx = ring * sx;
  const dy = tilt * (ring * sy - SHIP_STANDOFF_SCREEN);

  return {
    sx,
    sy,
    ring,
    depth,
    lod: resolveLod(depth),
    screenAngle: angleTo({ x: 0, y: 0 }, { x: dx, y: dy }),
    // Ring cancels here (it scales both components equally), so this is the
    // tangent direction of the ellipse at theta regardless of which orbit.
    radialAngle: angleTo({ x: 0, y: 0 }, { x: sx, y: sy * tilt }),
    range: Math.hypot(dx, dy),
    zIndex: 10 + Math.round(depth * 35),
    side: Math.abs(ring * sx) < CENTRE_BAND ? "center" : sx < 0 ? "left" : "right",
  };
}
