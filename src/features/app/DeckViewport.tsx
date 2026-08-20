"use client";

import { useEffect, type ReactNode } from "react";

/**
 * THE DECK IS ONE FIXED-SIZE COMPOSITION, SCALED TO FIT THE WINDOW.
 *
 * Everything inside is authored against a 1536x1024 frame and never reflows. The
 * window's job is only to decide how large that frame is drawn.
 *
 * WHY THIS REPLACED THE RESPONSIVE TIER SYSTEM. The deck used to have three
 * tiers, and below the largest one it hid the instrument rails, the legend, the
 * launch prompt and the top bar's navigation. That was not arbitrary: six
 * fixed-size callouts, a 577px hull and two rails have no feasible orbit radius
 * in a short window, and a headless solver proved it. Hiding things was the only
 * way to keep the remainder from overlapping.
 *
 * The cost was that most people never saw the deck. A 1440x900 laptop has roughly
 * 770px of viewport once browser chrome is subtracted, so it fell to the compact
 * tier and rendered a different, poorer product than the one that was designed.
 * An interface nobody sees the good version of is not a responsive interface, it
 * is two interfaces where one of them is a consolation prize.
 *
 * Scaling sidesteps the packing problem entirely rather than solving it: the
 * geometry is always the geometry that was checked, so there is nothing left to
 * collide. What it costs instead is PHYSICAL TYPE SIZE — at 0.75 the rail's 9.5px
 * labels render near 7px. That is a real cost and it is the reason this is a
 * deliberate choice rather than an obvious one.
 *
 * NEVER SCALES UP. `min(1, ...)`: above the design height the deck sits at 1:1
 * rather than stretching. The ship is a raster sprite and the type is set in
 * pixels; both look worse enlarged than they do surrounded by space.
 *
 * THE FRAME IS FULL-BLEED. IT USED TO LETTERBOX AND THAT WAS THE WRONG SHAPE.
 *
 * The first version fixed BOTH axes at 1536x1024 and scaled by
 * `min(vw/1536, vh/1024)`, which meant any window that was not 3:2 got black
 * bars — and the chrome, which is inside the frame, stopped at the bar rather
 * than at the screen. A left rail floating 150px in from the edge of the display
 * reads as a page inside a page, which is exactly what a command deck must not.
 *
 * Only the HEIGHT is a design constant now. The scale is `min(1, vh/1024)`, and
 * the frame's own box is sized in DESIGN UNITS to whatever the window is —
 * `100vw / scale` by `100vh / scale` — so after the transform it covers the
 * viewport exactly, edge to edge, in both axes. There is nothing left to
 * letterbox.
 *
 * What that buys, beyond flush chrome: the deck's GEOMETRY is still fixed. The
 * orbit radius, the card sizes and the hull are the same pixel values they were
 * checked at; a wider window simply has more space either side of the same
 * composition, and `justify-between` chrome spreads into it.
 *
 * WHERE IT STILL BREAKS: below about 1000px of window width the rail and the
 * outer callouts do converge, because the rail scales with the height while the
 * cards are centred horizontally. Clearance only ever improves as the window
 * gets wider than the design frame, so this is a narrow-window limit rather than
 * a general one.
 */
export const DECK_HEIGHT = 1024;

/** The width the composition was designed and measured against. Not a constraint
 *  on the frame any more — the frame takes the window's width — but still the
 *  number every layout measurement in the project refers to. */
export const DECK_WIDTH = 1536;

/**
 * SET IN AN EFFECT, NOT DURING RENDER, and that is the same rule the MotionValue
 * invariant follows for the same reason. Reading `innerWidth` while rendering is
 * a hydration mismatch (the server has no window) and a `react-hooks/purity`
 * violation, both of which this project has eslint rules turned on for.
 *
 * The variable defaults to 1 in globals.css, so the server-rendered frame is the
 * design frame at 1:1 and the first client paint corrects it. That correction is
 * invisible in practice because it lands during the boot scene, and the root is
 * `overflow-hidden`, so an oversized first frame clips rather than adding
 * scrollbars.
 */
export function DeckViewport({ children }: { children: ReactNode }) {
  useEffect(() => {
    const root = document.documentElement;
    // HEIGHT ONLY. Width no longer participates: the frame takes the window's
    // width in design units instead of being clipped to a fixed one, so there is
    // no horizontal bound left for the scale to satisfy.
    const apply = () =>
      root.style.setProperty(
        "--deck-scale",
        String(Math.min(1, window.innerHeight / DECK_HEIGHT)),
      );
    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, []);

  return (
    <div
      // ANCHORED TOP-LEFT, NOT CENTRED. With `origin-top-left` a box of
      // `100vw/s x 100vh/s` scaled by `s` lands exactly on the viewport — same
      // origin, same size, no centring arithmetic and no residual margin. The
      // earlier version centred a fixed box and scaled about its middle, which is
      // what produced the bars.
      className="absolute top-0 left-0 origin-top-left"
      style={{
        width: "calc(100vw / var(--deck-scale))",
        height: "calc(100vh / var(--deck-scale))",
        scale: "var(--deck-scale)",
      }}
    >
      {children}
    </div>
  );
}
