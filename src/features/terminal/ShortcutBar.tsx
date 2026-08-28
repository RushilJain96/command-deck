import { SHORTCUTS } from "./data";

/**
 * The keyboard legend.
 *
 * It is `aria-hidden`, and the keys are not marked up as `<kbd>`. That reads
 * backwards and is deliberate: every binding listed here is also printed by `help`,
 * which a screen reader user reaches by the same route as everyone else, so a
 * second reading of the same five bindings as loose text between the prompt and the
 * panel is noise in the exact place a reader is trying to hear output. The bar is a
 * wall chart for people looking at the screen; the terminal itself tells everyone
 * else the same thing.
 */
export function ShortcutBar() {
  return (
    <div
      aria-hidden="true"
      className="border-panel-edge flex h-full items-center gap-5 overflow-hidden rounded-[4px] border bg-[rgb(6_8_12/0.6)] px-5 shadow-[inset_0_1px_0_0_rgb(255_255_255/0.04)]"
    >
      <span className="text-t2 tracking-micro shrink-0 font-mono text-[11px] uppercase">
        Command shortcuts:
      </span>

      {SHORTCUTS.map((shortcut) => (
        <span key={shortcut.keys} className="flex shrink-0 items-center gap-2.5">
          {/* The keycap is the only red thing in this bar, so the eye reads a row of
              keys with words attached rather than ten words of equal weight. */}
          <span className="text-signal rounded-[3px] border border-[rgb(255_42_42/0.45)] bg-[rgb(255_42_42/0.06)] px-2 py-[5px] font-mono text-[10px] leading-none whitespace-nowrap">
            {shortcut.keys}
          </span>
          <span className="text-t2 font-mono text-[11.5px] leading-none whitespace-nowrap">
            {shortcut.label}
          </span>
        </span>
      ))}
    </div>
  );
}
