/**
 * Placeholder spacecraft. Deliberately geometric rather than illustrative —
 * Sprint 1 is an engineering deliverable and final artwork is out of scope.
 *
 * Authored NOSE-UP so that a mission's theta can drive `rotate` directly, with
 * no offset constant. If you redraw this, keep the nose pointing at -y.
 */
export function ShipGeometry({ engaged }: { engaged: boolean }) {
  return (
    <svg
      width="88"
      height="88"
      viewBox="-44 -44 88 88"
      aria-hidden="true"
      focusable="false"
      className="overflow-visible"
    >
      {/* Hull */}
      <path
        d="M 0 -30 L 15 14 L 0 6 L -15 14 Z"
        className="fill-zinc-100 transition-colors duration-300"
      />
      {/* Spine, reads as a fuselage seam and reinforces the nose direction */}
      <path d="M 0 -30 L 0 6" className="stroke-zinc-500" strokeWidth="1" />
      {/* Engine bloom: the only element that responds to targeting, so the ship
          communicates lock without translating. */}
      <circle
        cx="0"
        cy="12"
        r={engaged ? 6 : 3.5}
        className={
          engaged
            ? "fill-red-500 opacity-90 transition-all duration-300"
            : "fill-red-500 opacity-40 transition-all duration-300"
        }
      />
    </svg>
  );
}
