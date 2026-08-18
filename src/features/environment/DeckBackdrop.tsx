"use client";

import { useSyncExternalStore } from "react";
import { SpaceHaze } from "./SpaceHaze";
import { Sky } from "./Starfield";

/**
 * True on the client, false on the server, WITHOUT a setState in an effect.
 *
 * The obvious spelling is `useState(false)` plus `useEffect(() => setMounted(true))`,
 * and `react-hooks/set-state-in-effect` rejects it — correctly: that pattern
 * renders, commits, then immediately schedules a second render, which React has a
 * purpose-built primitive to avoid.
 *
 * `useSyncExternalStore` takes a server snapshot and a client snapshot as
 * separate arguments, which is exactly the question being asked. The subscribe
 * function returns a no-op unsubscribe because this store never changes: once you
 * are on the client you stay there.
 */
const noop = () => () => {};
const onClient = () => true;
const onServer = () => false;

/**
 * The full-window backdrop: gas and scatter, behind the scaled deck frame.
 *
 * MOUNTED AFTER HYDRATION, ON PURPOSE, and the reason is specific rather than
 * cargo-culted.
 *
 * Both layers park their contents on `<motion.div style={{ x, y }}>` where x and
 * y are MotionValues driving parallax. On the server those resolve to nothing; on
 * the client Framer Motion's ref writes a `transform` during commit. React
 * compares the two and reports a hydration mismatch — it named the exact node,
 * `<div className="absolute -..." ref={useMotionRef}>`, inside StarLayerView.
 *
 * This did not exist until the backdrop was hoisted out of <SceneHost> to fill
 * the letterbox margins. Inside the scene it only ever mounted client-side, after
 * the boot scene handed over, so it was never part of the hydrated tree and the
 * mismatch had nothing to fire on. Moving it up made it a first-paint concern.
 *
 * WHY GATE RATHER THAN SUPPRESS. `suppressHydrationWarning` would silence the
 * console and leave the server markup in place — 1400 star divs shipped in the
 * HTML that React then declines to reconcile. Skipping the server render drops
 * that payload entirely and makes the transform authoritative from the first
 * frame the layer exists. Nothing is lost: this is decorative, non-interactive,
 * carries no text and is in no accessibility tree (`aria-hidden` on both).
 *
 * The one-frame delay lands during the boot scene, well before the deck appears.
 */
export function DeckBackdrop() {
  const mounted = useSyncExternalStore(noop, onClient, onServer);
  if (!mounted) return null;

  return (
    <>
      {/* Furthest first: gas behind stars, because a cloud you can see stars
          through is the wrong way round. */}
      <SpaceHaze />
      <Sky />
    </>
  );
}
