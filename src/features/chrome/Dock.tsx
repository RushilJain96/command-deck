"use client";

import { motion } from "framer-motion";
import { useScene } from "@/features/app/hooks";
import { cn } from "@/lib/cn";
import { DESTINATIONS } from "./destinations";

/**
 * Persistent bottom dock. Sibling of <SceneHost>, for the same reasons as
 * <TopBar>.
 *
 * On desktop this is a compact secondary affordance — the top bar carries
 * primary navigation, so repeating it at full weight would be noise. Below the
 * `deck-md` breakpoint the top bar drops its nav and the dock becomes the sole
 * navigation surface, which is why it uses short codes that stay legible when
 * space is tight.
 */
export function Dock() {
  const scene = useScene();

  return (
    <motion.nav
      aria-label="Destinations"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.08, ease: "easeOut" }}
      className="absolute inset-x-0 bottom-0 z-40 flex h-14 items-center justify-center px-5"
    >
      <ul
        className={cn(
          "flex items-center gap-0.5 rounded-[4px] border border-white/[0.08] p-1",
          "bg-[linear-gradient(180deg,rgb(255_255_255/0.045),rgb(255_255_255/0.015))]",
          "shadow-[inset_0_1px_0_0_rgb(255_255_255/0.06),0_16px_40px_-20px_rgb(0_0_0/0.9)]",
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
