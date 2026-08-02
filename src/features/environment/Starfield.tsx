"use client";

import type { CSSProperties } from "react";
import { motion, useTransform } from "framer-motion";
import { useCamera } from "@/features/camera/CameraProvider";
import { PLANETS, SATELLITES, STAR_LAYERS } from "./starfield.data";

/**
 * Parallax star layers and distant bodies.
 *
 * MUST be a sibling of <CameraRig>, never a child. Inside the rig everything
 * here would move 1:1 with the camera, which is not parallax at all — it is
 * wallpaper glued to the world. Outside it, each layer echoes a fraction of the
 * camera's movement and the void gains real depth.
 *
 * Driven entirely by MotionValues, so panning the camera costs zero React
 * renders. Layers are oversized and offset so parallax never exposes an edge.
 */
export function Starfield() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {PLANETS.map((planet) => (
        <PlanetView key={planet.id} id={planet.id} />
      ))}
      {STAR_LAYERS.map((_, index) => (
        <StarLayerView key={index} layerIndex={index} />
      ))}
      {SATELLITES.map((satellite) => (
        <SatelliteView key={satellite.id} id={satellite.id} />
      ))}
    </div>
  );
}

/**
 * A distant craft, drawn as a handful of hairlines: bus, two solar wings, a
 * dish. At this size the silhouette is all that survives, so the shapes are
 * deliberately schematic rather than detailed.
 */
function SatelliteView({ id }: { id: string }) {
  const camera = useCamera();
  const satellite = SATELLITES.find((candidate) => candidate.id === id)!;

  const x = useTransform(camera.x, (value) => -value * satellite.parallax);
  const y = useTransform(camera.y, (value) => -value * satellite.parallax);

  return (
    <motion.div
      className="absolute"
      style={{ x, y, left: satellite.x, top: satellite.y, opacity: 0.34 }}
    >
      {satellite.downlink && <Downlink {...satellite.downlink} />}
      <svg
        width={38 * satellite.scale}
        height={16 * satellite.scale}
        viewBox="0 0 38 16"
        style={{ transform: `rotate(${satellite.tilt}deg)` }}
      >
        <g stroke="#9fb0c4" strokeWidth="0.8" fill="none">
          {/* Solar wings */}
          <rect x="0.5" y="4.5" width="12" height="7" />
          <rect x="25.5" y="4.5" width="12" height="7" />
          <path d="M 12.5 8 L 25.5 8" />
          {/* Bus */}
          <rect x="16.5" y="5" width="5" height="6" fill="#141a22" />
          {/* Dish */}
          <path d="M 19 5 L 19 2" />
          <path d="M 16.6 1.6 A 3 3 0 0 1 21.4 1.6" />
        </g>
      </svg>
    </motion.div>
  );
}

/**
 * A downlink from a satellite toward the deck.
 *
 * Two elements: a dashed hairline for the channel, and a single bright pip
 * travelling along it for the traffic. The pip is what does the storytelling —
 * a static dashed line is a diagram, whereas one thing moving along it once
 * every eleven seconds is a system in use. It has to stay near the threshold of
 * perception; at any brightness where you would consciously watch it, it
 * competes with the bearing vector, which is the one line on this deck that is
 * supposed to hold attention.
 *
 * Rotated from its origin so `bearing` follows the app-wide convention:
 * degrees clockwise from screen-up. The strip is drawn along +x and pre-rotated
 * -90deg to convert.
 */
function Downlink({ length, bearing }: { length: number; bearing: number }) {
  return (
    <div
      aria-hidden="true"
      className="absolute top-0 left-0 origin-top-left"
      style={{ transform: `rotate(${bearing - 90}deg)`, width: length, height: 1 }}
    >
      <div
        className="h-px w-full"
        style={{
          background:
            "repeating-linear-gradient(to right, rgb(159 176 196 / 0.30) 0 2px, transparent 2px 9px)",
          maskImage: "linear-gradient(to right, black, transparent 88%)",
        }}
      />
      <div
        className="comms-packet absolute top-0 left-0 h-px w-3 bg-[rgb(190_215_255/0.9)]"
        // Consumed by the keyframe, so the travel distance always matches the
        // line it is travelling along.
        style={{ "--comms-length": `${length}px` } as CSSProperties}
      />
    </div>
  );
}

function StarLayerView({ layerIndex }: { layerIndex: number }) {
  const camera = useCamera();
  const layer = STAR_LAYERS[layerIndex];

  const x = useTransform(camera.x, (value) => -value * layer.parallax);
  const y = useTransform(camera.y, (value) => -value * layer.parallax);

  return (
    <motion.div className="absolute -inset-[12%]" style={{ x, y }}>
      {/* The drift is an independent, extremely slow wander so the field is
          never perfectly static even when the camera is at rest. Separate
          element from the parallax transform so the two never fight over one
          `transform` channel. */}
      <svg
        className="star-drift h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
      >
        {layer.stars.map((star, index) => (
          <circle
            key={index}
            cx={star.x}
            cy={star.y}
            r={star.r * 0.1}
            fill={star.tint}
            opacity={star.o}
          />
        ))}
      </svg>
    </motion.div>
  );
}

function PlanetView({ id }: { id: string }) {
  const camera = useCamera();
  const planet = PLANETS.find((candidate) => candidate.id === id)!;

  const x = useTransform(camera.x, (value) => -value * planet.parallax);
  const y = useTransform(camera.y, (value) => -value * planet.parallax);

  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        x,
        y,
        left: planet.x,
        top: planet.y,
        width: planet.size,
        height: planet.size,
        opacity: planet.opacity,
        // Lit limb falling away to a dark terminator. The hard circular edge
        // does the work — a soft-edged gradient would just read as a glow.
        background: `radial-gradient(circle at ${planet.light}, ${planet.body} 0%, #0a0d13 62%, #06070a 100%)`,
        boxShadow: `inset 0 0 0 1px ${planet.rim}`,
      }}
    />
  );
}
