"use client";

import type { CSSProperties } from "react";
import { ConsoleRail } from "@/features/chrome/ConsoleRail";
import { ConsoleSky } from "@/features/systems/ConsoleSky";
import { AboutPanel } from "./AboutPanel";
import { ConnectPanel } from "./ConnectPanel";
import { ContactHeader } from "./ContactHeader";
import { OpportunityBand } from "./OpportunityBand";

/**
 * The fourth console, lit the same way as the other three. See <SystemsConsole>
 * for why these five custom properties are redeclared per scene rather than
 * threaded through props.
 */
const CONSOLE_SURFACE = {
  "--panel-fill": "rgb(6 8 12 / 0.86)",
  "--panel-border": "rgb(190 205 220 / 0.19)",
  "--panel-rule": "rgb(190 205 220 / 0.13)",
  "--text-secondary": "#a9b4c0",
  "--text-tertiary": "#74808c",
} as CSSProperties;

export function ContactConsole() {
  return (
    <div className="@container absolute inset-0" style={CONSOLE_SURFACE}>
      <ConsoleSky />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 z-10 h-[86px] bg-[linear-gradient(to_bottom,#000_0%,#000_62%,transparent_100%)]"
      />

      {/* THE FOOT NEEDS A SCRIM TOO, and only because this console scrolls.
          The footer is a sibling of the whole scene host with no fill of its own —
          just a hairline and two lines of type — so on a narrow frame, where the
          column scrolls, the bio ran underneath it and both were legible at once.
          At 1536 nothing scrolls and this covers empty ground; on a phone it is
          what gives the footer something to sit on. Its height matches the column's
          own bottom padding, so the two agree about where the page ends. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[66px] bg-[linear-gradient(to_top,#000_0%,#000_42%,transparent_100%)]"
      />

      {/* Ends at the foot of the opportunity band: every section on this console is
          inset to clear the rail, so the band is the last thing it borders. See
          `.about-rail` in globals.css for the arithmetic. */}
      <ConsoleRail activeId="contact" className="about-rail" />

      {/*
        THE VERTICAL BUDGET. 1024 units, top to bottom:

          top bar          14 .. 76     sibling of this scene, not in this column
          pad                     96    every console starts its header here
          header                  72
          gap                     16
          main                   auto   about | connect, each its own height
          gap                     16
          band                   148
          slack                  auto   falls here, above the footer
          footer                  66    also a sibling; this column stops above it

        NEITHER PANEL IS STRETCHED, AND THAT IS THE WHOLE FIX.

        Both were `h-full` inside a 610-unit row. Measured, the bio used 372 of it
        and the connect panel 184 — so the page carried a 188-unit void under one
        column and a 384-unit void under the other, which is a bigger hole than the
        one this pass set out to remove. Equal-height boxes are worth having when
        both are full; here they were manufacturing the emptiness.

        So the row is `items-start` and each panel is exactly as tall as what is in
        it. The bio, being the longer and the more important, is visibly the taller
        column — which is also what makes CONNECT read as secondary without shrinking
        anything inside it. The connect panel grows on its own as addresses are
        added; nothing around it has to be re-solved when they are.

        THE BAND FOLLOWS THE PANELS RATHER THAN BEING PINNED ABOVE THE FOOTER.
        Pinning it was tried and looked worse: with the connect panel ending some
        260 units above the bio, the inter-section gap merged with the space beside
        the bio into one 400-unit hole through the middle-right of the page. Letting
        the band sit directly under the panels keeps the whole composition one
        continuous block and moves the remaining slack to the very bottom of the
        frame, where the footer is already waiting to close it.

        COLUMNS ARE 0.72fr / 1fr. The reference measured 534:776; this is a touch
        wider on the left, because the bio is now the page's primary content and
        gets the room. Authored as a ratio rather than a fixed width so the split
        survives a frame that is not 1536 wide — the design frame's width tracks the
        window's aspect ratio, so it very often is not.
      */}
      <div className="deck-scroll about-stack relative flex h-full flex-col gap-4 overflow-x-hidden overflow-y-auto px-7 pt-[96px] pb-[66px]">
        <div className="about-header shrink-0 @6xl:pl-[46px]">
          <ContactHeader />
        </div>

        {/* ABOUT FIRST AT EVERY WIDTH. Below @4xl the grid is one column and the
            source order decides what a reader meets first — which is why the bio is
            written first in the markup rather than being placed left by a rule that
            disappears on a narrow frame. */}
        <div className="about-main grid grid-cols-1 items-start gap-4 @4xl:grid-cols-[0.72fr_1fr] @6xl:pl-[46px]">
          <AboutPanel />
          <ConnectPanel />
        </div>

        <div className="about-band shrink-0 @6xl:pl-[46px]">
          <OpportunityBand />
        </div>
      </div>
    </div>
  );
}
