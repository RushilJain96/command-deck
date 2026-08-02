import { SHIP_PIXELS } from "./shipFrames";

/**
 * The spacecraft — the hero object of the entire deck.
 *
 * Everything else on screen is annotation; this is the vehicle the visitor is
 * flying. It is drawn large and with real internal structure so the eye lands
 * here first and treats the mission panels as things it is pointing AT. The
 * rendered size is SHIP_PIXELS against a 152-unit viewBox, i.e. the drawing is scaled
 * up ~1.68x — the camera sits close behind the vehicle, and at any smaller size
 * the hull reads as a marker on a map rather than as the thing carrying the
 * camera.
 *
 * Construction is engineering-drawing language rather than illustration: a
 * central fuselage with a hard chine, swept wings with visible spars, twin
 * nacelles, and panel seams that imply the thing is fabricated from parts. The
 * silhouette has to survive at 128px on a phone, so every shape is a straight
 * edge — no soft blobs that turn to mush when scaled down.
 *
 * LIGHTING. Key light from the UPPER RIGHT, matching the distant bodies in
 * `starfield.data.ts` and the floor shadow in <Spacecraft>. Three rules hold
 * the form together, and they are the difference between a lit object and a
 * bright one:
 *
 *   1. The hull gradient FALLS OFF hard toward the tail. A gradient that stays
 *      pale to the bottom edge is fill light, and fill light flattens.
 *   2. The port flank is a genuinely dark plane, not a tint. The fold down the
 *      chine is the only thing telling the eye the fuselage has two faces.
 *   3. The outline is TWO strokes, not one: a bright starboard edge catching
 *      the key and a dark port edge falling away. A uniform outline reads as a
 *      sticker, however good the fill underneath is.
 *
 * Authored NOSE-UP (pointing at -y) so a heading can drive `rotate` directly
 * with no offset constant. If you redraw this, keep the nose on -y.
 *
 * Decorative: the accessible name for targeting lives on the mission buttons
 * and the live region, so this is hidden from assistive tech entirely.
 */
export function ShipGeometry({ engaged }: { engaged: boolean }) {
  return (
    <svg
      width={SHIP_PIXELS}
      height={SHIP_PIXELS}
      viewBox="-76 -76 152 152"
      aria-hidden="true"
      focusable="false"
      className="deck-md:scale-75 deck-sm:scale-50 overflow-visible transition-transform duration-700"
    >
      <defs>
        {/* Nose-to-tail falloff. The tail stop is deliberately dark: the key
            light rakes across the top of the hull, so the far end of the form
            has to lose it. */}
        <linearGradient id="ship-hull" x1="0" y1="-58" x2="0" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#f7f9fb" />
          <stop offset="0.42" stopColor="#c9d1da" />
          <stop offset="1" stopColor="#767f8a" />
        </linearGradient>
        {/* Port flank, in shadow. Runs dark-to-less-dark toward the chine so the
            fold catches a little bounce rather than being a flat grey wall. */}
        <linearGradient id="ship-shade" x1="-22" y1="0" x2="6" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#232931" />
          <stop offset="1" stopColor="#5c646f" />
        </linearGradient>
        <linearGradient id="ship-wing" x1="0" y1="-4" x2="0" y2="34" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#333b45" />
          <stop offset="1" stopColor="#161b21" />
        </linearGradient>
      </defs>

      {/* Engine light cast BACK onto the hull's underside. Light has to come
          from somewhere: without this the plume reads as a decal behind the
          ship rather than as a source illuminating it. */}
      <path
        d="M -17 10 L 17 10 L 13 38 L -13 38 Z"
        fill="var(--signal)"
        className="transition-opacity duration-700"
        style={{ opacity: engaged ? 0.3 : 0.12 }}
      />

      {/* ---- Wings: spar, skin, tip light ---- */}
      <g>
        <path d="M -9 -2 L -46 30 L -34 40 L -9 30 Z" fill="url(#ship-wing)" />
        <path d="M 9 -2 L 46 30 L 34 40 L 9 30 Z" fill="url(#ship-wing)" />
        {/* Leading edges. Starboard catches the key; port only picks up bounce,
            so the two are drawn at different weights and values. */}
        <path d="M 9 -2 L 46 30" stroke="#a9b3bf" strokeWidth="1.2" fill="none" />
        <path d="M -9 -2 L -46 30" stroke="#525a65" strokeWidth="0.9" fill="none" />
        {/* Structural spars */}
        <path d="M -14 8 L -33 30" stroke="#414852" strokeWidth="0.7" opacity="0.8" />
        <path d="M 14 8 L 33 30" stroke="#616974" strokeWidth="0.7" opacity="0.8" />
        {/* Navigation lights: port red, starboard green — real convention. */}
        <circle cx="-42" cy="31" r="1.8" fill="var(--signal)" opacity="0.85" />
        <circle cx="42" cy="31" r="1.8" fill="var(--nominal)" opacity="0.85" />
      </g>

      {/* ---- Fuselage ---- */}
      <path d="M 0 -58 L 17 10 L 13 38 L -13 38 L -17 10 Z" fill="url(#ship-hull)" />
      {/* Port flank in shadow, at near-full strength. This is the fold that
          gives the hull two faces instead of one gradient. */}
      <path d="M 0 -58 L 0 38 L -13 38 L -17 10 Z" fill="url(#ship-shade)" opacity="0.94" />
      {/* Chine — the hard edge that reads as a machined fold, lit along its
          length because it is the highest point of the form. */}
      <path d="M 0 -58 L 0 38" stroke="#aeb7c2" strokeWidth="0.9" opacity="0.85" />
      {/* Split outline: bright to starboard, dark to port. */}
      <path d="M 0 -58 L 17 10 L 13 38" fill="none" stroke="#c2cad4" strokeWidth="1" />
      <path d="M 0 -58 L -17 10 L -13 38" fill="none" stroke="#3d444d" strokeWidth="1" />
      <path d="M -13 38 L 13 38" fill="none" stroke="#5b636d" strokeWidth="0.8" />

      {/* Panel seams. Fainter on the shadowed flank — a seam is only visible
          where there is light to interrupt. */}
      <path d="M 0.6 -12 L 12.4 -12" stroke="#8b939e" strokeWidth="0.55" opacity="0.8" />
      <path d="M -12.4 -12 L -0.6 -12" stroke="#4a515a" strokeWidth="0.55" opacity="0.7" />
      <path d="M 0.6 4 L 15.5 4" stroke="#8b939e" strokeWidth="0.55" opacity="0.8" />
      <path d="M -15.5 4 L -0.6 4" stroke="#4a515a" strokeWidth="0.55" opacity="0.7" />
      <path d="M 0.6 22 L 16 22" stroke="#7a828c" strokeWidth="0.55" opacity="0.65" />
      <path d="M -16 22 L -0.6 22" stroke="#434a53" strokeWidth="0.55" opacity="0.6" />

      {/* Canopy */}
      <path d="M 0 -48 L 6.5 -20 L 0 -13 L -6.5 -20 Z" fill="#070a0e" />
      <path d="M 0 -48 L 6.5 -20 L 0 -13" fill="none" stroke="#b6bfca" strokeWidth="0.8" />
      <path d="M 0 -48 L -6.5 -20 L 0 -13" fill="none" stroke="#4d545e" strokeWidth="0.7" />
      {/* Glint on the canopy: sells it as glass rather than a hole. On the lit
          side, because that is where a reflection of the key would fall. */}
      <path d="M 1.6 -41 L 4.4 -25" stroke="#8fa4b8" strokeWidth="1.4" opacity="0.6" />

      {/* Dorsal intakes */}
      <path d="M -11 -4 L -7 -4 L -6 12 L -10 12 Z" fill="#12161c" />
      <path d="M 11 -4 L 7 -4 L 6 12 L 10 12 Z" fill="#1d232a" />

      {/* ---- Nacelles ---- */}
      <g>
        <rect x="-14.5" y="34" width="10" height="11" rx="1.4" fill="#1b2128" stroke="#3c434c" strokeWidth="0.7" />
        <rect x="4.5" y="34" width="10" height="11" rx="1.4" fill="#252c34" stroke="#5b636d" strokeWidth="0.7" />
        {/* Throat glow, brighter under thrust. */}
        <rect
          x="-13.5"
          y="41"
          width="8"
          height="3.4"
          rx="1.2"
          fill="var(--signal)"
          className="transition-opacity duration-700"
          style={{ opacity: engaged ? 1 : 0.5 }}
        />
        <rect
          x="5.5"
          y="41"
          width="8"
          height="3.4"
          rx="1.2"
          fill="var(--signal)"
          className="transition-opacity duration-700"
          style={{ opacity: engaged ? 1 : 0.5 }}
        />
      </g>

      {/* Nose sensor + targeting reticle. The reticle only appears under lock,
          which is what visually connects the ship to the bearing vector. */}
      <circle cx="0" cy="-53" r="2" fill="var(--signal)" />
      <g
        className="transition-opacity duration-500"
        style={{ opacity: engaged ? 0.9 : 0 }}
        stroke="var(--signal)"
        strokeWidth="1"
        fill="none"
      >
        <circle cx="0" cy="-64" r="6" opacity="0.55" />
        <path d="M 0 -73 L 0 -69 M 0 -59 L 0 -55 M -9 -64 L -5 -64 M 5 -64 L 9 -64" />
      </g>
    </svg>
  );
}
