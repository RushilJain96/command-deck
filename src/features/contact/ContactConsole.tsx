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

      {/* Full-height, like the terminal's: every section on this console is inset to
          clear the rail, so there is no full-width band for it to stop above. */}
      <ConsoleRail activeId="contact" className="about-rail" />

      {/*
        THE VERTICAL BUDGET. 1024 units, top to bottom:

          top bar          14 .. 76     sibling of this scene, not in this column
          pad                     96
          header                  76
          gap                     16
          main                   580    about | connect
          gap                     16
          band                   174
          footer                  66    also a sibling; this column stops above it

        The reference runs its main row at 518 and its band at 174. The band is kept
        exactly — three columns of two-line copy is a measured height, and shrinking
        it would clip the third line — while the main row takes the 62 units the
        reference leaves as slack under its panels. Both panels are `h-full`, so the
        extra goes to the bio's leading and the four channel rows rather than to a
        gap at the bottom of the frame.

        THE COLUMNS ARE 0.69fr / 1fr, which is the reference's 534:776 measured off
        the image and reduced. Authored as a ratio rather than a fixed 534 so the
        split survives a frame that is not 1536 wide — the design frame's width
        tracks the window's aspect ratio, so it very often is not.
      */}
      <div className="relative flex h-full flex-col gap-4 px-7 pt-[96px] pb-[66px]">
        <div className="about-header shrink-0 @6xl:pl-[46px]">
          <ContactHeader />
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 @4xl:grid-cols-[0.69fr_1fr] @6xl:pl-[46px]">
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
