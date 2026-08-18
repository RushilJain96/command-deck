"use client";

import { useEffect, useRef } from "react";
import { planeDivisor } from "@/features/missions/placement";

/**
 * The rings' colour, as a bare rgb triple for the brush factories.
 *
 * Not in FIELD_PALETTE because it is not derived from `FIELD.hue`: every ring is
 * painted in this, so the field has one colour and the hue ramp only shapes the
 * dim atmosphere behind it.
 */
const ACCENT = "0,212,255";
import {
  FIELD,
  FIELD_MARGIN,
  FIELD_PALETTE,
  FIELD_RINGS,
  FIELD_TILT,
  lightAt,
  radiusAt,
  type FieldRing,
} from "./orbit.data";

/**
 * THE ORBITAL FIELD.
 *
 * Painted to a canvas, and that is a deliberate departure from the rest of the
 * deck. Everything else here is CSS because CSS is exact and needs no
 * measurement; this layer needs ADDITIVE COMPOSITING — thousands of small
 * lights accumulating where they overlap — and there is no way to get that from
 * stacked DOM elements. It is what makes a dense run of points read as one
 * continuous thread and a sparse run read as separate sparks, without anything
 * about the drawing changing between the two.
 *
 * The model is in `orbit.data.ts`. This file is the renderer.
 *
 * IT SITS UNDER EVERYTHING. Mounted inside <PlaneSurface>, before the mission
 * nodes, with no z-index — so the callouts (z 10-46) and the spacecraft (z 50)
 * both paint over it by construction. That is the plane the deck is arranged
 * on: the field is below the vehicle, the vehicle flies above it.
 *
 * PAINTED ONCE. Nothing here animates, so after mount the canvas is a static
 * bitmap that costs nothing per frame. It repaints only when the orbit radius
 * changes, which means on viewport resize, and that is debounced.
 *
 * MEASUREMENT IS CONFINED TO AN EFFECT. Reading `--orbit-radius` and the
 * element's own box during render would be a hydration-mismatch source and a
 * `react-hooks/purity` violation. Doing it after mount is neither, and it is
 * exactly what the `@property` registration on `--orbit-radius` exists for —
 * a registered <length> resolves to pixels, so `getComputedStyle` returns a
 * number rather than the literal `clamp(...)` token.
 */
export function OrbitGuides() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let frame = 0;
    const schedule = () => {
      window.clearTimeout(frame);
      // Debounced: a full repaint is thousands of stamps, and a ResizeObserver
      // fires on every pixel of a drag.
      frame = window.setTimeout(() => paint(canvas), 120);
    };

    paint(canvas);
    const observer = new ResizeObserver(schedule);
    observer.observe(canvas);

    return () => {
      window.clearTimeout(frame);
      observer.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2"
      // SIZED TO THE VIEWPORT, NOT TO THE FIELD. The rings now reach 2.6 orbit
      // radii and deliberately leave the frame, so a canvas big enough to
      // contain them would be roughly 3000x2000 CSS pixels — a 55MB backing
      // store for light that is off-screen anyway. This covers the visible area
      // plus a margin and lets the rest fall outside.
      //
      // The extra height is the plane's own offset: <PlaneSurface> lifts this
      // element one standoff above the viewport's centre, so the canvas has to
      // reach back down past the spacecraft.
      style={{
        // SIZED TO THE DESIGN FRAME, NOT THE VIEWPORT — `/ var(--deck-scale)`.
        // <DeckViewport> draws the deck at a fixed size and scales it, so inside
        // the frame `svh` still reports the WINDOW's height while the frame is
        // `100vh / scale` design units tall. At any scale below 1 a canvas sized
        // in raw `svh` came up short and the field stopped before the bottom of
        // the frame.
        width: `calc(100svw / var(--deck-scale) + ${FIELD_MARGIN * 2}px)`,
        height: `calc(100svh / var(--deck-scale) + var(--orbit-radius) * 0.9 + ${FIELD_MARGIN}px)`,
        /**
         * THE HORIZON FADE. Rings dissolve toward the top of the field and are
         * fully drawn toward the bottom.
         *
         * There is already a front-to-back attenuation in the DATA — `lightAt`
         * runs a 7:1 near/far ratio, so the far arc of each ring is dimmer than
         * its near arc. That is per-ring and it is not the same effect: it makes
         * every ellipse brighter at the bottom of ITSELF, which the eye reads as
         * lighting rather than as distance. What was missing is a fade across the
         * WHOLE FIELD, so the outermost rings vanish where they would meet a
         * horizon instead of running out of the top of the frame at full strength.
         *
         * Screen-space, on the canvas element, rather than baked into the paint —
         * this way it is one composite instead of an extra term inside a loop that
         * stamps tens of thousands of beads, and it can be retuned without a
         * repaint.
         *
         * The stops are in CANVAS space, and the canvas is centred on the plane's
         * origin rather than on the viewport: it reaches `--orbit-radius * 0.9`
         * below the fold to clear the spacecraft. So 42% is roughly where the far
         * arcs sit, not the middle of the screen.
         */
        maskImage: "linear-gradient(to bottom, transparent 4%, #000 42%)",
        WebkitMaskImage: "linear-gradient(to bottom, transparent 4%, #000 42%)",
      }}
    />
  );
}

/**
 * SOLID. The dash duty cycle that lived here — six beads drawn, four skipped —
 * is withdrawn.
 *
 * It did what it was asked to and the result was not wanted: at a 1.15px bead a
 * broken chain reads as a dotted guide on a diagram, and this layer is supposed
 * to be a lit track a vehicle is flying over. A continuous thread of the same
 * thickness reads as the second thing for free, because a gap is what turns
 * light into notation.
 */

const TAU = Math.PI * 2;
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/** The hard thread. Tight core, almost no skirt. */
function makeCore(rgb: string, radius: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  const d = Math.max(4, Math.ceil(radius * 2));
  c.width = d;
  c.height = d;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(d / 2, d / 2, 0, d / 2, d / 2, d / 2);
  grad.addColorStop(0, `rgb(${rgb})`);
  grad.addColorStop(0.14, `rgba(${rgb},0.7)`);
  grad.addColorStop(0.38, `rgba(${rgb},0.14)`);
  grad.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, d, d);
  return c;
}

/**
 * Scattering brush — a long, gentle falloff with no shoulder anywhere.
 *
 * A gradient with a knee in it produces a visible ring edge once thousands are
 * stacked. Every stop here is on a smooth decay, so the accumulated field has no
 * boundary at any radius: it just runs out.
 */
function makeScatter(rgb: string, radius: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  const d = Math.max(4, Math.ceil(radius * 2));
  c.width = d;
  c.height = d;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(d / 2, d / 2, 0, d / 2, d / 2, d / 2);
  grad.addColorStop(0, `rgba(${rgb},1)`);
  grad.addColorStop(0.18, `rgba(${rgb},0.62)`);
  grad.addColorStop(0.38, `rgba(${rgb},0.28)`);
  grad.addColorStop(0.62, `rgba(${rgb},0.09)`);
  grad.addColorStop(0.82, `rgba(${rgb},0.02)`);
  grad.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, d, d);
  return c;
}

/** A short tapered streak, stamped rotated so it always runs toward the centre. */
function makeLeak(rgb: string, width: number, length: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = Math.max(2, Math.ceil(width));
  c.height = Math.max(2, Math.ceil(length));
  const g = c.getContext("2d")!;
  const along = g.createLinearGradient(0, 0, 0, c.height);
  along.addColorStop(0, `rgba(${rgb},0.5)`);
  along.addColorStop(0.18, `rgba(${rgb},0.2)`);
  along.addColorStop(0.5, `rgba(${rgb},0.06)`);
  along.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = along;
  g.fillRect(0, 0, c.width, c.height);
  // Taper the sides so the streak has no parallel edges.
  g.globalCompositeOperation = "destination-in";
  const across = g.createLinearGradient(0, 0, c.width, 0);
  across.addColorStop(0, "rgba(0,0,0,0)");
  across.addColorStop(0.5, "rgba(0,0,0,1)");
  across.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = across;
  g.fillRect(0, 0, c.width, c.height);
  return c;
}

interface ScatterConfig {
  rgb: string;
  /** Downscale factor of the working buffer. */
  div: number;
  /** Brush radius IN BUFFER PIXELS — multiply by `div` for the screen radius. */
  brush: number;
  alpha: number;
  gain: number;
}

/**
 * One scattering pass, rendered into a small buffer and scaled back up.
 *
 * THE SOFTNESS COMES FROM RESAMPLING, NOT FROM A BLUR. A 16px brush in a
 * one-ninth buffer becomes a ~145px falloff on screen with feathered edges, for
 * the cost of a buffer a ninth the size. Stamping a 145px sprite thousands of
 * times at full resolution would cost roughly eighty times the fill and look no
 * better — and a CSS or SVG blur over an area this large is not affordable at
 * all.
 *
 * TWO THINGS HERE ARE EASY TO GET WRONG AND BOTH WERE, IN TURN.
 *
 * Step spacing must be derived from the brush, in buffer space. With a fixed
 * step count, a ring only about a hundred buffer pixels around receives three
 * hundred stamps of a twenty-pixel brush — an overlap of roughly thirty, which
 * clips the buffer to flat white and destroys every trace of the falloff. That
 * is what makes an atmosphere look like fog.
 *
 * And the gain has to be able to exceed 1. Compositing the buffer needs a LOW
 * per-stamp alpha to keep the accumulation off its ceiling, which then leaves
 * the layer far too dim to see; a single `drawImage` caps at globalAlpha 1, so
 * the buffer is stamped two or three times instead.
 */
function scatterPass(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  R: number,
  cx: number,
  cy: number,
  cfg: ScatterConfig,
) {
  const bw = Math.max(8, Math.round(w / cfg.div));
  const bh = Math.max(8, Math.round(h / cfg.div));
  const buf = document.createElement("canvas");
  buf.width = bw;
  buf.height = bh;
  const b = buf.getContext("2d");
  if (!b) return;
  b.globalCompositeOperation = "lighter";

  const brush = makeScatter(cfg.rgb, cfg.brush);
  const bd = brush.width;
  const kx = bw / w;
  const ky = bh / h;

  for (const ring of FIELD_RINGS) {
    // Step count off the ring's LONGEST projected circumference — the near arc,
    // where the divisor is smallest. Stepping on the unprojected radius leaves
    // the near arc visibly under-sampled, because that is exactly the stretch
    // perspective makes longer.
    const bufR = (ring.base * R * kx) / planeDivisor(ring.base, -1);
    const steps = Math.max(24, Math.round((TAU * bufR) / Math.max(1.2, cfg.brush * 0.42)));
    for (let i = 0; i < steps; i++) {
      const t = (i / steps) * TAU;
      const { a } = lightAt(ring, t);
      const r = radiusAt(ring, t) * R;
      const d = planeDivisor(ring.base, Math.cos(t));
      const x = (cx + (r * Math.sin(t)) / d) * kx;
      const y = (cy - (r * Math.cos(t) * FIELD_TILT) / d) * ky;
      b.globalAlpha = clamp01(a * cfg.alpha);
      b.drawImage(brush, x - bd / 2, y - bd / 2);
    }
  }

  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.globalCompositeOperation = "lighter";
  const passes = Math.max(1, Math.ceil(cfg.gain));
  ctx.globalAlpha = clamp01(cfg.gain / passes);
  for (let i = 0; i < passes; i++) ctx.drawImage(buf, 0, 0, w, h);
  ctx.restore();
}

function paint(canvas: HTMLCanvasElement) {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (!w || !h) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // DEVICE PIXEL RATIO IS CAPPED BY TOTAL AREA, not by a fixed number.
  //
  // This canvas is as large as the viewport, so on a wide deck a flat 2x cap is
  // still a 30MB backing store — for a layer whose every feature except the core
  // thread is a soft falloff that throws the extra samples away. Budgeting five
  // megapixels instead means small viewports get a full 1.5x and large ones
  // scale down to whatever fits, which is the right trade in both directions.
  const budget = Math.sqrt(5_000_000 / Math.max(1, w * h));
  const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 1.5, budget));
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  const radius = parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue("--orbit-radius"),
  );
  if (!Number.isFinite(radius) || radius <= 0) return;

  const R = radius;
  const cx = w / 2;
  const cy = h / 2;
  const pal = FIELD_PALETTE;

  /**
   * EVERY LIGHT DIMENSION SCALES WITH THE ORBIT.
   *
   * `--orbit-radius` runs from 120 on a phone to 470 on a wide deck — near
   * four to one. The brushes, the core and the leak were all fixed pixel sizes,
   * which is correct for exactly one of those tiers: at 120 the halo was wider
   * than the gap between rings and the whole inner field collapsed into a
   * blown-out white core. Tying them to the radius keeps the field looking like
   * the same field at every size.
   *
   * Floored at 0.34 rather than falling to zero, because below about a pixel the
   * core stops being a thread and starts being noise.
   */
  const k = Math.min(1.1, Math.max(0.34, R / 420));

  /* --- 1. ATMOSPHERE. Largest, faintest, drawn first so everything else sits
           inside it. The layer the eye should register as a region of space
           before it identifies anything as a light. */
  if (FIELD.atmosphere > 0.001) {
    scatterPass(ctx, w, h, R, cx, cy, {
      rgb: pal.atmos,
      div: 9,
      brush: (8 + FIELD.reach * 13) * k,
      alpha: 0.05,
      gain: FIELD.atmosphere * 1.05,
    });
  }

  /* --- 2. NEAR HALO. Peaks about ten pixels off the thread and is gone within
           forty. Two falloffs at very different rates is what makes this read
           as scattering rather than as one glow.

           4.4, DOWN FROM 5.5, AND IT IS TIED TO `FIELD.rings`. The halo's width
           is what decides how much clear space a ring needs either side of it.
           When the band contracted to 0.22-1.55 the gap between rings fell from
           ~98px to ~64px at R=240, and a halo tuned for the wider spacing bled
           neighbours together — the exact failure the ring-count note in
           `orbit.data.ts` describes. Narrow this and the field tolerates more
           rings; widen it and it tolerates fewer. */
  if (FIELD.halo > 0.001) {
    scatterPass(ctx, w, h, R, cx, cy, {
      rgb: pal.halo,
      div: 3,
      brush: 4.4 * k,
      alpha: 0.07,
      gain: FIELD.halo * 2.2,
    });
  }

  /* --- 3. CORE, at full resolution. With the halo pass off this is the ring:
           every thread the eye sees is a chain of these stamps and nothing
           else. Smaller and harder than it was (3.1 -> 2.5), because a bead has
           to be a bead — at the old radius, adjacent stamps overlapped enough
           to fuse back into the continuous stroke the halo used to soften. */
  // 2.7 -> 1.15 -> 1.9. A bead is drawn at `brush.width * (0.42 + 0.62*dens) *
  // 0.5`, so the widest bead lands near 2px at this radius — the requested
  // stroke weight. The 1.15 it came from was sized for a dashed line, where a
  // thinner thread is what keeps the gaps legible; solid does not need that and
  // reads as a scratch at 1.2px.
  const corePx = 1.9 * k;
  const leakLen = FIELD.leak * 30 * k;
  const leakWide = Math.max(3, corePx * 2.1);
  const leak = leakLen > 2 ? makeLeak(pal.halo, leakWide, leakLen) : null;

  /**
   * BLOOM, AND WHY IT IS NOT `ctx.shadowBlur`.
   *
   * A shadow on the stroke is the obvious way to make these read as holographic
   * projections rather than as utility lines, and on a path it would be right.
   * This field is not a path — it is a chain of individually stamped points, and
   * a full repaint draws on the order of four thousand of them. `shadowBlur` is
   * evaluated PER DRAW CALL and is among the most expensive operations in Canvas
   * 2D; applying it here would multiply the cost of the entire field by roughly
   * the blur radius, to produce a glow around every bead including the ones too
   * dim to see.
   *
   * A second, wider, softer stamp under the bright beads only is the same effect
   * bought with an extra `drawImage` on the ~15% of points above the threshold.
   * It is also the better LOOK: a uniform glow along the thread is what turned
   * the rings back into a stroke with a soft edge last time the halo pass was
   * on. Blooming only the bright beads keeps the string-of-lights structure and
   * makes the lights in it shine.
   */
  const bloom = makeScatter(ACCENT, corePx * 5);

  /**
   * 0.72, NOT 0.62, AND THE GAIN IS 0.3 RATHER THAN 0.5.
   *
   * The first values blooming everything above 0.62 lit the gaps as well as the
   * beads, and the rings went back to reading as continuous strokes — which is
   * the exact thing removing the halo pass was meant to fix. Bloom and breaks
   * are in direct tension: every bit of glow spreads light into the dark
   * stretches that make the string of lights a string.
   *
   * The resolution is to bloom FEWER beads rather than to bloom them less. At
   * 0.72 only the peaks of the density function glow, which leaves the runs
   * between them dark and reads as a chain of bright points — where a lower
   * threshold at a lower gain just produces a uniformly hazy line.
   */
  // THE GLOW. A `box-shadow` with an inner and outer spread is what a CSS ring
  // would use; on a stamped canvas the equivalent is a wide soft brush laid under
  // the thread, which is what `bloom` is.
  //
  // 0.72 -> 0.12 is the threshold change that matters. The bloom used to be
  // reserved for the brightest few beads, so the rings had a lit crown on their
  // near arc and nothing anywhere else. Dropping the bar to 0.12 puts a halo
  // under almost the whole track, which is what "glowing" asks for; the gain
  // comes down 0.3 -> 0.16 to pay for it, so the total light added is similar and
  // it is spread along the ring instead of pooled at one end.
  const BLOOM_FROM = 0.12;
  const BLOOM_GAIN = 0.16;

  /**
   * ONE BRUSH FOR EVERY RING, and it is the only core brush left — the
   * palette-derived `core` it used to alternate with is gone with the second
   * colour. The innermost used to get its own brighter tint so
   * the field had a focal ring; with all seven now painted in the same faint
   * cyan, a brighter inner ring would read as an inconsistency rather than as
   * emphasis. Depth is carried by the near/far attenuation, which is 7:1 and
   * does the job on its own.
   */
  const accentCore = makeCore(ACCENT, corePx * 2);

  ctx.globalCompositeOperation = "lighter";

  for (const ring of FIELD_RINGS) {
    const brush = accentCore;
    // As in scatterPass: sample against the near arc's stretched length, or the
    // core thread breaks into dots exactly where the field is widest.
    const approx = (TAU * ring.base * R * 0.8) / planeDivisor(ring.base, -1);
    const steps = Math.max(120, Math.round(approx / (2.4 * k)));

    for (let i = 0; i < steps; i++) {
      const t = (i / steps) * TAU;
      const { a, lit, dens } = lightAt(ring, t);
      const r = radiusAt(ring, t) * R;
      const d = planeDivisor(ring.base, Math.cos(t));
      const x = cx + (r * Math.sin(t)) / d;
      const y = cy - (r * Math.cos(t) * FIELD_TILT) / d;
      if (x < -80 || x > w + 80 || y < -80 || y > h + 80) continue;

      if (leak && lit > 0.22) {
        const angle = Math.atan2(cy - y, cx - x) - Math.PI / 2;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.globalAlpha = clamp01(a * FIELD.core * 0.06 * lit);
        ctx.drawImage(leak, -leakWide / 2, 0, leakWide, leakLen * (0.45 + 0.55 * lit));
        ctx.restore();
      }

      // Bloom under the bright beads only, ramped in from the threshold so no
      // bead switches its glow on — a hard cut here would read as two kinds of
      // star rather than as one range of brightness.
      if (lit > BLOOM_FROM) {
        const bs = bloom.width * 0.5;
        ctx.globalAlpha = clamp01(a * BLOOM_GAIN * ((lit - BLOOM_FROM) / (1 - BLOOM_FROM)));
        ctx.drawImage(bloom, x - bs / 2, y - bs / 2, bs, bs);
      }

      const size = brush.width * (0.42 + 0.62 * dens) * 0.5;
      // The 0.8 trim came off with the halo. It existed to stop the core adding
      // to a glow that is no longer drawn.
      ctx.globalAlpha = clamp01(a * FIELD.core);
      ctx.drawImage(brush, x - size / 2, y - size / 2, size, size);
    }
  }

  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
}

export type { FieldRing };
