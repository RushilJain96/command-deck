/**
 * Arrival choreography for the Command Deck, in seconds.
 *
 * The deck should feel like somewhere you arrive at, not a page that loads. So
 * the order is spatial rather than structural: the world exists first, then the
 * plane you are flying over resolves, then the missions on it become legible,
 * and only then do the instruments come online around you.
 *
 * Reversing this — chrome first, world last — is what makes an interface feel
 * like software booting instead of a vehicle settling into position. The camera
 * is easing back through all of it (see `springs.cameraZoom`, deliberately
 * slack), so every one of these lands while the framing is still moving.
 *
 * Centralised because these values only work in relation to each other; tuning
 * one in isolation inside a component breaks the sequence.
 */
export const ARRIVAL = {
  /** Orbital plane, guides and floor glow. */
  field: 0.05,
  /** The spacecraft itself. */
  ship: 0.3,
  /** Mission callouts, staggered around the ring. */
  missions: 0.5,
  /** Per-mission stagger. */
  missionStep: 0.06,
  /** HUD rail. */
  hud: 0.75,
} as const;
