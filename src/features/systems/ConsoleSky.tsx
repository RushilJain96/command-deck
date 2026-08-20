import type { CSSProperties } from "react";

/**
 * The console's own sky.
 *
 * WHY THE SCENE PAINTS ITS OWN INSTEAD OF LETTING THE DECK'S SHOW THROUGH.
 * <DeckBackdrop> renders the real starfield full-window, behind the scaled frame,
 * and it is driven by the camera — parallax layers, drift, scatter tuned for a
 * composition with a spacecraft in it. Under a console of four large panels that
 * density reads as noise behind text, and the console cannot turn it down without
 * turning it down on the Command Deck too, which is not this scene's to change.
 *
 * So the scene covers the deck's sky with an opaque ground and puts a QUIETER one
 * on top: the same idea at maybe a fifth of the density, with no parallax and no
 * camera coupling. This replaced a dot grid, which was the wrong instinct — a
 * ruled texture makes the panel edges read as part of a lattice, and the whole
 * point of this deck is that the panels are objects in space.
 *
 * THE POSITIONS ARE SEEDED, NOT RANDOM, and that is load-bearing rather than
 * fussy. `Math.random()` in a component body produces different markup on the
 * server and the client, which React reports as a hydration mismatch and then
 * re-renders around. A seeded generator run once at module load gives one fixed
 * sky that both halves agree on, and it also means the field is stable across
 * scene transitions instead of reshuffling every time the console is entered.
 */

/** mulberry32 — small, fast, and identical on both sides of hydration. */
function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Star {
  readonly x: number;
  readonly y: number;
  readonly size: number;
  readonly opacity: number;
  /** Only a handful twinkle. See the note on the count. */
  readonly delay: number | null;
}

/**
 * 84 STARS, AND THE NUMBER IS THE WHOLE DESIGN.
 *
 * The brief was "small shining stars, don't overload it", and the failure mode of a
 * starfield behind an interface is not that it looks bad — it is that it competes
 * with 11px type. At this count the field averages roughly one star per 18,000
 * square units, so any given panel has a handful behind it rather than a texture.
 *
 * Most are a single unit across at a quarter opacity: present when you look for
 * them, invisible when you are reading. Twelve are larger and brighter, and only
 * those twelve twinkle — an entire field breathing at once reads as a screensaver,
 * where a few points drifting in and out reads as depth.
 */
const STAR_COUNT = 84;
const BRIGHT_COUNT = 12;

const STARS: readonly Star[] = (() => {
  const random = seeded(0x5c0e5);
  return Array.from({ length: STAR_COUNT }, (_, index) => {
    const bright = index < BRIGHT_COUNT;
    return {
      x: random() * 100,
      y: random() * 100,
      size: bright ? 1.6 + random() * 0.9 : 1,
      opacity: bright ? 0.5 + random() * 0.35 : 0.16 + random() * 0.16,
      delay: bright ? -random() * 7 : null,
    };
  });
})();

export function ConsoleSky() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* THE GROUND. Opaque, because it is what covers the deck's own sky — see the
          note above. Deep navy rather than the deck's `--void` #000: the console is
          an instrument face rather than open space, and a hair of blue is what lets
          the panels above it read as sitting ON something. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(96% 62% at 50% -6%, #0b111c 0%, #070b13 44%, #04060b 100%)",
        }}
      />

      {/* ATMOSPHERE. Two very soft washes, cool and off-axis, at an alpha where
          neither is nameable as a shape — they exist to keep the ground from being
          one flat value, which is what makes a dark screen look like a switched-off
          one. Deliberately NOT centred on anything: a symmetrical glow behind an
          asymmetric layout reads as a vignette. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(46% 38% at 18% 8%, rgb(90 130 200 / 0.10), transparent 70%)," +
            "radial-gradient(42% 44% at 88% 78%, rgb(140 110 210 / 0.08), transparent 72%)",
        }}
      />

      {STARS.map((star, index) => (
        <span
          key={index}
          className={star.delay === null ? undefined : "deck-respire"}
          style={
            {
              position: "absolute",
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              borderRadius: "50%",
              background: "#dce6f2",
              opacity: star.opacity,
              // The bright ones carry a halo so they read as points of light rather
              // than as specks of dust. `box-shadow` rather than a blur filter:
              // eighty-four filtered elements is eighty-four offscreen buffers.
              boxShadow: star.delay === null ? undefined : `0 0 4px 1px rgb(220 230 242 / 0.35)`,
              // Negative delay so the field is already mid-cycle on the first frame
              // and no two are ever in step — the same trick the deck's dust uses.
              animationDelay: star.delay === null ? undefined : `${star.delay}s`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
