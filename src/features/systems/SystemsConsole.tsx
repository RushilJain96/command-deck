"use client";

import type { CSSProperties } from "react";
import { ConsoleSky } from "./ConsoleSky";
import { CurrentlyExploring } from "./CurrentlyExploring";
import { EngineeringCapabilities } from "./EngineeringCapabilities";
import { SystemDomainGrid } from "./SystemDomainGrid";
import { SystemsHeader } from "./SystemsHeader";
import { SystemsRail } from "./SystemsRail";
import { TechnologyLibrary } from "./TechnologyLibrary";
import { ToolLibrary } from "./ToolLibrary";

/**
 * THE CONSOLE RE-POINTS THE DECK'S SURFACE TOKENS FOR ITS OWN SUBTREE.
 *
 * `--panel-fill`, `--panel-border`, `--panel-rule` and the text ramp are plain
 * custom properties that `@theme inline` maps to `bg-panel`, `border-panel-edge`,
 * `text-t2` and so on. Redeclaring them on this element re-points every one of
 * those utilities INSIDE the console and changes nothing outside it — no new
 * classes, no props threaded through <HudPanel>, and the deck's rail is untouched.
 *
 * SEPARATION IS CARRIED BY EDGE AND TYPE, NOT BY FILL. This reverses a lift the
 * fills briefly had, and the reversal is the better answer for a reason worth
 * keeping: the console's one genuinely saturated element is the technology marks,
 * and every unit of luminance in the surface under them is a unit of contrast
 * taken off them. A #0e131b panel made Python's blue and Redis' red sit ON
 * something; at #06080b they sit in the dark and read as lit.
 *
 * What actually separates four large tiled surfaces, then, is the two things
 * raised here and left raised:
 *
 *   border  rgb(255 255 255/.09) ->  rgb(190 205 220/.19)  cool, and visible
 *   rule    rgb(255 255 255/.07) ->  rgb(190 205 220/.13)
 *   t2      #98a2ad              ->  #a9b4c0   body copy
 *   t3      #5b646e              ->  #74808c   labels and metadata
 *
 * The fill goes the other way, one step BELOW the deck's own — the deck's panels
 * float alone in a starfield and need to read as objects; these are tiled edge to
 * edge and read as one instrument face divided by engraved lines.
 *
 * `--text-primary` is NOT raised. It is already #f2f5f8; lifting the ramp under a
 * fixed top would compress the hierarchy, which is the opposite of the ask.
 */
const CONSOLE_SURFACE = {
  "--panel-fill": "rgb(6 8 12 / 0.86)",
  "--panel-border": "rgb(190 205 220 / 0.19)",
  "--panel-rule": "rgb(190 205 220 / 0.13)",
  "--text-secondary": "#a9b4c0",
  "--text-tertiary": "#74808c",
} as CSSProperties;

/**
 * The console's composition, and the only place its vertical budget is spent.
 *
 * WHAT THE FRAME GIVES THIS SCENE. <DeckViewport> draws 1024 design units of
 * height whatever the window is. The top bar takes 76 of them (14 inset + 62
 * tall). The FOOTER IS STOOD DOWN on this scene — see <Footer>, which declines to
 * render here — so the console's usable band is 96..998, which is 902 units.
 * Everything from the header to the last panel is authored to land inside it.
 *
 * IT SCROLLS, AND ONLY WHERE IT HAS TO. "The app never scrolls" is a real rule
 * and the deck honours it absolutely: the mission field is a spatial arrangement
 * where scrolling would be meaningless. This scene is a console of stacked
 * instruments, and at 473 design units across — a phone — six domain cards in one
 * column plus four panels cannot be made to fit 902 units by any means other than
 * shrinking the type past legibility, which is the exact failure <DeckViewport>
 * was written to end.
 *
 * So the overflow is contained HERE rather than being allowed to reach the
 * document: `html, body { overflow: hidden }` still holds, the frame is still
 * fixed, the chrome does not move, and on any window wide enough for the three-
 * column layout there is nothing to scroll in the first place.
 *
 * THE `@container` IS ON THE ROOT AND EVERY THRESHOLD BELOW READS FROM IT. See
 * <SystemDomainGrid> for why this scene cannot use viewport breakpoints.
 */
export function SystemsConsole() {
  return (
    <div className="@container absolute inset-0" style={CONSOLE_SURFACE}>
      <ConsoleSky />

      {/* SCRIM UNDER THE TOP BAR, AND ONLY WHERE THERE IS SOMETHING TO SCROLL.
          The bar is a sibling of the whole scene host, so it floats above this
          scene with the void showing between its cells — right on the deck, where
          nothing moves underneath it, and wrong here the moment the console
          scrolls and a domain card slides up through the gaps.

          There is no companion at the bottom any more: the footer is stood down
          on this scene, so the last panel simply ends at the frame.

          IT IS WITHDRAWN ONLY AT THE WIDE TIER, and that threshold moved: it used
          to lift at @6xl (1152), on the assumption that anything above 1152 fits
          its budget. That stopped being true when the domain cards grew — between
          1152 and 1400 the console runs about 40 units long and scrolls, so the
          scrim has to still be there. `.sys-scrim` is switched off inside the same
          authored `@container (min-width: 1400px)` block that sets the wide tier's
          heights, which means the two can no longer drift apart. */}
      <div
        aria-hidden="true"
        className="sys-scrim pointer-events-none absolute inset-x-0 top-0 z-10 h-[92px] bg-[linear-gradient(to_bottom,#000_0%,#000_58%,transparent_100%)]"
      />

      <SystemsRail />

      {/* THE RAIL'S WIDTH IS NOT A MARGIN FOR THE WHOLE PAGE.
          It was: the scroll container carried `pl-[74px]`, which reserved a
          44-unit column plus its gutter down the ENTIRE frame — so the library
          row, which the rail does not reach anywhere near, sat 46 units in from
          the left edge for no reason, and the console lost that width from its
          widest section.

          The inset moved onto the three sections the rail actually passes:
          header, domain row, capability matrix. The library row starts at the
          console's own padding and runs full width, which is what the reference
          does and why its bottom band looks wider than the panels above it. The
          rail's height is set to end exactly at the capability matrix's foot —
          see `.sys-rail` in globals.css — so the two edges agree rather than one
          being a guess about the other. */}
      <div className="deck-scroll sys-stack relative flex h-full flex-col gap-3.5 overflow-x-hidden overflow-y-auto px-7 pt-[96px] pb-[26px]">
        {/* `shrink-0` ON EVERY SECTION, AND IT IS LOAD-BEARING.
            This is a flex column with a fixed height, so its children default to
            `flex-shrink: 1` and a panel carrying `min-h-0` — which the two
            libraries need for their internal scroll to work at all — becomes free
            to compress below its own content. An early build did exactly that:
            the capabilities panel was squeezed and its second row of tiles
            rendered straight through the technologies panel underneath it.
            Nothing about that is visible in the markup; it shows up only as
            overlap on screen. */}
        <div className="shrink-0 @3xl:pl-[46px]">
          <SystemsHeader />
        </div>

        <div className="shrink-0 @3xl:pl-[46px]">
          <SystemDomainGrid />
        </div>

        <div className="shrink-0 @3xl:pl-[46px]">
          <EngineeringCapabilities />
        </div>

        {/* THREE ACROSS, THEN TWO WITH THE TRAJECTORY PANEL RUNNING FULL WIDTH,
            THEN ONE. The exploration panel is the row's shortest content and the
            one that reads fine as a wide band, so it is the one that spans when
            the row drops to two columns — pairing it with either library instead
            would leave a half-empty cell beside a scrolling one.

            250 IS MEASURED, NOT CHOSEN: it is the exploration panel's natural
            height — six rows, six steppers and the focus line — and it is the
            tallest of the three, so pinning the row to it is the only value that
            neither clips that panel nor leaves the row taller than its content.
            The two libraries then divide it into rows rather than setting it,
            which is why expanding either one cannot move the console's floor.

            THE WHOLE VERTICAL BUDGET, AND IT BALANCES TWICE.

            (The figures below were re-solved when the capability matrix went to one
            row of eight — it is far shorter as a single row than as a 4x2 grid, and
            the height it gave back went to this row so the libraries could carry a
            control at their foot.)

            902 units between the top bar and the frame's foot, and the domain row
            changes shape partway up — six across above 1400 units of frame, three
            across in two rows below it — so the other sections carry a height for
            each tier. Both columns are measured off the rendered frame, not
            estimated:

                              >= 1400        1152..1400
              header             82              82
              domains           250             380
              capabilities      205             205
              this row          305             260
              gaps            3 x 20          3 x 14
              total             902             969

            The domain row is the only section that SHRINKS as the frame widens —
            one row of near-square cards is shorter than two rows of wide ones —
            which is why the wide tier has height to hand back to the capability
            matrix and the libraries.

            THE MIDDLE TIER RUNS ABOUT 70 UNITS LONG AND SCROLLS, DELIBERATELY. Its
            domain cards carry the same type as the wide tier's, and two rows of
            three at that size do not fit. Every way of closing the gap costs
            something worse: the capability cells clip below about 196, the
            exploration panel clips below about 295, and setting the type per tier
            would mean the same card reads at two sizes on two machines. Seventy
            units of scroll inside a container built to scroll is the cheapest of
            those, and the scrim under the top bar is switched on for exactly this
            band. It is narrow in practice — a 1366x768 laptop draws a 1821-unit
            frame and a 1280x800 draws 1638, both of which land on the wide tier;
            1152..1400 is mostly square-ish windows. */}
        <div className="sys-libraries grid shrink-0 gap-3.5 @3xl:grid-cols-2 @6xl:h-[260px] @6xl:grid-cols-[1.5fr_1fr_1.05fr]">
          <TechnologyLibrary />
          <ToolLibrary />
          <div className="@3xl:col-span-2 @6xl:col-span-1">
            <CurrentlyExploring />
          </div>
        </div>
      </div>
    </div>
  );
}
