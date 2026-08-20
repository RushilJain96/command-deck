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
 * The console's left instrument rail.
 *
 * IT IS DECORATIVE, AND THAT IS A DELIBERATE CHOICE RATHER THAN AN UNFINISHED ONE.
 * The whole rail carries `aria-hidden` and `pointer-events-none`, so it is invisible
 * to assistive technology and cannot be clicked.
 *
 * The reason: this application's navigation is the top bar's six-position mode
 * selector, and it is real — the segments dispatch, the locked ones say so, and a
 * keyboard user can reach every destination there. Seven more glyphs down the left
 * edge have nowhere to go. Rendering them as buttons would put seven controls on
 * screen that do nothing when pressed, which is worse for a keyboard user than no
 * rail at all, and worse for a mouse user than furniture that never invites a click.
 *
 * So it is furniture: a bezel down the side of the instrument, the way a rack-mount
 * panel has fixings that are not switches. If these should become a second
 * navigation, the fix is to give them destinations — not to make them focusable
 * first and find destinations later.
 *
 * The lit position is the chart, sixth of seven, matching the console the frame is
 * currently showing.
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

const ACTIVE_ID = "systems";

export function SystemsRail() {
  return (
    <div
      aria-hidden="true"
      // IT ENDS WHERE THE CAPABILITY MATRIX DOES, and that is the whole point of
      // its height. The rail's job is to be the left edge of the console's UPPER
      // block — header, domain row, matrix — which are the three sections inset to
      // clear it. The library row below runs full width, so the rail has to stop
      // there or it would be a column standing beside nothing.
      //
      // The height is authored in `globals.css` as `.sys-rail` rather than here,
      // because it is the sum of four numbers in <SystemsConsole>'s budget table
      // and it has to be re-solved with them. Stretched to the frame's foot it read
      // as a rail that had lost its contents; hugging its seven glyphs it stopped
      // short of the matrix and read as unrelated to it.
      //
      // Inset by the same 14 units the top bar uses, so the two chrome elements
      // share one margin. `justify-between` spreads the marks over whatever height
      // the tier gives it.
      className="sys-rail pointer-events-none absolute top-[96px] left-[14px] z-20 hidden w-[44px] flex-col items-center justify-between rounded-[3px] border border-[var(--panel-border)] bg-[rgb(6_8_12/0.72)] py-4 @3xl:flex"
    >
      {RAIL.map((mark) => {
        const Icon = mark.icon;
        const isActive = mark.id === ACTIVE_ID;
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
