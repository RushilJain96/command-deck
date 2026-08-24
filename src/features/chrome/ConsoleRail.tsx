import {
  ArrowRightFromLine,
  ChartNoAxesColumn,
  FlaskConical,
  Folder,
  House,
  Mail,
  User,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * THE CONSOLE RAIL, SHARED BY EVERY CONSOLE SCENE.
 *
 * This was `SystemsScene`'s own component until a second console needed it. The
 * two differ in exactly two things — which position is lit, and where the rail
 * stops — so copying it would have meant two files that must be edited together
 * forever and will not be. Everything else about it, the 44-unit width, the 14-unit
 * inset shared with the top bar, the seven marks, the lit position's outer bar, is
 * the same instrument on both screens and has to stay that way: a rail that is 44
 * wide on one console and 54 on the next is two rails.
 *
 * IT IS DECORATIVE, AND `aria-hidden` SAYS SO. The marks do not navigate — the top
 * bar is the navigation, in the same colour, forty units above this. A second set
 * of unlabelled glyphs claiming to be links would give a screen reader user seven
 * destinations that do not exist. When these become live they get labels, roles and
 * a dispatch, and this comment comes out.
 */

interface RailMark {
  readonly id: string;
  readonly icon: LucideIcon;
}

const RAIL: readonly RailMark[] = [
  { id: "home", icon: House },
  { id: "operator", icon: User },
  { id: "files", icon: Folder },
  { id: "transit", icon: ArrowRightFromLine },
  { id: "lab", icon: FlaskConical },
  { id: "systems", icon: ChartNoAxesColumn },
  { id: "contact", icon: Mail },
];

export type RailId = (typeof RAIL)[number]["id"];

export function ConsoleRail({
  activeId,
  className,
}: {
  activeId: RailId;
  /**
   * Carries the rail's HEIGHT, authored per console in `globals.css`.
   *
   * It is not a prop with a number in it because the height is the sum of the
   * console's own section budget — the rail's job is to be the left edge of the
   * block its scene insets to clear it, and it has to stop exactly where that block
   * does. Stretched to the frame's foot it reads as a rail that has lost its
   * contents; hugging its seven glyphs it stops short and reads as unrelated to
   * anything. Both consoles solve that in the same file as the budget it comes from.
   */
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute top-[96px] left-[14px] z-20 hidden w-[44px] flex-col items-center justify-between rounded-[3px] border border-[var(--panel-border)] bg-[rgb(6_8_12/0.72)] py-4 @3xl:flex",
        className,
      )}
    >
      {RAIL.map((mark) => {
        const Icon = mark.icon;
        const isActive = mark.id === activeId;
        return (
          <span
            key={mark.id}
            className={cn(
              "relative flex h-[34px] w-[34px] items-center justify-center rounded-[3px]",
              isActive ? "text-signal" : "text-t4",
            )}
            style={
              isActive
                ? {
                    backgroundColor: "rgb(255 42 42 / 0.09)",
                    boxShadow: "inset 0 0 0 1px rgb(255 42 42 / 0.35)",
                  }
                : undefined
            }
          >
            {/* The lit position also gets a bar on the rail's outer edge — the same
                device the top bar's active segment uses, turned ninety degrees. */}
            {isActive && (
              <span
                className="bg-signal absolute top-1.5 bottom-1.5 -left-[9px] w-[2px] rounded-full"
                style={{ boxShadow: "0 0 8px rgb(255 42 42 / 0.75)" }}
              />
            )}
            <Icon size={17} strokeWidth={1.6} />
          </span>
        );
      })}
    </div>
  );
}
