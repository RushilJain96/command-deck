import { screenAngleToWorldYaw, worldYawToScreenAngle } from "@/features/missions/placement";

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
 * ORBIT_TILT.
 *
 * 0.6871 is 43.4deg. IT IS A CONTRACT WITH `scripts/render-ship-frames.py`, not
 * a free parameter: every frame in `public/ship/` is a render taken from exactly
 * this elevation, and <ShipSprite> maps bearings to frames through this same
 * number. Change one without the other and the rendered nose stops matching the
 * bearing vector the deck draws — which is the one error on this deck a viewer
 * can check by eye, against a line that is right there.
 *
 * CHOSEN OFF A CONTACT SHEET, not by argument. Seven elevations were rendered
 * against the four yaws the deck actually uses. 43.4 is the highest angle at
 * which the engine bells still read as three distinct apertures at yaw 0, and
 * the lowest at which the wing planform stays legible at yaw 22 — the hull's
 * rendered angle when the ship aims at AURORA, the widest bearing on the deck.
 * 51.3 was rendered alongside and rejected again: the bells go to slivers and
 * the ship reads as seen from above rather than from behind.
 *
 * THE OLD NOTE HERE WAS WRONG IN BOTH DIRECTIONS. It described this constant as
 * "deliberately HIGHER" than the plane and cited 0.78 / 51.3deg, while the value
 * was 0.55 / 33.4deg — lower than the plane, and the render script said that low
 * angle was deliberate. It was stale from an abandoned iteration and contradicted
 * the pipeline on exactly the question it claimed to answer.
 *
 * The plane is drawn at 0.64 (39.8deg), so the hull now sits 3.6deg ABOVE it
 * where it used to sit 6.4deg below: the two elevations disagree by LESS than
 * they did. <ShipSprite> absorbs what remains, and nothing else in the app knows.
 */
export const SHIP_CAMERA_TILT = 0.6871;

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
 * ONLY 37% OF THIS IS SHIP. The frames carry transparent margin so the hull can
 * yaw without clipping: measured off the alpha channel, the silhouette spans
 * 0.333-0.703 of the frame vertically and 0.217-0.781 horizontally. So a 444px
 * box paints a hull about 250x164. Any reasoning about how large the ship
 * *looks*, or where its top edge falls, has to go through those fractions —
 * treating this number as the on-screen ship overestimates it by roughly 2.7x
 * in height, which is precisely the error that left the hull looking small and
 * parked under the orbit.
 *
 * TWO THINGS ARE COUPLED TO IT. `DECK_BIAS` in placement.ts has to come down as
 * this goes up — the ship is anchored at its centre, so it grows toward the
 * dock — and the layout solver models the hull as a square of half this value,
 * which is conservative by design since the visible silhouette is much smaller.
 *
 * RETINA HEADROOM IS NOW 1.39x, AND THAT IS A DEBT. The frames are 800px
 * (FRAME_PIXELS): 404 gave 1.98x, 444 gave 1.80x, and 577 gives 1.39x — on a 2x
 * display the hull is upscaled about 44%. The previous note said "if the ship
 * ever grows again, re-render rather than stretching further", and it was right;
 * the ship has grown again and the re-render has NOT been done.
 *
 * **Re-render the frames at 1200px (`scripts/render-ship-frames.py`) before this
 * ships.** It is a script run rather than a code change, and it takes the
 * headroom back to 2.08x.
 *
 * 444 -> 577, measured against the reference. The painted hull was about 250x164
 * where the reference draws roughly 355x275 — the vehicle the whole deck is built
 * around was being rendered at 70% of the size it is supposed to be, parked under
 * its own orbit. The room for it came from CARD_Y_GAIN: the callout arrangement
 * was spread 45% wider vertically than the reference's and had grown down into
 * the space the hull needed, so the cards were sizing the ship. That coupling is
 * the thing that was actually wrong; the number here is the consequence.
 *
 * TWO THINGS ARE COUPLED TO IT. `DECK_BIAS` in placement.ts governs where the
 * hull's CENTRE sits — the ship grows about that centre, so a larger value here
 * spends its extra height equally up into the field and down toward the footer —
 * and the layout solver models the hull as a square of half this value, which is
 * conservative by design since the visible silhouette is much smaller.
 */
export const SHIP_PIXELS = 577;

/**
 * Rendered pixel size of each frame. Roughly twice the largest on-screen size
 * so the hull stays sharp on a 2x display; the browser downscales.
 *
 * Moved 512 -> 768 when the ship grew: at 512 a 404px hull on a retina panel was
 * being upscaled, and upscaling is exactly what destroys the panel-line detail
 * this model was chosen for.
 *
 * CORRECTED 768 -> 800 to match reality. `scripts/render-ship-frames.py` sets
 * FRAME_PIXELS = 800 and the files in `public/ship/` are 800x800; this constant
 * had drifted and was understating them. Only the img's intrinsic-size
 * attributes read it — the element is sized entirely by CSS — so the correction
 * changes no pixels, but the two files are supposed to be a contract and a
 * contract that lies is worse than no contract.
 */
export const FRAME_PIXELS = 800;

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

/**
 * The screen heading anything BOLTED TO THE HULL must be rotated by.
 *
 * THE HULL DOES NOT FACE WHERE IT AIMS, so neither can its exhaust. A bearing of
 * 66deg is drawn as a hull yawed about 21deg, because `renderYaw` compresses it
 * to keep the ship in its hero pose. The plume, however, was rotated by the raw
 * bearing — so at the flanks of the deck the flame left the ship at roughly 45deg
 * off the engine bells and read as a separate object trailing behind the
 * spacecraft rather than as thrust coming out of it. That is the "detached at
 * some viewing angles" symptom, and it is not a fade or a blend problem: it is
 * two elements being driven by two different headings.
 *
 * Round-trip: un-project the bearing to a real yaw, compress it exactly as the
 * sprite does, then re-project the compressed yaw back to screen. What comes out
 * is the direction the hull is genuinely DRAWN facing, so the plume stays welded
 * to the nozzles at every bearing.
 *
 * Through SHIP_CAMERA_TILT, not ORBIT_TILT, for the same reason <ShipSprite>
 * uses it: the hull is rendered from a higher elevation than the plane, and this
 * has to agree with the frames rather than with the ellipse.
 *
 * NOTE THE BEARING VECTOR IS DELIBERATELY NOT CHANGED. It still points at the
 * true bearing, because it is an instrument reporting where the target is — the
 * one thing on the deck that must stay literal. The exhaust is physics attached
 * to a body; the vector is data. They are allowed to disagree, and the disagreement
 * is exactly what SHIP_YAW_LIMIT is buying.
 */
export function plumeScreenAngle(screenAngle: number): number {
  return worldYawToScreenAngle(
    renderYaw(screenAngleToWorldYaw(screenAngle, SHIP_CAMERA_TILT)),
    SHIP_CAMERA_TILT,
  );
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
