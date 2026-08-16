import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  /**
   * THE THING OVERLAPPING THE FOOTER TAGLINE IS THIS, NOT OUR LAYOUT.
   *
   * Next renders a circular route indicator at `bottom-left` in development,
   * which is exactly where "ENGINEER. BUILDER. PROBLEM SOLVER." starts. It does
   * not exist in a production build, so the correct fix is to move it rather
   * than to add a margin the shipped site would then carry for no reason.
   *
   * OFF, not repositioned. Moving it to `bottom-right` was tried first and simply
   * traded one collision for another — it landed on "BUILT WITH NEXT.JS &
   * TYPESCRIPT". The footer spans the full width and the deck fills the frame, so
   * there is no corner for a floating badge to sit in.
   *
   * Turning it off does not cost error reporting: per the Next docs, compile and
   * runtime errors are still surfaced with `devIndicators: false`.
   */
  devIndicators: false,
  turbopack: {
    // A stray package-lock.json in the user's home directory makes Turbopack
    // infer the wrong workspace root. Pin it to this project.
    root: __dirname,
  },
};

export default nextConfig;
