import { SYSTEM_DOMAINS } from "./data";
import { SystemDomainCard } from "./SystemDomainCard";

/**
 * 3 x 2 -> 2 x 3 -> 1 x 6.
 *
 * CONTAINER QUERIES, NOT VIEWPORT BREAKPOINTS, and that is forced by
 * <DeckViewport> rather than a preference. The whole deck is one design-unit
 * frame scaled by `min(1, innerHeight / 1024)`, so a card's neighbours are
 * decided by how many DESIGN units are across the frame — which is
 * `100vw / --deck-scale`, not `100vw`. A phone at 390x844 renders a 473-unit-wide
 * frame; a `min-width: 640px` media query would read 390 and be answering a
 * question about the window while the layout is a question about the frame.
 *
 * `@container` measures the frame directly, so the thresholds below are in the
 * same units as every other number in this scene. The root carries the
 * `@container` class — see <SystemsConsole>.
 */
/**
 * SIX ACROSS IS A FOURTH TIER, AND IT NEEDS ITS OWN THRESHOLD.
 *
 * IT IS NOT A TAILWIND VARIANT. `.sys-domains` is authored in `globals.css` under
 * a real `@container (min-width: 1400px)` block, and the note there explains why —
 * an arbitrary container variant beside a named one loses the cascade in a way the
 * class list cannot show you.
 *
 * 1400 rather than Tailwind's largest named size (`@7xl`, 1280): six cards across
 * 1280 design units leaves each one about 190 wide, which is under the measure
 * "CLOUD INFRASTRUCTURE" needs on two lines. At 1400 the card clears 210.
 *
 * The threshold is HIGHER than the @6xl the console's other fixed heights use, and
 * that is deliberate — a row of six and two rows of three are different heights, so
 * <SystemsConsole> carries a budget for each.
 *
 * Note what the frame width actually is at each window: <DeckViewport> scales by
 * `min(1, innerHeight/1024)`, so a 1366x768 laptop draws a 1821-unit frame and
 * gets the six-across row, while a 1024x768 tablet draws 1365 and gets three.
 * Window width alone would have answered both of those wrong.
 */
export function SystemDomainGrid() {
  return (
    <section
      aria-label="Engineering domains"
      className="sys-domains grid grid-cols-1 gap-3 @xl:grid-cols-2 @5xl:grid-cols-3"
    >
      {SYSTEM_DOMAINS.map((domain, index) => (
        <SystemDomainCard key={domain.id} domain={domain} index={index} />
      ))}
    </section>
  );
}
