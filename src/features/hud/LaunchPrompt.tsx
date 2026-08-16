import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * The deck's two keyboard affordances, drawn.
 *
 * THE KEYS ARE REAL. Both are handled in <MissionOrbit> — arrows step the lock
 * left to right across the field, Enter opens whatever is targeted. That ordering
 * is the whole point: a hint for a key that does nothing is decoration wearing an
 * instruction's clothes, and this project bans decoration by name. The reference
 * also advertises a Ctrl+K terminal; there is no command palette, so there is no
 * hint for one.
 *
 * Centred at the bottom because that is where the ship is, and both keys act on
 * the ship's target. It sits in the strip <Dock> owns on narrow viewports, hence
 * `deck-md:hidden` — where the short-code dock is the only navigation, it wins.
 *
 * NOT ANIMATED. The eye is already carrying the plume, the blinking annunciators
 * and the arrival choreography; a pulsing "press enter" would be the one thing on
 * screen moving for attention rather than for meaning.
 */
export function LaunchPrompt() {
  return (
    <div
      className={cn(
        // 70px clears <Footer>'s 66 by four, which is deliberate: this stack and
        // the footer are the two things reserved out of the hull's vertical
        // budget in --orbit-radius (see the third clamp term), so every pixel
        // here is a pixel of orbit. Its height plus this offset is the
        // `shipFloor` the layout solver models — change one, change both.
        "deck-md:hidden pointer-events-none absolute inset-x-0 bottom-[70px] z-30",
        "flex flex-col items-center gap-2.5",
      )}
    >
      <p
        className={cn(
          "border-panel-edge bg-panel flex items-center gap-2.5 rounded-[3px] border px-4 py-2",
          "text-t3 tracking-micro font-mono text-[12px] uppercase",
        )}
      >
        <span>Press</span>
        {/* The only FILLED keycap on the deck. Enter is the one key that changes
            scene, so it gets the accent and the arrows do not — a row of three
            red caps would say all three are equally consequential. */}
        <kbd className="bg-signal rounded-[2px] px-2 py-[3px] font-mono text-[11px] leading-none text-white not-italic">
          Enter
        </kbd>
        <span>to launch</span>
      </p>

      <p className="text-t3 flex items-center gap-2 font-mono text-[12px]">
        <span>Use</span>
        <Key>&larr;</Key>
        <Key>&rarr;</Key>
        <span>to navigate</span>
      </p>
    </div>
  );
}

/** Outlined keycap. `<kbd>` because that is what it is, and it renders as a
 *  monospace italic by default in some engines — hence the explicit reset. */
function Key({ children }: { children: ReactNode }) {
  return (
    <kbd className="border-panel-edge bg-panel text-t2 inline-flex h-[19px] min-w-[19px] items-center justify-center rounded-[2px] border font-mono text-[11px] leading-none not-italic">
      {children}
    </kbd>
  );
}
