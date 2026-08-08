"use client";

import { useEffect, useRef } from "react";
import { motion, useAnimationFrame, useReducedMotion, useTransform } from "framer-motion";
import { useCamera } from "@/features/camera/CameraProvider";
import {
  BODIES,
  PLANE_BODIES,
  sunVector,
  type Body,
  type Crater,
  type PlaneBody,
  type Vec3,
} from "./celestial.data";
import { ORBIT_TILT, planeDivisor } from "@/features/missions/placement";
import { FIELD_RINGS } from "./orbit.data";

/**
 * The bodies in this region of space.
 *
 * Sixteen spheres, built from stacked CSS gradients — no canvas, no WebGL, no
 * filters. See `celestial.data.ts` for the layer model and for why each body
 * carries its own sun angle.
 *
 * NO REACT ON THE HOT PATH. Craters are painted by writing styles straight onto
 * a fixed set of DOM nodes, from inside an animation frame. React never
 * re-renders while anything turns, which is the same discipline the spacecraft's
 * attitude controller and the camera rig follow.
 */
export function Celestials() {
  return (
    <>
      {BODIES.map((body) => (
        <BodyView key={body.id} id={body.id} />
      ))}
    </>
  );
}

const DEG = Math.PI / 180;

/**
 * How often a turning body repaints, in milliseconds.
 *
 * These rotate at roughly 0.016 rad/s — four to seven minutes for a full turn.
 * At that rate a crater at the limb of the largest rotating body travels about
 * 0.6 px per second, so repainting eight times a second moves it less than a
 * tenth of a pixel per step. There is no visible difference from 60fps and it is
 * six times less work, which matters because painting a crater means rewriting a
 * gradient and that is a real repaint rather than a compositor nudge.
 */
const PAINT_INTERVAL = 125;

/**
 * Paints one set of surface features onto persistent nodes.
 *
 * The projection is the whole reason these read as spheres. A crater at
 * (lat, lon) sits at a point on a unit sphere; what lands on screen is that
 * point's x and y, and the crater's own circle is squashed ALONG THE RADIAL
 * DIRECTION by z — the cosine of the angle from the sub-observer point. That one
 * factor is the difference between a sphere and a sticker: features flatten and
 * crowd toward the limb exactly as they should.
 */
function paint(
  nodes: readonly HTMLElement[],
  features: readonly Crater[],
  spin: number,
  sun: Vec3,
  kind: "crater" | "spot",
) {
  const sunScreenAngle = Math.atan2(-sun.y, sun.x) / DEG;

  for (let i = 0; i < features.length; i++) {
    const node = nodes[i];
    if (!node) continue;
    const f = features[i];

    const lon = f.lon + spin;
    const cosLat = Math.cos(f.lat);
    const x = cosLat * Math.sin(lon);
    const y = Math.sin(f.lat);
    const z = cosLat * Math.cos(lon);

    // Behind the limb, or so close to it that the squash makes it a hairline.
    if (z <= 0.1) {
      node.style.display = "none";
      continue;
    }

    // How much sun this patch of ground actually receives.
    const lambert = x * sun.x + y * sun.y + z * sun.z;
    if (lambert < 0.02) {
      node.style.display = "none";
      continue;
    }

    const theta = Math.atan2(-y, x) / DEG;
    const size = f.r * 2;

    node.style.display = "";
    node.style.left = `${(50 + x * 50).toFixed(2)}%`;
    node.style.top = `${(50 - y * 50).toFixed(2)}%`;
    node.style.width = `${size.toFixed(2)}%`;
    node.style.height = `${size.toFixed(2)}%`;
    node.style.transform =
      `translate(-50%, -50%) rotate(${theta.toFixed(1)}deg) scaleX(${z.toFixed(3)})`;

    if (kind === "spot") {
      // Gas: a soft patch, no relief, fading out at its own edge.
      node.style.background =
        `radial-gradient(closest-side, rgb(0 0 0 / ${(0.26 * f.v).toFixed(3)}) 0%, ` +
        `rgb(0 0 0 / ${(0.12 * f.v).toFixed(3)}) 46%, transparent 100%)`;
      node.style.opacity = (0.45 + 0.55 * lambert).toFixed(3);
      continue;
    }

    // RELIEF HAS A FLOOR. Shadow length grows toward the terminator and goes to
    // nothing at zero phase, which is physically right and visually wrong: at
    // the sub-solar point every crater vanished and the body went smooth. Real
    // ground still has albedo variation with the sun overhead, so a quarter of
    // the contrast stays regardless of angle.
    const relief = (0.24 + 0.76 * Math.min(1, (1 - lambert) * 1.4)) * f.v;

    node.style.background =
      `linear-gradient(${(sunScreenAngle - theta).toFixed(1)}deg, ` +
      `rgb(0 0 0 / ${(0.62 * relief).toFixed(3)}) 0%, ` +
      `rgb(0 0 0 / ${(0.2 * relief).toFixed(3)}) 44%, ` +
      // A hair of light on the sun-facing wall — what turns a dark smudge into
      // a bowl with a raised rim.
      `rgb(214 230 255 / ${(0.13 * relief).toFixed(3)}) 76%, transparent 100%)`;
    node.style.opacity = (0.4 + 0.6 * lambert).toFixed(3);
  }
}

function BodyView({ id }: { id: string }) {
  const body = BODIES.find((candidate) => candidate.id === id)!;
  const camera = useCamera();

  const x = useTransform(camera.x, (value) => -value * body.parallax);
  const y = useTransform(camera.y, (value) => -value * body.parallax);

  return (
    <motion.div
      className="absolute"
      style={{ x, y, left: body.x, top: body.y, width: body.size, height: body.size }}
    >
      <BodySurface body={body} centre={backdropCentreDir(body)} />
    </motion.div>
  );
}

/**
 * Direction from a backdrop body toward the plane's centre, for the cyan rim.
 *
 * Uses the body's `x`/`y` — which are the box's CORNER, not its middle, and are
 * percentages of a layer inset past the viewport. Both of those make this an
 * approximation, and an approximation is the right amount of precision here: it
 * feeds a lighting DIRECTION on a disc, where being a few degrees off is not
 * visible, and computing it exactly would mean measuring the element.
 *
 * PLANE_CENTRE_Y is 42 rather than 50 because the plane's middle sits above the
 * viewport's — see DECK_BIAS and SHIP_STANDOFF in placement.ts.
 */
const PLANE_CENTRE_X = 50;
const PLANE_CENTRE_Y = 42;

function backdropCentreDir(body: Body): readonly [number, number] {
  const px = parseFloat(body.x);
  const py = parseFloat(body.y);
  if (Number.isNaN(px) || Number.isNaN(py)) return [0, -1];
  return [PLANE_CENTRE_X - px, PLANE_CENTRE_Y - py];
}

/**
 * A body sitting ON one of the field's rings, in world space.
 *
 * Positioned with the same `--orbit-radius` / `--orbit-tilt` arithmetic the
 * mission nodes use, so it holds its station on the ring at every viewport size
 * without a single measurement. `sin`/`-cos` are baked at module load.
 */
function PlaneBodyView({ id }: { id: string }) {
  const body = PLANE_BODIES.find((candidate) => candidate.id === id)!;
  const ring = FIELD_RINGS[Math.min(body.ring, FIELD_RINGS.length - 1)];
  const rad = (body.theta * Math.PI) / 180;
  // Through the same perspective divide the rings and the mission nodes use.
  // Skipping it here would park each body a few pixels off the very track it is
  // supposed to be riding — and the further out the ring, the further off.
  const d = planeDivisor(ring.base, Math.cos(rad));
  const sx = Math.sin(rad) / d;
  const sy = -Math.cos(rad) / d;

  return (
    <div
      className="absolute top-0 left-0"
      style={{
        width: body.size,
        height: body.size,
        transform:
          `translate(calc(var(--orbit-radius) * ${(ring.base * sx).toFixed(4)}), ` +
          `calc(var(--orbit-radius) * var(--orbit-tilt) * ${(ring.base * sy).toFixed(4)})) ` +
          "translate(-50%, -50%)",
      }}
    >
      {/* A ring body's direction to the centre is exact, not approximate: it is
          simply the negative of its own offset from that centre. */}
      <BodySurface body={body} centre={[-sx, -sy * ORBIT_TILT]} />
    </div>
  );
}

/**
 * The four-layer disc itself, with no opinion about where it sits.
 *
 * THE OPAQUE BACKING IS A BUG FIX, NOT A FLOURISH. Every body was translucent
 * all the way through, so the star field showed straight through the rock —
 * which is conceptually wrong in the most basic way a space scene can be. The
 * backing is filled with `--void`, so the disc blocks whatever is behind it
 * while the layers above keep the exact appearance they were tuned to (they were
 * compositing against black already).
 */
function BodySurface({
  body,
  centre,
}: {
  body: Body | PlaneBody;
  /**
   * Direction from this body toward the middle of the orbital plane, screen
   * space, y down. Need not be normalised — <BodySurface> does that. Callers
   * compute it because only they know where the body is: a backdrop body from
   * its viewport percentages, a ring body from its angle on the ring.
   */
  centre: readonly [number, number];
}) {
  const shouldReduceMotion = useReducedMotion();

  const craterHost = useRef<HTMLDivElement>(null);
  const spotHost = useRef<HTMLDivElement>(null);
  const elapsed = useRef(0);
  const lastPaint = useRef(0);

  const sun = sunVector(body.az, body.el);

  // Initial paint. Static bodies never touch the DOM again after this.
  useEffect(() => {
    if (body.craters && craterHost.current) {
      paint(childrenOf(craterHost.current), body.craters, 0, sun, "crater");
    }
    if (body.spots && spotHost.current) {
      paint(childrenOf(spotHost.current), body.spots, 0, sun, "spot");
    }
    // `sun` is derived from two constants on `body`, so this runs once.
  }, [body, sun]);

  useAnimationFrame((time, delta) => {
    if (body.spin === 0) return;
    // Reduced motion has to be handled HERE. <MotionConfig reducedMotion> only
    // reaches the declarative animate path, and this loop is not it.
    if (shouldReduceMotion) return;

    elapsed.current += Math.min(delta, 64) / 1000;
    if (time - lastPaint.current < PAINT_INTERVAL) return;
    lastPaint.current = time;

    const turn = elapsed.current * body.spin;
    if (body.craters && craterHost.current) {
      paint(childrenOf(craterHost.current), body.craters, turn, sun, "crater");
    }
    if (body.spots && spotHost.current) {
      paint(childrenOf(spotHost.current), body.spots, turn, sun, "spot");
    }
  });

  // The sub-solar point, projected onto the disc. Drives the terminator.
  const sx = (50 + sun.x * 42).toFixed(2);
  const sy = (50 - sun.y * 42).toFixed(2);
  // Anti-sun direction, normalised, for the backscatter rim.
  const h = Math.hypot(sun.x, sun.y) || 1;
  const nx = (-sun.x / h).toFixed(3);
  const ny = (sun.y / h).toFixed(3);

  // Direction from this body toward the middle of the orbital plane, where the
  // deck's cyan source sits. Screen space, y down.
  const cd = Math.hypot(centre[0], centre[1]) || 1;
  const cx = (centre[0] / cd).toFixed(3);
  const cy = (centre[1] / cd).toFixed(3);

  return (
    <>
      {/**
       * RING SYSTEM, BEFORE THE BACKING DISC.
       *
       * Drawn behind the body, which gets the FAR half of the ring right — it
       * passes behind the planet and is occluded — and the near half wrong, since
       * that should cross in front. Doing it properly means splitting the ellipse
       * and clipping each half, and at a 42px body with a 0.25-alpha ring the
       * difference is a few pixels nobody will ever resolve. What reads is the
       * ring extending either side of the disc, and that is correct here.
       *
       * Two ellipses rather than one: a real ring system has a gap in it, and the
       * gap is most of what stops it looking like a drawn circle.
       */}
      {body.rings && (
        <div
          className="absolute top-1/2 left-1/2"
          style={{
            width: `${body.rings.spread * 100}%`,
            height: `${body.rings.spread * 100}%`,
            transform: `translate(-50%, -50%) rotate(${body.rings.tilt}deg) scaleY(0.28)`,
          }}
        >
          <div
            className="absolute inset-0 rounded-full"
            style={{ border: `1px solid ${body.rings.color}` }}
          />
          <div
            className="absolute rounded-full"
            style={{
              inset: "16%",
              border: `1px solid ${body.rings.color}`,
              opacity: 0.6,
            }}
          />
        </div>
      )}

      {/* Opaque backing: the body occludes the sky behind it. */}
      <div
        className="absolute inset-0 rounded-full"
        style={{ background: "var(--void)" }}
      />
      <div
        className="celestial relative h-full w-full rounded-full"
        style={{
          background: body.albedo,
          opacity: body.opacity,
          // Atmospheric haze on the smallest bodies. On the disc rather than on
          // the wrapper, so the ring system above keeps its crisp edge.
          filter: body.blur ? `blur(${body.blur}px)` : undefined,
        }}
      >
        {body.bands && (
          <div className="celestial-layer overflow-hidden">
            {body.bands.map((band) => (
              <i
                key={band.y}
                className="absolute rounded-[50%]"
                style={{
                  left: "50%",
                  top: `${band.y}%`,
                  width: `${band.w}%`,
                  height: `${band.h}%`,
                  transform: "translate(-50%, -50%)",
                  background: `radial-gradient(closest-side, ${band.c} 0%, ${band.c} 42%, transparent 100%)`,
                }}
              />
            ))}
          </div>
        )}

        {body.spots && (
          <div ref={spotHost} className="celestial-layer overflow-hidden">
            {body.spots.map((_, index) => (
              <i key={index} className="absolute rounded-[50%]" />
            ))}
          </div>
        )}

        {body.craters && (
          <div ref={craterHost} className="celestial-layer overflow-hidden">
            {body.craters.map((_, index) => (
              <i key={index} className="absolute rounded-[50%]" />
            ))}
          </div>
        )}

        {/* SHADE — sub-solar falloff, terminator and limb darkening, above the
            surface so features genuinely go dark on the night side.

            Explicit gradient radii rather than `closest-side`: the sub-solar
            point travels to within a few percent of the limb, and `closest-side`
            measures from wherever the gradient is centred, so the falloff would
            shrink as the phase changed and the terminator would alter shape for
            no physical reason. */}
        <div
          className="celestial-layer"
          style={{
            background:
              `radial-gradient(ellipse 118% 118% at ${sx}% ${sy}%,` +
              "rgb(255 255 255 / 0.10) 0%," +
              "rgb(255 255 255 / 0.02) 15%," +
              "rgb(0 0 0 / 0) 30%," +
              "rgb(0 0 0 / 0.44) 52%," +
              "rgb(0 0 0 / 0.88) 72%," +
              "rgb(0 0 0 / 0.98) 92%)," +
              "radial-gradient(ellipse closest-side at 50% 50%, rgb(0 0 0 / 0) 62%, rgb(0 0 0 / 0.5) 100%)",
          }}
        />

        {/* BACKSCATTER — a hairline of light on the shadow limb. The single cue
            that separates a ball from a circle with a gradient on it. */}
        <div
          className="celestial-layer"
          style={{
            background:
              `radial-gradient(ellipse 58% 58% at calc(50% + ${nx} * 44%) calc(50% + ${ny} * 44%),` +
              `${body.rim} 0%, transparent 72%)`,
            maskImage:
              "radial-gradient(ellipse closest-side at 50% 50%, transparent 74%, #000 95%)",
            opacity: body.rimO,
          }}
        />

        {/**
         * CENTRE RIM — the plane's own light, caught on the inward-facing limb.
         *
         * Every other lighting layer on this body comes from its sun, and each
         * body carries its own sun angle as a phase. This one does not: it is
         * the cyan source at the middle of the orbital plane, which is the same
         * source for every body on the deck, so its direction is computed per
         * body from where that body sits relative to the centre.
         *
         * WHY IT IS WORTH HAVING. Before it, the bodies were the only objects on
         * the deck that did not know the plane was lit — they sat in a frame with
         * a cyan glow at its middle and were lit exclusively from somewhere else.
         * A dark limb facing a bright source is the kind of wrongness nobody
         * names and everybody registers.
         *
         * Masked to the outer band with the same closest-side ring the
         * backscatter uses, so it stays a LIMB and never becomes a wash across
         * the disc. It is additive on top of the shade, which means it lifts the
         * night side exactly where the plane would actually be lighting it.
         */}
        <div
          className="celestial-layer"
          style={{
            background:
              `radial-gradient(ellipse 62% 62% at calc(50% + ${cx} * 44%) calc(50% + ${cy} * 44%),` +
              `rgb(0 212 255 / 0.85) 0%, transparent 66%)`,
            // The band the crescent occupies. 58% rather than 70% makes it a
            // limb you can see rather than a hairline you have to look for —
            // at the sizes these bodies are now, a 4%-wide rim on a 40px disc
            // is one and a half pixels.
            maskImage:
              "radial-gradient(ellipse closest-side at 50% 50%, transparent 58%, #000 92%)",
            opacity: 0.9,
          }}
        />
      </div>
    </>
  );
}

/** The bodies riding the field's own rings. Rendered inside <PlaneSurface>. */
export function OrbitalBodies() {
  return (
    <>
      {PLANE_BODIES.map((body) => (
        <PlaneBodyView key={body.id} id={body.id} />
      ))}
    </>
  );
}

/** Typed view of a host's element children. */
function childrenOf(host: HTMLElement): HTMLElement[] {
  return Array.from(host.children) as HTMLElement[];
}

export type { Body };
