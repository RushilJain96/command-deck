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

/**
 * ACTIVATION ORDER. One table, read by this file and by <MissionNode>, so the
 * housing and the hardware it is mounted on cannot drift out of step.
 *
 * A module coming up runs STRUCTURE -> SURFACE -> ACCENT -> STATUS: the frame
 * acknowledges first, then the face catches light, then the instrument channels
 * respond, then lifecycle reports last. That is the order a real panel powers up
 * in, and it is the difference between "six properties changed" and "a system
 * became available".
 *
 * THE WHOLE SPAN IS 105ms, AND THAT CEILING IS THE POINT. Long enough that the
 * order is felt rather than seen; short enough that the module is fully awake
 * inside a third of a second. The previous table ran to 140ms with the lighting
 * arriving last, which was late enough to read as a sequence playing.
 *
 * STRUCTURE IS ZERO, ALWAYS. Something must move on the same frame the pointer
 * lands or the module feels unresponsive no matter how good the rest is.
 *
 * Delays apply on ENGAGE ONLY. Release drops everything together — a staggered
 * retreat reads as lag rather than as choreography, because on the way out the
 * user has already moved on.
 */
export const ACTIVATION = {
  /** Leader, collar, marker, bezel — the frame of the thing. */
  structure: 0,
  /** Face reflectance, seams, title. */
  surface: 35,
  /** Mounting rail and its channel. */
  accent: 70,
  /** Lifecycle strip. */
  status: 105,
} as const;

/** Engage delay for one stage, as an inline style. Release is always immediate. */
const at = (ms: number) => ({ transitionDelay: `${ms}ms` }) as CSSProperties;

interface MissionPanelProps {
  mission: Mission;
  lod: MissionLod;
  isActive: boolean;
}

export function MissionPanel({ mission, lod, isActive }: MissionPanelProps) {
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
  className,
}: MissionPanelProps & { isLeft: boolean; className: string }) {
  const { label, codename, title, summary, status } = mission;
  const tone = STATUS_TONE[status];
  const clip = { clipPath: calloutChamfer(isLeft ? "left" : "right") } as CSSProperties;

  // The summary is the first thing to go when space is tight: it is the only
  // part that is prose rather than identity.
  const showSummary = lod === "full" || isActive;

  return (
    <span className={cn("relative", className)}>
      {/* Contact shadow: occlusion at the join, not separation from it. The
          module is mounted on the deck, not floating above it.

          THE HOUSING NO LONGER RISES ON HOVER, AND THE SHADOW NO LONGER TRAVELS.
          A module bolted to a leader does not lift off its mount when you point
          at it — that was a card animation wearing hardware clothing, and it was
          the single most noticeable thing about the old interaction. What
          replaces it is not motion at all: the same part catching more light.
          The plate stays exactly where it is, at rest and engaged. */}
      <span aria-hidden="true" className="absolute inset-0 translate-y-2 bg-black/30" style={clip} />

      {/* Edge light: the deck's ambient catching the outer 3px of the housing.
          Half strength on hover of what selection gets, so it reads as the part
          being lit rather than as the module announcing itself. Surface stage. */}
      <span
        aria-hidden="true"
        className={cn(
          "absolute -inset-[3px] transition-opacity duration-300",
          isActive ? "opacity-100" : "opacity-0 group-hover:opacity-45",
        )}
        style={{
          ...clip,
          ...at(ACTIVATION.surface),
          background: isActive ? "rgb(214 230 255 / 0.14)" : "rgb(190 215 255 / 0.10)",
        }}
      />

      {/* BEZEL: the 1px mitred edge.
          NEUTRAL WHEN SELECTED, NOT RED. Running the whole perimeter in signal
          red was the module's loudest statement and the weakest one — a colour
          swap on a hairline says "this one is different" without saying
          anything about rank, and it made every other cue redundant. Selection
          now brightens the edge the way a part catches more light when it is
          brought forward, and the red is spent where it means something: two
          pixels on the nameplate.

          HOVER BARELY MOVES IT, AND THAT IS DELIBERATE. The edge used to go to
          0.25 on hover against 0.34 selected — near enough that the two states
          were the same statement at two volumes, which is exactly the confusion
          to avoid. Hover now steps to 0.19: enough to register as the frame
          acknowledging, far enough from 0.34 that selection still owns the
          bright edge. Structure stage, so this is what answers the pointer on
          the first frame. */}
      <span
        className={cn(
          "relative block p-px transition-colors duration-200",
          isActive ? "bg-white/[0.34]" : "bg-white/[0.13] group-hover:bg-white/[0.19]",
        )}
        style={{ ...clip, ...at(ACTIVATION.structure) }}
      >
        {/* FACE. No padding of its own any more — the three sections below run
            edge to edge and carry their own. That is the whole structural move:
            the module stops being one padded box with four lines stacked in it
            and becomes a nameplate, a body and a status strip mounted against a
            spine. Same content, same order, same type sizes; what changed is
            that the hierarchy is now built rather than implied by margins.

            The surface gradient is VERTICAL, not 158deg. A diagonal wash is a
            web-card gradient — it implies a light source nothing else on the
            deck shares. Everything here is lit from above, so the face is
            simply brighter at the top and falls off. */}
        <span
          className={cn(
            "relative flex items-stretch text-left",
            isActive
              ? "bg-[linear-gradient(180deg,rgb(38_45_56/0.985),rgb(16_20_27/0.985))]"
              : "bg-[linear-gradient(180deg,rgb(29_35_44/0.97),rgb(13_16_22/0.98))]",
            // Top lip catches the light, bottom edge falls into shadow. This
            // directional pair is what sells "machined part" on a dark surface.
            //
            // THE LIP IS THE HOVER RESPONSE. Reflectance, not illumination: the
            // deck's light does not get brighter when the pointer arrives, so
            // nothing here should emit more. What can honestly change is how
            // much of that fixed light the top edge returns — 0.10 to 0.16 is a
            // specular the eye reads as the part turning very slightly into the
            // light, and it is the only thing the face itself does.
            "transition-shadow duration-300",
            isActive
              ? "shadow-[inset_0_1px_0_0_rgb(255_255_255/0.18),inset_0_-1px_0_0_rgb(0_0_0/0.6)]"
              : "shadow-[inset_0_1px_0_0_rgb(255_255_255/0.10),inset_0_-1px_0_0_rgb(0_0_0/0.6)] group-hover:shadow-[inset_0_1px_0_0_rgb(255_255_255/0.16),inset_0_-1px_0_0_rgb(0_0_0/0.6)]",
            isLeft && "flex-row-reverse text-right",
          )}
          style={{ ...clip, ...at(ACTIVATION.surface) }}
        >
          {/* Interior lift. Kept as the hover hook it always was, but demoted
              from a coloured pool to a plain brightening of the top edge — a
              lit panel is a glowing panel, and the module should read as
              better-lit rather than as emitting. */}
          <span
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute inset-0 transition-opacity duration-300",
              isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100",
            )}
            style={{
              ...at(ACTIVATION.surface),
              background:
                "linear-gradient(180deg, rgb(214 230 255 / 0.055), transparent 58%)",
            }}
          />

          <StatusRail status={status} isActive={isActive} />

          {/* THE WIDTH MUST BE DEFINITE. This column's containing block is the
              zero-width <button> at the node's anchor point, so shrink-to-fit
              resolves "available width" to 0 and the box collapses to
              min-content — which rendered the summary one short word per line
              and made every panel a tall ragged column. `max-width` cannot fix
              that; only an explicit width can.

              WIDTHS ARE CHOSEN SO THE TEXT MEASURE IS UNCHANGED. The face used
              to pad 14px and gap 12px around a 160px column; the bands now pad
              20px inside a 200px one. 3px rail + 200 + 2px bezel is the same
              205px outer box, and 200 - 40 is the same 160px of text, so no
              summary rewraps and the layout solver's geometry still holds. */}
          <span
            className={cn(
              "relative flex flex-col",
              "w-[12.5rem] deck-md:w-[9.25rem] deck-sm:w-[11rem]",
            )}
          >
            {/* SECTION 1 — NAMEPLATE. Recessed, seamed off from the body, and
                the only part of the module that changes ground when selected.
                A designator engraved into its own plate is how every piece of
                real hardware is identified. */}
            <span
              className={cn(
                "relative flex items-center gap-1.5 px-5 py-[5px]",
                "border-b border-black/45",
                "font-mono text-[9px] leading-none",
                "tracking-micro transition-colors duration-300",
                // HOVER BRINGS UP THE ENGRAVING, NOT THE PLATE. The ground stays
                // recessed — changing it is what selection does, and the two
                // states must not be the same gesture at different strengths.
                // All hover does is make the designator legible enough to act
                // on, which is what "available" means.
                isActive ? "bg-white/[0.065] text-t2" : "text-t3 group-hover:text-t2 bg-black/[0.18]",
                isLeft && "flex-row-reverse",
              )}
              style={at(ACTIVATION.surface)}
            >
              {/* Selection tab. Two pixels on the mounting edge of the
                  nameplate — the entire red cue on a selected module. The
                  bezel no longer turns red at all; importance is carried by the
                  lit nameplate and the raised face behind it, and this is only
                  the flag that says WHICH signal it is. */}
              <span
                aria-hidden="true"
                className={cn(
                  "bg-signal absolute inset-y-0 w-[2px] transition-opacity duration-300",
                  isLeft ? "right-0" : "left-0",
                  isActive ? "opacity-100" : "opacity-0",
                )}
              />
              <span className={cn("transition-colors duration-300", isActive && "text-signal")}>
                {label}
              </span>
              <span aria-hidden="true" className="text-t4">
                /
              </span>
              <span>{codename}</span>
            </span>

            {/* SECTION 2 — BODY. The lit face of the module; carries the name
                and, at full detail, the one line of prose. */}
            <span
              className={cn(
                "flex flex-col px-5 py-2.5 transition-shadow duration-300",
                // The seam is a physical join, and a join catches light. Taking
                // it 0.05 -> 0.09 makes the module read as more assembled rather
                // than more decorated — the panel divisions become legible
                // without any of them getting louder.
                isActive
                  ? "shadow-[inset_0_1px_0_0_rgb(255_255_255/0.09)]"
                  : "shadow-[inset_0_1px_0_0_rgb(255_255_255/0.05)] group-hover:shadow-[inset_0_1px_0_0_rgb(255_255_255/0.09)]",
              )}
              style={at(ACTIVATION.surface)}
            >
              <span
                className={cn(
                  "truncate text-[14.5px] leading-[1.15] font-medium tracking-[-0.01em] transition-colors duration-300",
                  isActive ? "text-t1" : "text-t1/90 group-hover:text-t1",
                )}
                style={at(ACTIVATION.surface)}
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
            </span>

            {/* SECTION 3 — STATUS STRIP. Seamed off the same way as the
                nameplate, so lifecycle stops being the last line of a paragraph
                and becomes a readout with its own field. */}
            <span
              className={cn(
                "flex items-center gap-1.5 px-5 py-[5px]",
                "border-t border-black/45",
                "tracking-micro font-mono text-[9px] leading-none",
                "transition-[background-color,box-shadow] duration-300",
                // LAST TO ANSWER. Lifecycle is the one thing on the module that
                // is a report rather than a property, so it settles after the
                // structure and the surface have — the order a panel powers up
                // in. The field lightens a fraction and its seam catches the
                // same light as the one above; the status COLOUR never changes,
                // because it means something and hover is not new information.
                isActive
                  ? "bg-black/[0.07] shadow-[inset_0_1px_0_0_rgb(255_255_255/0.09)]"
                  : "bg-black/[0.12] shadow-[inset_0_1px_0_0_rgb(255_255_255/0.05)] group-hover:bg-black/[0.07] group-hover:shadow-[inset_0_1px_0_0_rgb(255_255_255/0.09)]",
                tone.text,
                isLeft && "flex-row-reverse",
              )}
              style={at(ACTIVATION.status)}
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
 *
 * NOW A CHANNEL, NOT A STRIPE. It used to be a flat coloured bar with a gap
 * between it and the text, which is the accent stripe of a web card — the same
 * device used to colour-code a notification. Seating it flush against the
 * module's mounting edge and cutting a recess for it (dark well, hard shadow on
 * the inboard wall, a hairline of light on the outboard lip) turns the same
 * three pixels into a gauge let into the housing. It also now runs the full
 * height of all three sections, which is what makes it read as the spine the
 * nameplate, body and status strip are mounted against.
 *
 * The chamfer never touches this edge — `calloutChamfer` cuts the two corners
 * on the side facing AWAY from the spacecraft — so the rail is never clipped,
 * on either hand.
 */
function StatusRail({ status, isActive }: { status: Mission["status"]; isActive: boolean }) {
  const tone = STATUS_TONE[status];
  return (
    <span
      className={cn(
        "relative w-[3px] shrink-0 self-stretch bg-black/70 transition-shadow duration-300",
        // Inboard wall in shadow, outboard lip catching light: the two-sided
        // cue that reads as a groove rather than as paint.
        //
        // The LIP is what responds. A machined edge is the brightest thing on a
        // part because it is the only surface angled back at the light, so
        // taking it 0.07 -> 0.13 sharpens the channel without touching the
        // gauge inside it. The groove gets crisper; nothing gets brighter.
        isActive
          ? "shadow-[inset_1px_0_0_0_rgb(0_0_0/0.85),inset_-1px_0_0_0_rgb(255_255_255/0.13)]"
          : "shadow-[inset_1px_0_0_0_rgb(0_0_0/0.85),inset_-1px_0_0_0_rgb(255_255_255/0.07)] group-hover:shadow-[inset_1px_0_0_0_rgb(0_0_0/0.85),inset_-1px_0_0_0_rgb(255_255_255/0.13)]",
      )}
      style={at(ACTIVATION.accent)}
    >
      <span
        className={cn(
          // `transition-opacity`, not `transition-all`: the fill HEIGHT is a
          // static property of the mission's lifecycle and must never animate —
          // a gauge that slides on hover is reporting a change that did not
          // happen.
          "absolute bottom-0 left-0 w-full transition-opacity duration-300",
          tone.rail,
          isActive ? "opacity-100" : "opacity-55 group-hover:opacity-100",
        )}
        style={{ height: STATUS_FILL[status], ...at(ACTIVATION.accent) }}
      />
      {/* Graduations turn the bar into a scale. */}
      <span className="absolute inset-x-0 top-1/3 h-px bg-black/70" />
      <span className="absolute inset-x-0 top-2/3 h-px bg-black/70" />
    </span>
  );
}
