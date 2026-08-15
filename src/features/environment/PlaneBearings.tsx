"use client";

import { motion } from "framer-motion";
import { ARRIVAL } from "@/features/scenes/arrival";

/**
 * Cardinal markers lying ON the orbital plane.
 *
 * WHAT THEY ARE FOR. A ring system with nothing written on it is a pattern; the
 * moment two letters sit on the surface at opposite edges, the same rings read as
 * a SPACE with an orientation, and the plane stops being decoration behind the
 * cards and becomes the floor they are arranged over. This is the cheapest
 * grounding cue on the deck — two glyphs — and it is doing structural work.
 *
 * E ON THE LEFT AND W ON THE RIGHT, WHICH IS THE REVERSE OF A MAP. On a chart
 * seen from above with north up, east is right. These are painted on a floor
 * being looked ACROSS from behind — the observer is inside the system rather
 * than above it — so the compass is mirrored exactly the way the markings on a
 * runway or a HUD's heading tape are relative to a map. It matches the reference
 * and it is internally consistent; the note is here because it looks like a bug
 * on first read and someone will eventually try to "fix" it.
 *
 * THEY MUST NOT BE ROTATED FLAT INTO THE PLANE. The obvious move is a 3D
 * transform so the letters lie on the surface in perspective, and it is wrong
 * here for the same reason the whole deck is 2.5D rather than WebGL: this scene
 * has no shared 3D space, so one element with a real `rotateX` disagrees with
 * every projected element around it. A `skewX` is enough — it borrows the
 * plane's shear without claiming a depth axis nothing else has.
 *
 * Sized in --orbit-radius so they sit at a fixed station on the plane rather
 * than at a fixed pixel offset, which would slide across the rings on resize.
 */

/**
 * Fraction of --orbit-radius out from the plane's centre.
 *
 * 1.42 PUT BOTH LETTERS UNDER THE SIDEBARS. That value sat them just inside the
 * field's outer ring, which is where they belong on the PLANE — and at R=466 it
 * placed E at x=139 against a HUD rail whose right edge is 228, and W at 1461
 * against a cluster starting at 1372. Neither was ever visible; they were
 * rendering perfectly, off behind the chrome.
 *
 * 1.05 is the widest station that still clears both at the largest radius the
 * deck reaches (470): 470 * 1.05 = 494px from centre, landing at 306 and 1294
 * inside a clear band of 240..1360. The letters sit further in from the rim than
 * a compass rose would, and that is the trade — a marker nobody can see is not a
 * subtler marker.
 */
const BEARING_REACH = 1.05;

const MARKERS = [
  { label: "E", x: -BEARING_REACH, skew: 10 },
  { label: "W", x: BEARING_REACH, skew: -10 },
] as const;

export function PlaneBearings() {
  return (
    <motion.div
      aria-hidden="true"
      className="absolute top-0 left-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.4, delay: ARRIVAL.field + 0.5, ease: "easeOut" }}
    >
      {MARKERS.map(({ label, x, skew }) => (
        <span
          key={label}
          className="absolute top-0 left-0 font-mono leading-none select-none"
          style={{
            // The vertical term is tilt-squashed like everything else on the
            // plane, so the pair sits on the surface rather than floating above
            // it. They ride the plane's own horizontal axis, hence y = 0.
            transform:
              `translate(calc(var(--orbit-radius) * ${x}), 0)` +
              ` translate(-50%, -50%) skewX(${skew}deg)`,
            fontSize: "calc(var(--orbit-radius) * 0.068)",
            letterSpacing: "0.2em",
            color: "rgb(0 212 255 / 0.4)",
            // A glyph painted on a lit floor catches that light. Without the
            // bloom it reads as a label ON THE GLASS in front of the scene,
            // which is precisely the thing these exist to counteract.
            textShadow: "0 0 18px rgb(0 212 255 / 0.45)",
          }}
        >
          {label}
        </span>
      ))}
    </motion.div>
  );
}
