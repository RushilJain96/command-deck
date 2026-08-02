"use client";

import type { CSSProperties } from "react";
import { calloutChamfer } from "@/lib/chamfer";
import { cn } from "@/lib/cn";
import type { MissionLod } from "./placement";
import { STATUS_FILL, STATUS_LABEL, STATUS_TONE, type Mission } from "./types";

/**
 * The mission housing.
 *
 * Positioning, the footprint marker and the docking leader all live in
 * <MissionNode>; this file is only the instrument itself.
 *
 * The chamfer is drawn as TWO stacked clipped layers rather than with a border
 * property, because a border on a clipped box gets sliced off along the
 * diagonal and leaves the cut corner unlined. Stacking a 1px bezel under an
 * inset face, both with the same clip, gives a crisp mitred edge on every side
 * — the detail that makes it read as machined housing rather than a rectangle.
 *
 * LEVEL OF DETAIL runs on two independent axes:
 *
 *   - DEPTH, known in JS (a static constant per mission), sets the resting
 *     level: marker / compact / full.
 *   - VIEWPORT, which must stay CSS-only, caps that level. Reading the
 *     breakpoint in JS would mean measuring the viewport, which is banned — it
 *     breaks first-paint correctness and trips react-hooks/purity.
 *
 * So both representations exist in the DOM and CSS chooses. Hover or focus
 * overrides both axes and expands to full.
 */

interface MissionPanelProps {
  mission: Mission;
  lod: MissionLod;
  isActive: boolean;
  /** Engage delay for the lighting layers, in ms. See the note in MissionNode. */
  glowDelay?: number;
}

export function MissionPanel({ mission, lod, isActive, glowDelay = 0 }: MissionPanelProps) {
  // "center" mirrors the right-hand treatment: content reads left-to-right and
  // the deep chamfer falls on the outer bottom corner either way.
  const isLeft = mission.placement.side === "left";
  const isMarkerAtRest = lod === "marker";

  // ON A PHONE THERE ARE NO CALLOUTS AT ALL.
  //
  // Six labelled nodes cannot share a ring whose radius is capped at 120px —
  // the solver finds no arrangement at 390x844 that avoids overlap, and
  // shrinking cannot fix it because labels have a minimum legible size. Even a
  // single expanded callout runs wider than the phone. So at `deck-sm` the ring
  // keeps its six diamond markers (drawn in <MissionNode>: 5px, incapable of
  // colliding) and ALL identity moves to the target readout strip above the
  // dock. Tap a marker, read the strip.
  //
  // Nothing is lost from the accessibility tree — the per-node description in
  // <MissionNode> is always present — and nothing is lost from the interaction
  // either, because the readout is driven by the same targeting state.
  const markerVisibility = isActive ? "hidden" : isMarkerAtRest ? "block deck-sm:hidden" : "hidden";
  const panelVisibility = isActive
    ? "block deck-sm:hidden"
    : isMarkerAtRest
      ? "hidden"
      : "block deck-sm:hidden";

  return (
    <>
      <MarkerBody mission={mission} isActive={isActive} isLeft={isLeft} className={markerVisibility} />
      <PanelBody
        mission={mission}
        lod={lod}
        isActive={isActive}
        isLeft={isLeft}
        glowDelay={glowDelay}
        className={panelVisibility}
      />
    </>
  );
}

/**
 * Reduced prominence, full identity. A node the operator cannot name is not
 * navigable, so the designator and codename survive at the smallest size.
 */
function MarkerBody({
  mission,
  isActive,
  isLeft,
  className,
}: {
  mission: Mission;
  isActive: boolean;
  isLeft: boolean;
  className: string;
}) {
  return (
    <span
      // No opacity here: recession is applied once, on the <li>, as a
      // continuous function of depth. Dimming again would compound it.
      className={cn("leading-none whitespace-nowrap", isLeft && "text-right", className)}
    >
      <span className="text-t3 tracking-micro block font-mono text-[9px]">{mission.label}</span>
      <span
        className={cn(
          "mt-[3px] block font-mono text-[12.5px] tracking-[0.06em] transition-colors duration-300",
          isActive ? "text-t1" : "text-t2 group-hover:text-t1",
        )}
      >
        {mission.codename}
      </span>
    </span>
  );
}

function PanelBody({
  mission,
  lod,
  isActive,
  isLeft,
  glowDelay,
  className,
}: MissionPanelProps & { isLeft: boolean; className: string }) {
  const { label, codename, title, summary, status } = mission;
  const tone = STATUS_TONE[status];
  const clip = { clipPath: calloutChamfer(isLeft ? "left" : "right") } as CSSProperties;
  const stage = { transitionDelay: `${glowDelay}ms` } as CSSProperties;

  // The summary is the first thing to go when space is tight: it is the only
  // part that is prose rather than identity.
  const showSummary = lod === "full" || isActive;

  return (
    <span className={cn("relative", className)}>
      {/* Cast shadow. A separate chamfered plate offset down and outward, so
          the housing appears to hang above the plane rather than be pasted to
          it. Offset direction matches the deck's single light source. */}
      <span
        aria-hidden="true"
        className="absolute inset-0 translate-y-2 bg-black/60 transition-transform duration-300 group-hover:translate-y-3"
        style={clip}
      />

      {/* Edge light. Grows on hover, which is the "brighter edge lighting" that
          makes the housing feel picked up rather than merely outlined. Arrives
          last in the engage sequence. */}
      <span
        aria-hidden="true"
        className={cn(
          "absolute -inset-[3px] transition-opacity duration-300",
          isActive ? "opacity-100" : "opacity-0 group-hover:opacity-60",
        )}
        style={{
          ...clip,
          ...stage,
          background: isActive ? "rgb(255 59 48 / 0.18)" : "rgb(190 215 255 / 0.10)",
        }}
      />

      {/* Bezel: the 1px mitred edge. */}
      <span
        className={cn(
          "relative block p-px transition-colors duration-300",
          isActive ? "bg-signal/60" : "bg-white/[0.13] group-hover:bg-white/25",
        )}
        style={clip}
      >
        {/* Face */}
        <span
          className={cn(
            "relative flex items-stretch gap-3 px-3.5 py-2.5 text-left",
            "bg-[linear-gradient(158deg,rgb(29_35_44/0.97),rgb(11_14_19/0.98))]",
            // Top lip catches the light, bottom edge falls into shadow. This
            // directional pair is what sells "machined part" on a dark surface.
            "shadow-[inset_0_1px_0_0_rgb(255_255_255/0.10),inset_0_-1px_0_0_rgb(0_0_0/0.6)]",
            isLeft && "flex-row-reverse text-right",
          )}
          style={clip}
        >
          {/* Interior glow, pooled at the inner edge under the light. */}
          <span
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute inset-0 transition-opacity duration-300",
              isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100",
            )}
            style={{
              ...stage,
              background: isActive
                ? `radial-gradient(120% 90% at ${isLeft ? "100%" : "0%"} 0%, rgb(255 59 48 / 0.16), transparent 68%)`
                : `radial-gradient(120% 90% at ${isLeft ? "100%" : "0%"} 0%, rgb(190 215 255 / 0.09), transparent 68%)`,
            }}
          />

          <StatusRail status={status} isActive={isActive} />

          {/* THE WIDTH MUST BE DEFINITE. This column's containing block is the
              zero-width <button> at the node's anchor point, so shrink-to-fit
              resolves "available width" to 0 and the box collapses to
              min-content — which rendered the summary one short word per line
              and made every panel a tall ragged column. `max-width` cannot fix
              that; only an explicit width can. The values are also what the
              layout solver measures against, so they are not free. */}
          <span
            className={cn(
              "relative flex flex-col",
              "w-[10rem] deck-md:w-[6.75rem] deck-sm:w-[8.5rem]",
            )}
          >
            <span
              className={cn(
                "text-t3 tracking-micro flex items-center gap-1.5 font-mono text-[9px] leading-none",
                isLeft && "flex-row-reverse",
              )}
            >
              <span>{label}</span>
              <span aria-hidden="true" className="text-t4">
                /
              </span>
              <span>{codename}</span>
            </span>

            <span
              className={cn(
                "mt-2 truncate text-[14.5px] leading-[1.15] font-medium tracking-[-0.01em] transition-colors duration-300",
                isActive ? "text-t1" : "text-t1/90 group-hover:text-t1",
              )}
            >
              {title}
            </span>

            {showSummary && (
              <span
                className={cn(
                  "text-t2 mt-1.5 line-clamp-2 text-[11.5px] leading-[1.45]",
                  !isActive && "deck-md:hidden",
                )}
              >
                {summary}
              </span>
            )}

            <span
              className={cn(
                "tracking-micro mt-2.5 flex items-center gap-1.5 font-mono text-[9px] leading-none",
                tone.text,
                isLeft && "flex-row-reverse",
              )}
            >
              <span className={cn("h-1 w-1", tone.dot, status !== "PLANNED" && "signal-blink")} />
              {STATUS_LABEL[status]}
            </span>
          </span>
        </span>
      </span>
    </span>
  );
}

/**
 * Lifecycle as a gauge, not a badge: fill HEIGHT encodes how far the mission
 * has progressed, so the three states are comparable at a glance without
 * reading the label.
 */
function StatusRail({ status, isActive }: { status: Mission["status"]; isActive: boolean }) {
  const tone = STATUS_TONE[status];
  return (
    <span className="relative w-[3px] shrink-0 self-stretch bg-black/60">
      <span
        className={cn(
          "absolute bottom-0 left-0 w-full transition-all duration-300",
          tone.rail,
          isActive ? "opacity-100" : "opacity-60 group-hover:opacity-100",
        )}
        style={{ height: STATUS_FILL[status] }}
      />
      {/* Graduations turn the bar into a scale. */}
      <span className="absolute inset-x-0 top-1/3 h-px bg-black/70" />
      <span className="absolute inset-x-0 top-2/3 h-px bg-black/70" />
    </span>
  );
}
