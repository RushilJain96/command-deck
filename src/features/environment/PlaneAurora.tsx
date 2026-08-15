import { FIELD } from "./orbit.data";

/**
 * The light pooled in the middle of the orbital plane.
 *
 * WHAT THE FIELD WAS MISSING ONCE IT GAINED AN EDGE. While the rings ran off
 * every side of the frame the eye read "we are inside something" and never asked
 * where the middle was. A bounded ring system has an obvious centre, and a centre
 * with nothing in it looks like an omission — the rings converge on a hole.
 * This is the haze they converge INTO.
 *
 * A CSS GRADIENT, NOT A FOURTH CANVAS PASS. <OrbitGuides> composites additively
 * because thousands of overlapping point stamps have to accumulate; that is the
 * right machinery for a thread of light and completely wrong for a shape with no
 * detail in it. Stamping a fourth pass at this radius would cost a full extra
 * brush set per repaint to draw something two stacked gradients draw for free.
 *
 * SQUASHED BY THE TILT, WHICH IS THE WHOLE TRICK. An un-squashed circle here
 * reads as a lens flare sitting on the glass in front of the scene — it faces
 * the viewer, and nothing else in the composition does. Multiplying the vertical
 * radius by `--orbit-tilt` lays the light down INTO the plane, on the same
 * ellipse the rings are drawn on, so it belongs to the world rather than to the
 * camera.
 *
 * TWO STOPS, DELIBERATELY. A single gradient wide enough to reach the middle
 * rings has to be so faint at its centre that it does nothing there; one tight
 * bloom plus one wide haze gives a bright core and a long tail, which is the
 * same two-falloff logic the halo and atmosphere passes use in <OrbitGuides>.
 *
 */
export function PlaneAurora() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2"
      style={{
        // Sized off the outermost ring so the haze always ends inside the field.
        width: `calc(var(--orbit-radius) * ${FIELD.outerRing * 2})`,
        height: `calc(var(--orbit-radius) * var(--orbit-tilt) * ${FIELD.outerRing * 2})`,
        /**
         * The alphas are low but NOT as low as they first look: this paints onto
         * #000 with nothing behind it, so 0.15 here is the full 0.15 rather than
         * a wash over an already-lit surface. An earlier pass at 0.10/0.055 was
         * invisible in a screenshot, which is the only test that matters for a
         * layer whose entire job is to be felt rather than seen.
         *
         * THE HUES ARE NOW EXPLICIT RATHER THAN DERIVED. They used to come from
         * FIELD_PALETTE so the glow could never drift from the rings. That was
         * the right instinct while both were the same blue; it stops being right
         * once the glow is meant to be the SOURCE the rings are lit by, because
         * a source and the thing it lights are not the same colour — the source
         * is deeper and more saturated, the lit thing is closer to white. So the
         * two are now related by intent rather than by expression: deep teal-blue
         * core, cyan spotlight, and the rings sit a long way toward white of both.
         */
        /**
         * THE OUTER STOPS REACH MUCH FURTHER THAN THEY DID. Every radius here
         * grew — 22/34/66 became 30/52/100 — because the glow was reading as a
         * lit disc sitting in the middle of the plane rather than as the plane
         * being lit. A source with a visible boundary is an object; a source has
         * to run out of frame before the eye stops looking for its edge.
         *
         * The alphas came DOWN as the radii went up. Spreading the same light
         * over three times the area and keeping the alpha would have lifted the
         * whole plane off black, which is the one thing the containment work was
         * protecting. Wider and fainter is a bigger volume of the same gas.
         */
        /**
         * PULLED IN AND DARKENED HARD. The previous set ran 30/52/100 percent at
         * alphas 0.10/0.26/0.20 in fairly saturated blues, and the note above
         * about "wider and fainter" was solving the wrong problem: spreading the
         * haze to the full extent of the field stopped it having a visible edge,
         * but it also lifted the entire middle of the frame off black. What read
         * as a lit floor at a glance read as a blue wash on any longer look, and
         * the void is supposed to be the darkest thing in the composition.
         *
         * The radii come in to 26/44/76 and the deep stops move to near-black
         * navy. The cyan stays, at half strength, because something has to be the
         * source the rings are lit by — remove it entirely and the field goes
         * from "lit plane" to "wireframe on black".
         *
         * EVERY OUTER STOP IS `transparent`, NOT BLACK, AND THAT IS LOAD-BEARING.
         * A literal `rgba(0,0,0,1)` outer stop is a no-op over the void and very
         * much not a no-op over the STARFIELD — this element sits inside
         * <CameraRig> while the stars are a sibling behind it, so an opaque outer
         * ring would punch a starless ellipse across most of the frame. Fading to
         * transparent darkens nothing it should not.
         */
        background: [
          // Cyan spotlight, tightest and brightest — the thing at the middle.
          `radial-gradient(ellipse 26% 26% at 50% 48%, rgb(0 212 255 / 0.055), transparent 72%)`,
          // Core bloom, now a deep navy rather than a lit blue.
          `radial-gradient(ellipse 44% 44% at 50% 50%, rgb(12 28 48 / 0.34), transparent 78%)`,
          // Outer haze: a region of space rather than a light, and close enough
          // to black that it reads as depth instead of as colour.
          `radial-gradient(ellipse 76% 76% at 50% 50%, rgb(3 7 12 / 0.5), transparent 88%)`,
        ].join(","),
      }}
    />
  );
}
