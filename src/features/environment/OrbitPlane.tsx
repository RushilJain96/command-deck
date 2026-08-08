import type { CSSProperties, ReactNode } from "react";
import { ORBIT_TILT, SHIP_STANDOFF_SCREEN } from "@/features/missions/placement";

/**
 * Publishes the orbital plane's geometry to CSS.
 *
 * ORBIT_TILT and SHIP_STANDOFF are owned by TypeScript because the spacecraft's
 * aim depends on both (`screenAngle` is derived from them). Injecting them here
 * — at the common ancestor of every consumer, nodes and guides alike — keeps CSS
 * and the ship's targeting mathematically in step. Writing the literals into a
 * stylesheet instead would create a second source of truth whose drift shows up
 * as a ship that points very slightly wrong, which is close to undiagnosable.
 *
 * The @property fallbacks in globals.css (tilt 1, standoff 0) are deliberately
 * degenerate so that a missing provider is instantly visible rather than subtly
 * off.
 *
 * THE ORIGIN OF THIS ELEMENT IS THE SHIP, NOT THE PLANE'S CENTRE. See
 * <PlaneSurface> below.
 */
export function OrbitPlane({ children }: { children: ReactNode }) {
  return (
    <div
      className="absolute top-0 left-0"
      style={
        {
          "--orbit-tilt": ORBIT_TILT,
          // The PROJECTED standoff, not the world one. See SHIP_STANDOFF_SCREEN.
          "--ship-standoff": SHIP_STANDOFF_SCREEN,
        } as CSSProperties
      }
    >
      {children}
    </div>
  );
}

/**
 * The orbital surface itself: everything measured from the CENTRE of the
 * ellipse rather than from the vehicle.
 *
 * The deck is viewed from close behind and below the ship, which sits half an
 * orbit BEYOND the outermost ring, so the plane's centre lies well up the screen
 * from the vehicle. Rather than give the spacecraft a position — it must stay at
 * the world origin, and only ever rotate — the surface is what moves: this
 * element lifts guides and mission nodes by exactly the standoff, and every
 * child then keeps using plain plane-centre coordinates.
 *
 * OFFSET WITH `top`, NEVER `transform`. A transform here would create a
 * stacking context around every mission node, so their z-indices would stop
 * competing with the spacecraft's and the whole ring would jump in front of or
 * behind the hull as one block. `top` on a positioned element with `z-index:
 * auto` creates nothing.
 */
export function PlaneSurface({ children }: { children: ReactNode }) {
  return (
    <div
      className="absolute left-0"
      style={{
        top: "calc(var(--orbit-radius) * var(--orbit-tilt) * var(--ship-standoff) * -1)",
      }}
    >
      {children}
    </div>
  );
}
