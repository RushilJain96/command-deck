/**
 * Mission insignia.
 *
 * Built from the deck's own geometry rather than as a generic monogram: a
 * tilted orbital ellipse at the same squash as the plane below, a chevron for
 * the spacecraft at its centre, and a bearing tick at the top of the ring. It
 * is a miniature of the thing the visitor is about to use, which is what makes
 * it read as an insignia for THIS system rather than a logo dropped on top.
 *
 * The containing hexagon is the same chamfer language as the mission panels.
 */
export function Emblem({ size = 30 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
      focusable="false"
      className="shrink-0"
    >
      {/* Chamfered housing */}
      <path
        d="M 6 1 L 26 1 L 31 6 L 31 26 L 26 31 L 6 31 L 1 26 L 1 6 Z"
        fill="#12151b"
        stroke="rgb(255 255 255 / 0.16)"
        strokeWidth="1"
      />

      {/* Orbital ring, squashed to match the deck's tilt. */}
      <ellipse
        cx="16"
        cy="17"
        rx="10"
        ry="5.5"
        fill="none"
        stroke="rgb(255 255 255 / 0.34)"
        strokeWidth="1"
      />
      {/* Inner ring */}
      <ellipse
        cx="16"
        cy="17"
        rx="5.4"
        ry="3"
        fill="none"
        stroke="rgb(255 255 255 / 0.16)"
        strokeWidth="0.8"
      />

      {/* Bearing tick at 000, the same reference the deck's compass uses. */}
      <path d="M 16 11.5 L 16 8.6" stroke="var(--signal)" strokeWidth="1.2" />

      {/* Spacecraft chevron, nose-up like the real one. */}
      <path d="M 16 12.6 L 20 21.4 L 16 19.2 L 12 21.4 Z" fill="#eef1f5" />

      {/* Orbiting mission mark */}
      <circle cx="25.4" cy="18.6" r="1.5" fill="var(--signal)" />
    </svg>
  );
}
