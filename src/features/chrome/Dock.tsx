"use client";

import { motion } from "framer-motion";
import { useScene } from "@/features/app/hooks";
import { cn } from "@/lib/cn";
import { DESTINATIONS } from "./destinations";

/**
 * Persistent bottom dock. Sibling of <SceneHost>, for the same reasons as
 * <TopBar>.
 *
 * IT ONLY EXISTS BELOW `deck-md` NOW. On the wide deck the top bar carries
 * primary navigation, so this was the same control a second time — and it was
 * occupying the one strip of the frame where the site has something of its own
 * to say. <Footer> has that strip on wide viewports.
 *
 * The moment the top bar drops its nav, the trade reverses: navigation outranks a
 * colophon, so the footer hides and this becomes the sole navigation surface. The
 * short codes exist for exactly that case — they stay legible when space is tight.
 * The two are mutually exclusive by construction; both use `deck-md` and opposite
 * senses of it, so there is no viewport where the bottom strip is empty or doubled.
 */
export function Dock() {
  const scene = useScene();

  return (
    <motion.nav
      aria-label="Destinations"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.08, ease: "easeOut" }}
      className="deck-md:flex absolute inset-x-0 bottom-0 z-40 hidden h-14 items-center justify-center px-5"
    >
      <ul
        className={cn(
          // Darkened with the rest of the chrome. The old fill was additive
          // white, which on a tinted ground was a soft grey and on pure black is
          // a lit strip — so it becomes an opaque near-black housing instead.
          "flex items-center gap-0.5 rounded-[4px] border border-white/[0.055] p-1",
          "bg-[linear-gradient(180deg,rgb(13_16_21/0.96),rgb(4_5_8/0.98))]",
          "shadow-[inset_0_1px_0_0_rgb(255_255_255/0.04),0_16px_40px_-20px_rgb(0_0_0/0.9)]",
        )}
      >
        {DESTINATIONS.map((destination) => {
          const isActive = destination.sceneId === scene.id;
          const isLocked = destination.sceneId === null;

          return (
            <li key={destination.id}>
              <button
                type="button"
                aria-current={isActive ? "page" : undefined}
                aria-disabled={isLocked || undefined}
                aria-label={destination.label}
                title={isLocked ? `${destination.label} — not yet available` : destination.label}
                className={cn(
                  "tracking-micro relative rounded-[3px] px-3 py-1.5 font-mono text-[10px]",
                  "outline-none transition-colors duration-200",
                  "focus-visible:ring-signal/70 focus-visible:ring-2",
                  isActive
                    ? "text-t1"
                    : isLocked
                      ? "text-t4 cursor-not-allowed"
                      : "text-t3 hover:text-t1",
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="dock-active"
                    className="absolute inset-0 rounded-[3px] bg-white/[0.07]"
                    transition={{ type: "spring", stiffness: 320, damping: 32 }}
                  />
                )}
                <span className="relative">{destination.short}</span>
                {isActive && (
                  <span className="bg-signal/70 absolute inset-x-2 -bottom-px h-px" />
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </motion.nav>
  );
}
