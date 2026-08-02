/**
 * Pre-rendered hull frames.
 *
 * SOURCE MODEL — "Spaceship COLAID1 50k" by Jungle Jim
 * https://sketchfab.com/3d-models/spaceship-colaid1-50k-34acc30c89364a668ab1025686a686bc
 * Licensed CC-BY-4.0, WHICH REQUIRES VISIBLE ATTRIBUTION. The credit has to
 * appear somewhere a visitor can reach — a colophon, an about panel, or the
 * footer. This comment is not that; it is only the record of what is owed.
 * If the credit ever comes off the site, the frames have to come off with it.
 *
 * THE CONTRACT between this file and `scripts/render-ship-frames.py`. Change a
 * number here and you must re-render; change one there and you must edit here.
 *
 * WHY FRAMES INSTEAD OF ONE IMAGE. The ship yaws to face whatever the operator
 * is pointing at, and a photoreal render bakes in its viewpoint — rotating one
 * on screen makes it read as a ship lying on its side rather than turning. Each
 * frame here is the hull actually rotated that far in 3D, so the silhouette
 * changes, the tail comes into view, and the specular travels across the panels
 * as it turns. That is the entire difference between "a render" and "a render
 * that looks alive".
 *
 * WHY SO FEW FRAMES. Two facts collapse the count from hundreds to sixteen.
 * The hull is bilaterally symmetric, so a port turn is the mirror of the
 * matching starboard turn — <ShipSprite> flips with `scaleX(-1)` and the frame
 * set only covers one side. And the ship's real yaw stays inside +/-42deg at
 * the current standoff, because it only ever aims at the six missions in
 * `data.ts` and the plane's squash compresses world yaw relative to apparent
 * screen angle. 0-75deg in 5deg steps covers that with a wide margin, which is
 * the point: re-scattering the missions does not force a re-render.
 *
 * THE FRAMES ARE BAKED AT ORBIT_TILT. That constant is the camera's elevation,
 * so changing it means every frame here was lit and foreshortened for a camera
 * that no longer exists. Re-run `scripts/render-ship-frames.py`.
 *
 * The visible steps are hidden by crossfading adjacent frames on the fractional
 * part of the index, so 5deg reads as continuous.
 */

/**
 * The hull's own camera elevation, as sin(phi) — the same encoding as
 * ORBIT_TILT, and DELIBERATELY HIGHER than it.
 *
 * The plane is drawn at 0.64 (39.8deg). Rendering the ship from the identical
 * elevation is the physically consistent choice and it makes a poor hero shot:
 * at 40deg you see the hull almost edge-on, the wing planform collapses, and the
 * dorsal detail that carries all the panel work is hidden. 0.78 puts the ship's
 * camera at 51.3deg, which reads as a flagship seen from above.
 *
 * THIS IS A DELIBERATE CHEAT AND IT HAS A COST. The ship and the plane are now
 * lit and foreshortened from two different elevations. It survives because the
 * eye has no reference edge to compare them against — the hull is a smooth
 * organic form with no straight line shared with the ellipse — but push the gap
 * much past 12deg and the ship starts to read as pasted on. If it ever does,
 * this is the number to walk back.
 *
 * The mismatch is fully absorbed in ONE place: <ShipSprite> maps bearings to
 * frames through this constant instead of ORBIT_TILT, so the rendered nose still
 * lines up with the bearing vector. Nothing else in the app knows.
 */
export const SHIP_CAMERA_TILT = 0.55;

/**
 * Hard ceiling on how far the hull is ever RENDERED as turned, in degrees.
 *
 * THE SHIP DOES NOT TURN AS FAR AS IT AIMS, AND THAT IS THE POINT.
 *
 * Bearings on this deck reach +/-54deg. Rendering that literally means the hull
 * swings through a huge arc, and past roughly 25deg it stops presenting the pose
 * the model was chosen for: the engine bells rotate out of view, the wing
 * planform foreshortens into a sliver, and the panel detail smears because you
 * are looking along the hull rather than at it. The ship stops reading as a
 * vehicle the camera is following and starts reading as an image being spun.
 *
 * So the yaw is compressed through a `tanh` (see `renderYaw`): near-linear for
 * small aims, saturating smoothly at this ceiling for large ones. The hull leans
 * convincingly toward its target and never leaves its hero angle.
 *
 * NOTHING IS LOST BY DOING THIS, because the ship was never the thing that
 * communicated the exact bearing — the bearing vector is, and it still points
 * dead at the target. The hull only has to look like it means it. This is the
 * same trick arcade flight games use, for the same reason.
 */
export const SHIP_YAW_LIMIT = 22;

/**
 * Degrees of yaw between adjacent frames.
 *
 * Tightened 5 -> 2 when SHIP_YAW_LIMIT landed. With the hull confined to a
 * 22deg arc, 5deg steps meant the entire range of motion was four frames and
 * the crossfade had to carry too much; 2deg steps put eleven inside the working
 * range for the same sixteen files.
 */
export const FRAME_STEP = 2;

/** Frames from yaw 0 (nose directly away from camera) to yaw 30, inclusive. */
export const FRAME_COUNT = 16;

/** Highest yaw the frame set covers. Headings beyond this clamp to the last. */
export const MAX_YAW = (FRAME_COUNT - 1) * FRAME_STEP;

/**
 * On-screen size of the hull at the largest tier, in CSS pixels.
 *
 * SINGLE SOURCE OF TRUTH for how big the ship is. The sprite, the vector
 * fallback and the exhaust all read it, so the three can never disagree about
 * the hull's footprint — and the exhaust in particular is drawn in hull
 * coordinates, so a mismatch would park the flame somewhere other than the
 * nozzles.
 *
 * TWO THINGS ARE COUPLED TO IT. `FRAME_PIXELS` below should stay at 2x this for
 * retina sharpness, and `DECK_BIAS` in placement.ts has to come down as this
 * goes up — the ship is anchored at its centre, so it grows toward the dock.
 * The layout solver models the hull at half this value.
 */
export const SHIP_PIXELS = 404;

/**
 * Rendered pixel size of each frame. Roughly twice the largest on-screen size
 * so the hull stays sharp on a 2x display; the browser downscales.
 *
 * Moved 512 -> 768 when the ship grew: at 512 a 404px hull on a retina panel was
 * being upscaled, and upscaling is exactly what destroys the panel-line detail
 * this model was chosen for.
 */
export const FRAME_PIXELS = 768;

/**
 * Flip to `true` once the frames exist in `public/ship/`.
 *
 * Until then the deck keeps drawing the hand-built vector hull, so a missing
 * asset degrades to the previous ship rather than to sixteen broken images.
 * This is also the switch to flip back if a render turns out worse than the
 * vector — both paths stay wired.
 */
export const SPRITE_ENABLED = true;

/**
 * Compresses a true heading into the arc the hull is actually rendered through.
 *
 * `tanh` because it is the right shape and not merely a convenient one: its
 * derivative at zero is exactly 1, so small aims track the bearing truthfully
 * and the ship still reads as responding precisely; it then rolls off smoothly
 * with no discontinuity in value OR slope, so there is no visible moment where
 * the hull "hits a wall" and stops turning. A hard clamp has that discontinuity
 * and you can see it.
 *
 * Sign is preserved so port and starboard compress identically.
 */
export function renderYaw(trueYaw: number): number {
  return SHIP_YAW_LIMIT * Math.tanh(trueYaw / SHIP_YAW_LIMIT);
}

/** `/ship/yaw-00.webp` … `/ship/yaw-30.webp`. */
export function frameSrc(index: number): string {
  return `/ship/yaw-${String(index * FRAME_STEP).padStart(2, "0")}.webp`;
}

/**
 * Which two frames to show for a given yaw, and how much of the second.
 *
 * `blend` is the crossfade weight on `upper`; `lower` takes the remainder. At
 * an exact frame boundary `blend` is 0 and only `lower` is drawn.
 */
export function frameBlend(yaw: number): { lower: number; upper: number; blend: number } {
  const clamped = Math.min(Math.abs(yaw), MAX_YAW);
  const exact = clamped / FRAME_STEP;
  const lower = Math.floor(exact);
  return {
    lower,
    upper: Math.min(lower + 1, FRAME_COUNT - 1),
    blend: exact - lower,
  };
}
