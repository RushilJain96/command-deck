"use client";

import type { CSSProperties, ReactNode } from "react";
import { motion, useTransform } from "framer-motion";
import { useCamera } from "@/features/camera/CameraProvider";
import { Celestials } from "./Celestials";
import {
  DUST,
  DUST_PARALLAX,
  STAR_LAYERS,
  STRUCTURES,
  type Structure,
} from "./starfield.data";

/**
 * The region of space the command centre operates in.
 *
 * MUST be a sibling of <CameraRig>, never a child. Inside the rig everything
 * here would move 1:1 with the camera, which is not parallax at all — it is
 * wallpaper glued to the world. Outside it, each object echoes a fraction of the
 * camera's movement and the void gains real depth.
 *
 * THE DEPTH LADDER IS CARRIED BY PARALLAX, NOT BY SIZE. Every layer in this file
 * moves by a different fraction of the camera, and that ordering is the whole
 * reason nothing looks pasted onto one plane:
 *
 *   0.03         the celestial body — effectively fixed, i.e. very far
 *   0.025-0.17   four star layers
 *   0.12-0.30    orbital infrastructure, nearer than every star
 *   (the rig)    the orbital plane, the callouts and the spacecraft
 *
 * Drawing order matters too, and it runs stars -> bodies -> hardware: a rock a
 * few hundred kilometres away occults the sky behind it, so it has to be painted
 * over the star field rather than under it.
 *
 * Driven entirely by MotionValues, so panning the camera costs zero React
 * renders. Layers are oversized and offset so parallax never exposes an edge.
 *
 * WHY EACH OBJECT IS HERE is recorded on the object itself in
 * `starfield.data.ts`. Nothing gets added to this scene without an answer.
 */
export function Starfield() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* STARS FIRST, BODIES OVER THEM.
          This order was inverted and the comment here claimed the opposite of
          what the code did: bodies were painted first, so the star field drew
          straight over every rock in the scene. A planet that you can see stars
          through is the most basic thing a space scene can get wrong. Paired
          with the opaque backing in <BodySurface>, a body now occults the sky
          behind it. */}
      {STAR_LAYERS.map((_, index) => (
        <StarLayerView key={index} layerIndex={index} />
      ))}
      {/* Dust sits between the star layers and the bodies: nearer than every
          star, further than the hardware. */}
      <DustField />
      <Celestials />
      {STRUCTURES.map((structure) => (
        <StructureView key={structure.id} id={structure.id} />
      ))}
    </div>
  );
}

/**
 * Cosmic dust: soft motes catching the plane's cyan source.
 *
 * EVERY MOTE IS A RADIAL GRADIENT, NOT A DISC WITH AN OPACITY. That is the whole
 * distinction between this layer and the stars — a 5px hard-edged circle at 0.09
 * opacity reads as a dim star, and a 5px one that fades to nothing at its rim
 * reads as matter. Stars are points that emit; these are specks that catch.
 *
 * The drift runs as a CSS animation with a per-mote duration and a NEGATIVE
 * delay, so the field is already scattered through its cycle on the first frame
 * rather than every mote starting from the same corner together. It is a CSS
 * keyframe, which means it is a third reduced-motion mechanism and has to be
 * switched off explicitly in globals.css — it is, alongside the others.
 */
function DustField() {
  const camera = useCamera();
  const x = useTransform(camera.x, (value) => -value * DUST_PARALLAX);
  const y = useTransform(camera.y, (value) => -value * DUST_PARALLAX);

  return (
    <motion.div className="absolute -inset-[12%]" style={{ x, y }}>
      {DUST.map((mote, index) => (
        <div
          key={index}
          className="dust-drift absolute rounded-full"
          style={{
            left: `${mote.x}%`,
            top: `${mote.y}%`,
            width: mote.d,
            height: mote.d,
            background: `radial-gradient(circle, rgb(${mote.tint} / ${mote.o}), transparent 70%)`,
            animationDuration: `${mote.dur}s`,
            animationDelay: `${mote.delay}s`,
          }}
        />
      ))}
    </motion.div>
  );
}

/** Shared parallax wrapper. Every object in the void moves through this. */
function Parallax({
  factor,
  left,
  top,
  opacity,
  children,
  className = "absolute",
  style,
}: {
  factor: number;
  left: string;
  top: string;
  opacity: number;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  const camera = useCamera();
  const x = useTransform(camera.x, (value) => -value * factor);
  const y = useTransform(camera.y, (value) => -value * factor);

  return (
    <motion.div className={className} style={{ x, y, left, top, opacity, ...style }}>
      {children}
    </motion.div>
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
      <div className="star-drift h-full w-full">
        {layer.stars.map((star, index) => (
          <div
            key={index}
            className="absolute rounded-full"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: star.d,
              height: star.d,
              background: `rgb(${star.tint})`,
              opacity: star.o,
              /**
               * POINT-SPREAD ON THE BRIGHTEST FEW ONLY. A hard-edged 3px disc
               * reads as a dot of paint; the same disc with a hair of falloff
               * reads as a source. Carried in the star's own colour, so a warm
               * star does not gain a white edge.
               *
               * THE RED ONES BLOOM HARDER — 3.4x their diameter at 0.5 against
               * 2.1x at 0.35. That is not favouritism, it is compensation: they
               * sit at a much lower luminance than a white star of the same
               * size, because two of their three channels are down. Matching
               * the white treatment left them as dim red dots at the exact
               * moment they were supposed to be the only warm light in a blue,
               * white and teal frame. Spread is the cheapest way to buy back
               * presence without touching their value or their size.
               */
              boxShadow: star.halo
                ? star.warm
                  ? `0 0 ${(star.d * 3.4).toFixed(1)}px rgb(${star.tint} / 0.5)`
                  : `0 0 ${(star.d * 2.1).toFixed(1)}px rgb(${star.tint} / 0.35)`
                : undefined,
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}

/**
 * ONE PIECE OF ORBITAL HARDWARE.
 *
 * ALL FIVE SHAPES FOLLOW ONE RULE: a dark filled silhouette, and a single lit
 * edge on the side facing the key light. Nothing is drawn as an outline.
 *
 * That rule is the whole difference between hardware and a wireframe. The
 * previous satellites were stroked rectangles, which at this size read as a
 * technical drawing pinned to the backdrop — an outline says "diagram", whereas
 * a solid mass with one bright edge says "metal object, lit from over there".
 * It also ties every structure to the same light as the planets, the hull and
 * the ship's floor shadow: everything in this scene agrees about where the sun
 * is, which is a thing nobody notices until it is wrong.
 *
 * No glow, no bloom, no lamps. A navigation beacon on a real orbit is a dark
 * object with a reflective edge far more often than it is a light in the sky.
 */
function StructureView({ id }: { id: string }) {
  const structure = STRUCTURES.find((candidate) => candidate.id === id)!;

  return (
    <Parallax
      factor={structure.parallax}
      left={structure.x}
      top={structure.y}
      opacity={structure.opacity}
    >
      {structure.downlink && <Downlink {...structure.downlink} />}
      <div style={{ transform: `rotate(${structure.tilt}deg) scale(${structure.scale})` }}>
        <Hardware kind={structure.kind} />
      </div>
    </Parallax>
  );
}

/** Silhouette body. Just above the void, so the shape reads as mass. */
const HULL = "#0a0e15";
/** The one lit edge. */
const LIT = "rgb(198 218 246 / 0.9)";
/** Structural members too thin to have a silhouette. */
const SPAR = "rgb(126 148 180 / 0.5)";

function Hardware({ kind }: { kind: Structure["kind"] }) {
  switch (kind) {
    /* COMMS RELAY — bus, two panel wings, a dish pointed back at the deck. */
    case "relay":
      return (
        <svg width={42} height={20} viewBox="0 0 42 20" fill="none">
          <rect x="1" y="6" width="13" height="9" fill={HULL} />
          <rect x="28" y="6" width="13" height="9" fill={HULL} />
          <path d="M1 6 H14 M28 6 H41" stroke={LIT} strokeWidth="0.9" />
          <path d="M14 10.5 H28" stroke={SPAR} strokeWidth="0.8" />
          <rect x="18" y="7" width="6" height="8" fill={HULL} />
          <path d="M18 7 H24" stroke={LIT} strokeWidth="1" />
          {/* Dish */}
          <path d="M21 7 V3.4" stroke={SPAR} strokeWidth="0.8" />
          <path d="M17.6 3.6 A 3.6 3.6 0 0 1 24.4 3.6 Z" fill={HULL} />
          <path d="M17.6 3.6 A 3.6 3.6 0 0 1 24.4 3.6" stroke={LIT} strokeWidth="0.9" />
        </svg>
      );

    /* NAVIGATION BEACON — a mast with an instrument box and two fins. */
    case "beacon":
      return (
        <svg width={14} height={32} viewBox="0 0 14 32" fill="none">
          <rect x="6.1" y="3" width="1.8" height="26" fill={HULL} />
          <path d="M7.9 3 V29" stroke={LIT} strokeWidth="0.8" />
          <rect x="3.4" y="11" width="7.2" height="6" fill={HULL} />
          <path d="M10.6 11 V17 M3.4 11 H10.6" stroke={LIT} strokeWidth="0.9" />
          <path d="M3.4 21 H1 M10.6 21 H13" stroke={SPAR} strokeWidth="0.8" />
          <rect x="5.6" y="0.6" width="2.8" height="2.6" fill={HULL} />
          <path d="M8.4 0.6 V3.2" stroke={LIT} strokeWidth="0.8" />
        </svg>
      );

    /* POWER ARRAY — two flat panels on a boom. */
    case "array":
      return (
        <svg width={46} height={22} viewBox="0 0 46 22" fill="none">
          <rect x="1" y="3" width="17" height="16" fill={HULL} />
          <rect x="28" y="3" width="17" height="16" fill={HULL} />
          <path d="M1 3 H18 M28 3 H45" stroke={LIT} strokeWidth="0.9" />
          {/* Panel divisions: the only internal detail, and it is what makes a
              rectangle read as a photovoltaic wing rather than as a card. */}
          <path
            d="M6.7 3 V19 M12.4 3 V19 M33.7 3 V19 M39.4 3 V19"
            stroke="rgb(126 148 180 / 0.22)"
            strokeWidth="0.6"
          />
          <path d="M18 11 H28" stroke={SPAR} strokeWidth="0.9" />
          <rect x="21" y="9" width="4" height="4" fill={HULL} />
          <path d="M21 9 H25" stroke={LIT} strokeWidth="0.8" />
        </svg>
      );

    /* DOCKING TRUSS — a lattice spine with a berth at each end. */
    case "truss":
      return (
        <svg width={48} height={16} viewBox="0 0 48 16" fill="none">
          <path d="M4 5 H44" stroke={LIT} strokeWidth="0.9" />
          <path d="M4 11 H44" stroke={SPAR} strokeWidth="0.8" />
          <path
            d="M4 5 L11 11 L18 5 L25 11 L32 5 L39 11 L44 5"
            stroke={SPAR}
            strokeWidth="0.7"
          />
          <rect x="0.6" y="3" width="4" height="10" fill={HULL} />
          <rect x="43.4" y="3" width="4" height="10" fill={HULL} />
          <path d="M0.6 3 H4.6 M43.4 3 H47.4" stroke={LIT} strokeWidth="0.9" />
        </svg>
      );

    /* DERELICT — broken, unpowered, tumbling. The only object out here with no
       working surface: its lit edge is a fragment, not a line, because half the
       structure that used to carry it is gone. */
    case "hulk":
      return (
        <svg width={32} height={22} viewBox="0 0 32 22" fill="none">
          <path d="M5 8 L14 4 L23 6 L26 12 L19 18 L8 17 Z" fill={HULL} />
          <path d="M5 8 L14 4 L23 6" stroke="rgb(198 218 246 / 0.55)" strokeWidth="0.8" />
          <path d="M23 6 L30 3" stroke={SPAR} strokeWidth="0.7" />
          <path d="M8 17 L3 20" stroke={SPAR} strokeWidth="0.6" />
          <path d="M14 4 L16 11 L19 18" stroke="rgb(126 148 180 / 0.2)" strokeWidth="0.6" />
        </svg>
      );
  }
}

/**
 * A downlink from the primary relay toward the deck.
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
