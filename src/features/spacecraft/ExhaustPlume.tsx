"use client";

import { motion, type MotionValue } from "framer-motion";

/**
 * The engine exhaust, built as stacked emission layers rather than one glow.
 *
 * A single radial gradient cannot look like combustion, because real exhaust is
 * not one colour fading out — it is a temperature gradient. The core is hot
 * enough to read as white, it cools to orange through the plasma, and only the
 * outermost, coolest, most diffuse part is red. Painting the whole thing one hue
 * and varying the alpha produces a red smear that reads as a decal stuck behind
 * the ship. Five layers, hottest and tightest at the nozzle, coolest and widest
 * behind:
 *
 *   1. HULL SPILL      light thrown FORWARD onto the ship's own underside
 *   2. ATMOSPHERIC     the widest, faintest bloom — sells scale
 *   3. DEEP RED        the cooled outer envelope
 *   4. ORANGE PLASMA   the body of the flame
 *   5. WHITE CORE      the throat itself, small and very bright
 *
 * ON THE PALETTE RULE: `--signal` red is reserved for the operator's current
 * target and nothing else. This is the one sanctioned exception, and it is not
 * really an exception — an engine is a physical light source, not a status
 * colour, and it reads as one precisely because it is not flat red. The white
 * and orange are what keep it from being confused with a target highlight.
 *
 * Drawn in hull coordinates (the same 152-unit viewBox as the frames) so the
 * nozzle positions hold at any rendered ship size.
 */
export function ExhaustPlume({
  rotation,
  engaged,
  size,
}: {
  /** Lagged heading — the exhaust trails the hull. */
  rotation: MotionValue<number>;
  engaged: boolean;
  /** Rendered size in px, matching the hull. */
  size: number;
}) {
  // The three nozzles, in hull coordinates. Matches the rendered frames.
  const nozzles = [-11.5, 0, 11.5];

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none absolute top-0 left-0 origin-top-left"
      style={{ rotate: rotation }}
    >
      <svg
        width={size}
        height={size}
        viewBox="-76 -76 152 152"
        className="deck-md:scale-75 deck-sm:scale-50 absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 overflow-visible"
      >
        <defs>
          {/* Each stop set is a temperature, not a brand colour. */}
          <radialGradient id="plume-atmos">
            <stop offset="0" stopColor="#ff5a3c" stopOpacity="0.30" />
            <stop offset="0.45" stopColor="#e0301c" stopOpacity="0.12" />
            <stop offset="1" stopColor="#c0180c" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="plume-red">
            <stop offset="0" stopColor="#ff6a2a" stopOpacity="0.85" />
            <stop offset="0.5" stopColor="#f0331a" stopOpacity="0.36" />
            <stop offset="1" stopColor="#b81608" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="plume-orange">
            <stop offset="0" stopColor="#ffd9a0" stopOpacity="0.95" />
            <stop offset="0.4" stopColor="#ff9436" stopOpacity="0.7" />
            <stop offset="1" stopColor="#ff5518" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="plume-core">
            <stop offset="0" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="0.35" stopColor="#fff3d6" stopOpacity="0.9" />
            <stop offset="1" stopColor="#ffb15a" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="plume-spill">
            <stop offset="0" stopColor="#ff8a4a" stopOpacity="0.5" />
            <stop offset="1" stopColor="#ff4a20" stopOpacity="0" />
          </radialGradient>
          {/* Secondary halo: sits between the outer bloom and the flame. Two
              nested falloffs read as depth in the glow; one reads as a
              gradient. */}
          <radialGradient id="plume-halo">
            <stop offset="0" stopColor="#ffa055" stopOpacity="0.5" />
            <stop offset="0.55" stopColor="#ff5a22" stopOpacity="0.2" />
            <stop offset="1" stopColor="#e02a10" stopOpacity="0" />
          </radialGradient>
          {/* The cone runs hot at the throat and cools along its length, so this
              one is a LINEAR gradient — the temperature varies with distance
              travelled, not with distance from a centre. */}
          <linearGradient id="plume-cone" x1="0" y1="26" x2="0" y2="108" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#fff0cf" stopOpacity="0.75" />
            <stop offset="0.25" stopColor="#ff9a3c" stopOpacity="0.5" />
            <stop offset="0.65" stopColor="#f0451c" stopOpacity="0.2" />
            <stop offset="1" stopColor="#c01808" stopOpacity="0" />
          </linearGradient>
          {/* HEAT DISTORTION. Fractal noise displacing the cone's edges, which
              is what exhaust actually does to everything seen through it. Scoped
              to this one element and given an explicit small filter region —
              a displacement map over a large area is genuinely expensive, and
              the effect is only legible at the flame's boundary anyway. */}
          <filter id="plume-shimmer" x="-40%" y="-10%" width="180%" height="130%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.055"
              numOctaves="2"
              seed="7"
              result="noise"
            />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="7" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>

        {/* 1. Hull spill — thrown FORWARD, up onto the ship's underside. This is
               the layer that stops the plume reading as a sticker: light that
               comes from somewhere has to land on something. */}
        <ellipse
          cx="0"
          cy="26"
          rx={engaged ? 34 : 27}
          ry={engaged ? 25 : 19}
          fill="url(#plume-spill)"
          className="transition-all duration-700 ease-out"
          style={{ opacity: engaged ? 0.8 : 0.45 }}
        />

        {/* 2a. Outer bloom — the widest, faintest thing on the deck after the
               starfield. This is what makes the engines read as a LIGHT SOURCE
               rather than a painted shape: bright sources scatter into the
               medium around them, and the scatter is always far larger than the
               source itself. Deliberately enormous and almost invisible. */}
        <ellipse
          cx="0"
          cy={engaged ? 74 : 58}
          rx={engaged ? 62 : 40}
          ry={engaged ? 88 : 54}
          fill="url(#plume-atmos)"
          className="transition-all duration-700 ease-out"
          style={{ opacity: engaged ? 0.9 : 0.5 }}
        />

        {/* 2b. Secondary halo, tighter and warmer. */}
        <ellipse
          cx="0"
          cy={engaged ? 58 : 48}
          rx={engaged ? 34 : 23}
          ry={engaged ? 54 : 33}
          fill="url(#plume-halo)"
          className="transition-all duration-700 ease-out"
        />

        {/* 2c. Volumetric cone — the flame's body, drawn as a widening polygon
               rather than an ellipse. Exhaust EXPANDS as it leaves the nozzle
               and loses pressure; an ellipse is symmetric and reads as a blob
               floating behind the ship, whereas a cone anchored at the throats
               reads as something being expelled. Carries the heat shimmer. */}
        <polygon
          points={engaged ? "-15,30 15,30 36,108 -36,108" : "-12,28 12,28 24,74 -24,74"}
          fill="url(#plume-cone)"
          filter="url(#plume-shimmer)"
          className="plume-shimmer transition-all duration-700 ease-out"
          style={{ opacity: engaged ? 0.7 : 0.4 }}
        />

        {/* 3. Deep red envelope — the cooled outer flame. */}
        <ellipse
          cx="0"
          cy={engaged ? 54 : 44}
          rx={engaged ? 22 : 15}
          ry={engaged ? 44 : 27}
          fill="url(#plume-red)"
          className="transition-all duration-700 ease-out"
        />

        {/* 4 + 5. Per-nozzle plasma and core. Drawn per engine rather than as
               one shared blob, because three distinct throats is the single
               clearest read of "this thing has three engines". */}
        {nozzles.map((cx) => (
          <g key={cx}>
            <ellipse
              cx={cx}
              cy={engaged ? 40 : 33}
              rx={engaged ? 6.4 : 4.6}
              ry={engaged ? 26 : 15}
              fill="url(#plume-orange)"
              className="transition-all duration-700 ease-out"
            />
            <ellipse
              cx={cx}
              cy={engaged ? 27 : 24}
              rx={engaged ? 4.1 : 3.0}
              ry={engaged ? 14 : 8.5}
              fill="url(#plume-core)"
              className="transition-all duration-700 ease-out"
            />
          </g>
        ))}
      </svg>
    </motion.div>
  );
}
