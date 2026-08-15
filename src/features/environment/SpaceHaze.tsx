"use client";

import { motion, useTransform } from "framer-motion";
import { useCamera } from "@/features/camera/CameraProvider";

/**
 * Gas in the sky.
 *
 * THE FRAME NEEDED SOMETHING BETWEEN THE STARS AND THE VOID. With the field
 * contained, the scatter thinned and the corners taken to black, the backdrop
 * became genuinely empty — which was the goal, and it went one step too far: an
 * absolutely black field gives the ring beads nothing to be brighter THAN. A
 * light reads as a light when it sits in a medium; on pure black it reads as a
 * pixel that is on. These clouds are that medium.
 *
 * TEAL AND BLUE-GREEN, WHICH IS A DEPARTURE. Every other colour on this deck is
 * on the blue-to-white axis, and `orbit.data.ts` states that rule outright for
 * the field itself ("BLUE AT EVERY SCALE, AND NEVER CYAN"). That rule governs
 * the RINGS, and it is about what a light source may be. This is not a light
 * source — it is unlit gas being seen against a dark sky, and the whole reason
 * it lifts the field is that it is a different hue from everything in front of
 * it. Keeping it blue would make it read as a dim part of the orbit rather than
 * as something behind the orbit.
 *
 * THE ALPHAS ARE SET AGAINST PURE BLACK, WHICH IS WHY THEY LOOK HIGH. `--void`
 * is #000 with nothing behind it, so an alpha here is the entire luminance of
 * the result: 0.28 of rgb(44 122 116) resolves to about #0c2220, which is a
 * just-perceptible dark teal. The first cut used 0.055-0.12 by analogy with
 * `DeepSpace`, whose values were tuned as a wash over layers that already had
 * light in them, and it rendered — correctly, in the DOM, with the right
 * gradients — as nothing at all. A layer whose whole job is to be felt has to
 * clear the threshold of being seen first.
 *
 * The ceiling is still low. Anything strong enough to read as a SHAPE has
 * stopped being atmosphere and become scenery. If you can point at one of these
 * and describe its outline, it is too strong.
 *
 * NO BLUR FILTERS. On a near-black base a wide radial gradient is
 * indistinguishable from a blurred shape and costs nothing to composite, which
 * matters because these layers cover the whole viewport.
 *
 * A SIBLING OF <CameraRig>, never a child — same rule as <Starfield>. It
 * parallaxes at a very low factor because it is the furthest thing in the scene;
 * anything faster and the gas reads as being closer than the stars in front of
 * it.
 *
 * FOUR CLOUDS, ONE ELEMENT. The first cut gave each cloud its own transformed
 * div so they could parallax at slightly different rates. That is four
 * full-viewport composited layers repainting on every camera frame, to buy a
 * depth difference of 0.01 in the parallax factor — which is about a pixel of
 * relative motion across the whole pan range and cannot be seen. Stacked
 * backgrounds on a single element cost one layer and look identical.
 */
const CLOUDS = [
  // Upper left, behind the instrument rail and the one visible planet.
  "radial-gradient(40% 32% at 20% 16%, rgb(44 122 116 / 0.099), transparent 68%)",
  // Runs diagonally down past the field's left flank, so the two greens read as
  // one drift rather than two blobs.
  "radial-gradient(34% 46% at 6% 58%, rgb(38 106 108 / 0.077), transparent 72%)",
  // Opposite corner, cooler and weaker — the counterweight, not a mirror.
  "radial-gradient(38% 30% at 88% 30%, rgb(46 104 132 / 0.068), transparent 70%)",
  // Under the plane's near arc. This is the one the ring beads are read against,
  // so it is the one that matters most.
  "radial-gradient(52% 26% at 58% 90%, rgb(40 112 104 / 0.059), transparent 66%)",

  /* THREE WISPS, TIGHTER AND WEAKER THAN THE FOUR ABOVE.
   *
   * The broad clouds give the sky a temperature; on their own they also give it
   * a single smooth falloff, which is the tell that a gradient is a gradient.
   * These are a third the radius, sit between the big ones rather than on them,
   * and one of them is violet rather than teal — enough variation that the eye
   * reads scattered gas instead of one lit corner.
   *
   * Small radii are also what keeps them cheap: they are stacked backgrounds on
   * an element that already exists, so seven gradients cost the same one layer
   * that four did. */
  "radial-gradient(20% 15% at 44% 26%, rgb(52 128 122 / 0.045), transparent 70%)",
  "radial-gradient(17% 13% at 74% 62%, rgb(64 96 140 / 0.038), transparent 72%)",
  "radial-gradient(15% 12% at 30% 74%, rgb(92 78 132 / 0.034), transparent 74%)",
].join(",");

const HAZE_PARALLAX = 0.018;

/**
 * The screen-anchored ambient field, under everything including the clouds.
 *
 * DOES NOT PARALLAX, DELIBERATELY. This is the deep glow the whole composition
 * sits in, and a glow that slides when the camera pans reads as a light source
 * somewhere out in the world rather than as the ambient level of the scene. The
 * clouds above it move; this does not.
 *
 * IT PAINTS ONTO BLACK AND ENDS AT BLACK, so the outer stops cost nothing — the
 * ground is already `--void`. That is what makes it safe to run all the way to
 * opaque at the rim, which an equivalent VIGNETTE over the top would not be: the
 * same darkness applied above the field would erase the outer rings, which is
 * exactly why the vignette in <DeepSpace> stayed stood down.
 */
const AMBIENT = [
  /**
   * SHIP BLOOM. A small, weak pool directly behind the hull.
   *
   * This was deferred twice — once when the vignette was rejected, once when the
   * floor light cone was scheduled — on the grounds that it belonged with the
   * spacecraft work. It belongs here instead, and the reason is what it is FOR:
   * it is not lighting on the ship, it is separation between the ship and what
   * is behind it. The hull is a light grey object and the deep field behind it
   * is near black, so the silhouette was reading as a cutout. A faint lift right
   * where the hull sits gives the edge something to be an edge against.
   *
   * 62% down the frame, which is where the hull sits at DECK_BIAS 0.93 — not
   * 50%. A bloom centred on the viewport would sit in the middle of the ring
   * system and light the wrong thing entirely.
   */
  "radial-gradient(ellipse 26% 20% at 50% 62%, rgb(120 170 210 / 0.025), transparent 72%)",
  /**
   * The cyan spread, HALVED AGAIN to 0.022. At 0.10 this single stop was tinting
   * roughly half the frame — a 78%-by-58% ellipse is enormous, so even a low
   * alpha reads as an overall colour cast rather than as a glow. It survives at
   * all because the field needs something cyan behind it to sit in; it does not
   * survive at a strength where the eye can name the colour of the background.
   */
  "radial-gradient(ellipse 78% 58% at 50% 40%, rgb(0 212 255 / 0.022), transparent 76%)",
  /**
   * THE CENTRAL RADIAL. Tighter and far darker: the mid stop lands at 35% rather
   * than 42/74, so the field falls to near-black inside the first third of its
   * radius instead of holding a lit blue out to three quarters.
   *
   * THE OPAQUE OUTER STOP IS SAFE **HERE** AND NOWHERE ELSE, which is the whole
   * reason this gradient lives in this file. <SpaceHaze> paints BEHIND the
   * starfield, so black at the rim costs nothing — the stars draw over it. The
   * same gradient on <PlaneAurora> would punch a starless hole across the middle
   * of the frame, because that element sits inside <CameraRig> with the stars
   * behind it. The aurora got these colours with `transparent` outer stops
   * instead; see the note there.
   */
  "radial-gradient(circle at 50% 50%, rgb(12 28 48 / 0.4) 0%, rgb(3 7 12 / 0.9) 35%, rgb(0 0 0 / 1) 100%)",
].join(",");

/**
 * FILM GRAIN. Fractal noise, generated once as an inline SVG data URI.
 *
 * Everything behind the deck is a radial gradient, and a radial gradient is
 * mathematically perfect — which on a wide, dark, slowly-varying field produces
 * visible BANDING, the concentric steps you get when 8-bit colour has to
 * describe a gradient that changes by less than one value per hundred pixels.
 * Noise is the standard fix: it dithers the boundary between adjacent bands so
 * the step falls below the threshold of being seen.
 *
 * That it also reads as cosmic dust is a bonus, not the reason. At 0.04 nobody
 * will ever identify it as grain; they will only notice that the background
 * stopped having rings in it.
 *
 * A data URI rather than a file, because it is 300 bytes and a network request
 * for 300 bytes is worse than the bytes. `baseFrequency` is high so the grain is
 * fine — a low frequency here looks like clouds, not film.
 */
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)'/%3E%3C/svg%3E\")";

export function SpaceHaze() {
  const camera = useCamera();
  const x = useTransform(camera.x, (value) => -value * HAZE_PARALLAX);
  const y = useTransform(camera.y, (value) => -value * HAZE_PARALLAX);

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0" style={{ background: AMBIENT }} />
      {/* -inset-[10%] so the pan never exposes an edge of the gradient's box. */}
      <motion.div className="absolute -inset-[10%]" style={{ x, y, background: CLOUDS }} />
      {/* Grain last, over both, so it dithers the gradients rather than sitting
          under them where it would be the thing being banded. */}
      <div
        className="absolute inset-0"
        style={{ backgroundImage: GRAIN, opacity: 0.04 }}
      />
    </div>
  );
}
