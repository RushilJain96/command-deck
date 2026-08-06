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
      <BodySurface body={body} />
    </motion.div>
  );
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
  const sx = Math.sin(rad);
  const sy = -Math.cos(rad);

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
      <BodySurface body={body} />
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
function BodySurface({ body }: { body: Body | PlaneBody }) {
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

  return (
    <>
      {/* Opaque backing: the body occludes the sky behind it. */}
      <div
        className="absolute inset-0 rounded-full"
        style={{ background: "var(--void)" }}
      />
      <div
        className="celestial relative h-full w-full rounded-full"
        style={{ background: body.albedo, opacity: body.opacity }}
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
