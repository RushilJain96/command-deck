"use client";

import type { CSSProperties } from "react";
import { calloutChamfer } from "@/lib/chamfer";
import { cn } from "@/lib/cn";
import type { MissionLod } from "./placement";
import { CALLOUT_TIER, STATUS_FILL, STATUS_LABEL, STATUS_TONE, type Mission } from "./types";

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
  //
  // A SECOND, SMALLER REPRESENTATION USED TO LIVE HERE. `MarkerBody` drew the
  // designator and codename as bare type for modules whose depth resolved to the
  // `marker` tier, and this function picked between the two. With LOD_THRESHOLDS
  // collapsed to a single level it became unreachable, and it is gone rather
  // than left standing: every module is the same housing now, which is the whole
  // point — see CALLOUT_SCALE.
  return <PanelBody mission={mission} lod={lod} isActive={isActive} className="block" />;
}

function PanelBody({
  mission,
  lod,
  isActive,
  className,
}: MissionPanelProps & { className: string }) {
  const { title, summary, status, icon: Icon } = mission;

  // "MISSION-01" -> "MISSION 001". The roster's id is the canonical index, so the
  // label is derived rather than stored twice.
  const designator = `MISSION ${mission.id.split("-")[1].padStart(3, "0")}`;
  const tone = STATUS_TONE[status];

  // Box width and the two type steps that go with it. See CALLOUT_TIER — this is
  // a WIDTH ramp, deliberately not a `scale()`, so the designator and the status
  // strip stay at one size on every card while the box recedes.
  const spec = CALLOUT_TIER[mission.tier];

  // ONE CHAMFER, NOT A MIRRORED PAIR, AND NO MIRRORED CONTENT EITHER.
  //
  // Every housing on the left half of the deck used to be flipped: chamfer on
  // the other corner, status rail on the other edge, `flex-row-reverse` through
  // the whole card, text right-aligned. The argument was that the deep cut
  // should always fall on the corner facing away from the spacecraft, so the
  // set leaned inward toward the vehicle.
  //
  // It is the single largest reason the modules did not read as a matched set.
  // Six cards in two mirror-image variants are six cards of two DIFFERENT
  // SHAPES, and the eye reads shape before it reads content — so a board that
  // was meant to be a comparison of six missions presented as two groups of
  // three. Right-aligned prose in half of them made it worse, because ragged-left
  // text is measurably slower to read and there was no reason for it beyond
  // symmetry.
  //
  // Uniform wins. The chamfer, the rail, the alignment and the reading order are
  // identical on all six, and the deck gets its symmetry from where the modules
  // are PLACED instead of from how they are built.
  const clip = { clipPath: calloutChamfer() } as CSSProperties;

  // The summary is the first thing to go when space is tight: it is the only
  // part that is prose rather than identity.
  //
  // `|| isActive` USED TO BE HERE AND WAS REMOVED, on evidence. Targeting a
  // module promotes it to `hero` scale, and a distant mission that ALSO gained
  // the summary grew from a 30px marker to a 152px card — DATAFLOW and NEXUS sit
  // nearest the top of the ring, so that expansion drove them straight through
  // the top bar at most desktop sizes. The layout solver's hover sweep reports
  // it at eleven viewports.
  //
  // Dropping it is not merely the cheap fix, it is the more consistent rule.
  // Level of detail encodes DISTANCE and prominence encodes ATTENTION; they are
  // separate axes, and letting a hover add prose was the one place attention
  // reached over and rewrote distance. A far module under the pointer now gets
  // larger, brighter and lit — it does not become the most detailed thing on a
  // deck it is furthest from. Identity, title and lifecycle are all still there,
  // and the full text remains in the accessibility tree either way.
  // `lod` is still the tier cap (md hides prose on every card); `spec.showSummary`
  // is the DEPTH rule that came back — see CALLOUT_TIER. Both have to agree.
  const showSummary = lod === "full" && spec.showSummary;

  return (
    <span className={cn("relative", className)}>
      {/* ELEVATION SHADOW. The card floats well clear of the plane behind it.
          A 25px drop at 50px of blur is a long throw, which is the whole point —
          shadow distance is how the eye reads height, and a tight shadow reads as
          something resting on a surface however dark you make it.

          THIS REPLACES A CONTACT SHADOW, AND THE TWO ARE OPPOSITES. The old one
          was `inset-0 translate-y-2 bg-black/30` — an 8px offset whose note said
          in as many words "occlusion at the join, not separation from it; the
          module is mounted on the deck, not floating above it". That was correct
          when the cards stood on the plane on tethers. They are detached, lifted
          20px and tilted now, so a contact shadow was asserting the one thing the
          composition no longer claims.

          NOT CLIPPED, AND THAT IS DELIBERATE. Every other layer in this housing
          carries the chamfer `clip`, and `clip-path` removes an outward
          box-shadow before it is ever painted — the same trap the active bloom
          below documents. So this sits on the unclipped outer wrapper and is a
          rounded rectangle where the card is mitred. At 50px of blur the 14px
          corner cuts are invisible in the falloff.

          The second stop is ambient rather than cast: a faint suggestion that the
          light the plane emits reaches the underside of the card. It used to be
          cyan, matching an equally cyan plane; both are neutral now. */}
      <span
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          boxShadow:
"0 25px 50px -12px rgb(0 0 0 / 0.8), 0 0 15px rgb(190 205 220 / 0.05)",
        }}
      />

      {/* OUTER BLOOM for the selected module. FIRST, so everything else paints
          over it — a glow that lands on top of the brackets and the bezel
          desaturates both, which turns a lock-on into a smudge.

          On its own element for the reason recorded on the edge light below:
          clip-path removes an outward box-shadow before it is ever painted, so
          light outside a clipped shape has to come from a larger sibling behind
          it. The blur is applied to the element rather than to a shadow, which
          is what lets it keep the housing's silhouette instead of being a
          rectangle. */}
      {isActive && (
        <span
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            ...at(ACTIVATION.accent),
            // AN OUTER BOX-SHADOW, AND NO CLIP-PATH ON THIS ONE.
            //
            // A blurred filled element was the obvious way to do this and it is
            // wrong now that the face is glass: a filled shape sits BEHIND the
            // card as well as around it, and `backdrop-filter` faithfully pulls
            // it through, which turned the whole pane maroon. An outer
            // box-shadow is never painted beneath its own border box, so it can
            // only ever be outside — which is the definition of an outer glow.
            //
            // The cost is that a box-shadow cannot follow the chamfer, so this
            // is a rounded rectangle where the housing is mitred. At 20px of
            // blur that difference is a few pixels of soft light at four
            // corners, and nobody has ever seen it.
            //
            // TWO SHADOWS, AND THE OUTER ONE IS THE POINT NOW. A beam terminates
            // on this card's bottom edge, so the module has to look LIT — not
            // outlined. A single tight 20px halo reads as a border effect; a tight
            // core plus a wide 70px falloff reads as a light source arriving,
            // because that is how illumination actually distributes.
            //
            // PULLED IN FROM 26/70 AT 0.4/0.22. Both halves were sized against a
            // deck whose plane glowed and whose rings ran bright; against a true
            // black void with the field taken down, the same shadow put a red
            // wash across a third of the frame and the hero read as smudged
            // rather than lit. The shape of the falloff is unchanged — tight core,
            // wide skirt — which is the part that was right.
            boxShadow:
              "0 0 18px rgb(255 51 51 / 0.3), 0 0 44px rgb(255 42 42 / 0.14)",
          }}
        />
      )}

      {/* Edge light: the deck's ambient catching the outer 3px of the housing.
          Half strength on hover of what selection gets, so it reads as the part
          being lit rather than as the module announcing itself. Surface stage.

          THIS IS THE MODULE'S OUTER GLOW, AND IT HAS TO BE — a `box-shadow`
          cannot do the job here. Every layer of this housing is clipped with
          `clip-path` to get the mitred chamfer, and clip-path clips box-shadow
          with it, so an outward glow declared on the face or the bezel is
          removed before it is ever painted. A slightly larger sibling BEHIND the
          bezel is the only way to put light outside a clipped shape.

          Neutral, matching the deck's ambient (see <PlaneAurora>) — a module
          catching that light should catch its colour, and that light no longer
          has one. It is permanently on at low level rather than only appearing
          on hover, which is what separates the cards from the background the
          spec asked for — a module that is invisible until pointed at is not
          mounted on anything. */}
      <span
        aria-hidden="true"
        className={cn(
          // A RING, NOT A FILLED RECTANGLE. It was filled, and that was
          // invisible while the face was opaque and covered its middle. The face
          // is glass now, so a filled shape behind it gets refracted straight
          // through by `backdrop-filter` and tints the entire pane. `border`
          // with no background leaves the centre genuinely empty, which is what
          // this layer always meant: the deck's ambient caught on the outer 3px
          // of the housing.
          "absolute -inset-[3px] border-[3px] transition-opacity duration-300",
          isActive ? "opacity-100" : "opacity-45 group-hover:opacity-80",
        )}
        style={{
          ...clip,
          ...at(ACTIVATION.surface),
          // SELECTION TURNS THE GLOW RED, and this is the moment the card stops
          // reflecting and starts emitting. Idle, the edge carries AMBIENT — the
          // neutral light the plane throws, which every object on the deck
          // catches equally. Red is not ambient and is not a property of the
          // module: it is a statement about the OPERATOR, meaning "this is the one
          // you are pointing at".
          //
          // The ambient was cyan until the deck went to a single accent. A second
          // hue sitting on every idle card meant the transition was red-vs-cyan —
          // two colours trading places — rather than lit-vs-unlit, which is the
          // thing actually being communicated.
          borderColor: isActive ? "rgb(255 42 42 / 0.34)" : "rgb(190 205 220 / 0.08)",
        }}
      />

      {/* TARGET BRACKETS. Four corner marks that appear only on the selected
          module, outside the bezel.

          THEY ARE NOT DECORATION — they are the one cue on the card that is
          about the ACT of targeting rather than about the card. Everything else
          selection does (red frame, red title, red status) is the module
          changing state; brackets are a reticle laid over it, and a reticle
          belongs to the instrument doing the looking. That is why they sit
          outside the housing and do not follow the chamfer: a sight is not part
          of the thing it is sighting.

          ONE BORDERED BOX PER CORNER, NOT TWO CRUSSING RULES. The first version
          drew each bracket as a 1px vertical span plus a 1px horizontal span,
          both anchored to the same corner. They meet at a single pixel with no
          mitre, and at 1px the join is ambiguous enough that the pair reads as
          two disconnected lines that happen to be near each other rather than as
          one angle. A box with two adjacent borders gets the corner joined by
          the renderer, which is the entire difference.

          The bracket container is NOT clipped, unlike every other layer in this
          housing. That is deliberate and it is why bordered boxes are safe here:
          `clip-path` would slice the corners off the very marks whose corners
          are the point. A bracket is a sight laid over the module, so it is not
          subject to the module's silhouette. */}
      {/* -2px -> -5px, AND THE MARKS GREW 11 -> 15. At two pixels out the
          brackets sat inside the bezel's own glow and read as thickened corners
          on the border rather than as a separate sight laid over it — the
          lock-on cue was there and doing nothing, because nothing separated it
          from the frame. Five pixels of dark between the two is enough for the
          eye to resolve them as two objects at a glance, which is the whole
          content of the cue. */}
      {isActive && (
        <span aria-hidden="true" className="absolute -inset-[5px]" style={at(ACTIVATION.accent)}>
          {(
            [
              ["top-0 left-0", "border-t-2 border-l-2"],
              ["top-0 right-0", "border-t-2 border-r-2"],
              ["bottom-0 left-0", "border-b-2 border-l-2"],
              ["bottom-0 right-0", "border-b-2 border-r-2"],
            ] as const
          ).map(([corner, edges]) => (
            <span
              key={corner}
              // Same literal as the bezel and the subheader. The three lock cues
              // are one statement and must not be three nearby reds — `--signal`
              // is #ff2a2a, and mixing it in here would put a 9-value hue step
              // between the bracket and the border it sits 2px outside of.
              className={cn("absolute h-[15px] w-[15px] border-[#ff3333]", corner, edges)}
              style={{ filter: "drop-shadow(0 0 6px rgb(255 42 42 / 0.85))" }}
            />
          ))}
        </span>
      )}

      {/* Outer bloom for the selected module, on its own element for the reason
          recorded on the edge light: clip-path removes an outward box-shadow
          before it paints, so light outside a clipped shape has to come from a
          larger sibling behind it. */}
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
          // Cool-white, for the same reason as the edge light above: this
          // hairline is reflecting the deck's ambient, and that ambient is
          // neutral.
          //
          // `border`, NOT `p-px` WITH A BACKGROUND. Those are identical in
          // layout — both inset the face by one pixel — and they are not
          // identical behind glass. A padded box with a background is a FILLED
          // rectangle whose middle happens to be covered; `backdrop-filter` on
          // the face samples that fill across the entire pane and tints it. This
          // was the actual cause of the selected card rendering maroon, and it
          // survived two attempts to fix it by adjusting the things that were
          // not causing it.
          // NO `!important` ANYWHERE IN HERE, DELIBERATELY. The targeting border
          // was specified with one, and it would be inert: this is the only rule
          // that sets `border-color` on this element, so there is nothing for it
          // to win against. An `!important` that beats no competitor is a note
          // saying "something else was fighting me" left behind after the fight
          // ended — the next person to read it goes looking for the other rule.
          "relative block border transition-colors duration-200",
          isActive
            ? "border-[rgb(255_51_51/0.8)]"
            : "border-[rgb(190_205_220/0.11)] group-hover:border-[rgb(190_205_220/0.24)]",
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
        {/**
         * OPAQUE. THE CARD IS A PANEL, NOT A WINDOW.
         *
         * THIS REVERSES THE FROSTED-GLASS DECISION THIS FILE USED TO ARGUE FOR,
         * and the old argument is worth keeping because it was not wrong, it was
         * answering a different question. It said: a mission callout sits over
         * the bead rings and the plane's central glow, that is structure with
         * detail in it, and blurring it is the difference between a card ON the scene and a
         * panel IN it. True — a translucent card does integrate better.
         *
         * What it cost is legibility, and legibility is not negotiable here. A
         * 12px blur does not remove the rings, it smears them, so every line of
         * body copy sat on a moving, unpredictable ground: the same grey text
         * read cleanly where the card covered empty plane and muddily where it
         * covered a lit ring. Six cards over a field of concentric bright arcs is
         * the worst possible case for backdrop blur, and this deck is exactly
         * that. A mission board's job is to be read.
         *
         * It also buys back real work per frame. `backdrop-filter` costs a
         * backdrop readback and a separable blur PER CARD PER FRAME, inside a
         * transformed rig, and CLAUDE.md notes the radius scales with camera
         * zoom — so the effect was both expensive and quietly unstable.
         *
         * The integration the blur was buying now comes from the bezel, the
         * edge light and the contact shadow, none of which cost a readback and
         * none of which touch the text.
         */}
        <span
          className={cn(
            "relative flex items-stretch text-left",
            // THE SELECTED CARD'S FILL IS NOT RED. Only its edge is.
            //
            // A first cut tinted the fill warm to match the frame and the result
            // was a maroon pane: the tinted base, the red inset rim and the red
            // bloom behind it composite, and three faint reds stack into one
            // solid one. It also took the body copy — grey on a dark navy — down
            // to grey on brown, which is a contrast loss for no gain.
            //
            // Selection is carried by the border, the brackets, the title, the
            // status and the bloom. That is five cues; the sixth would have cost
            // legibility. The fill only goes slightly LIGHTER, so the focused
            // module's text sits on a marginally steadier ground than its
            // neighbours' — which is what elevation should buy.
            isActive
              // MATCHED TO THE INSTRUMENT RAIL, AND FLATTER THAN IT WAS.
              //
              // The rail is `--panel-fill` = rgb(9 11 15 / 0.72) over a black
              // ground, which composites to #06080b. These gradients ran
              // #0f1620 -> #080d15 idle, so the top of every card was roughly
              // twice the luminance of the sidebar next to it and carried a
              // visible blue cast — two instrument surfaces in the same frame
              // reading as two different materials.
              //
              // The ramp survives at a tenth of its old range: enough that the
              // face is not a flat swatch, not enough to read as a separate
              // colour from the rail. Active lifts by about the same amount the
              // old pair differed by, so selection still brightens the surface.
              ? "bg-[linear-gradient(180deg,#0c1017,#080b11)]"
              : "bg-[linear-gradient(180deg,#07090d,#050709)]",
            // Top lip catches the light, bottom edge falls into shadow. This
            // directional pair is what sells "machined part" on a dark surface.
            //
            // THE LIP IS THE HOVER RESPONSE. Reflectance, not illumination: the
            // deck's light does not get brighter when the pointer arrives, so
            // nothing here should emit more. What can honestly change is how
            // much of that fixed light the top edge returns — 0.10 to 0.16 is a
            // specular the eye reads as the part turning very slightly into the
            // light, and it is the only thing the face itself does.
            // The third inset on each of these is the RIM LIGHT — the deck's
            // ambient caught on the inside of the glass, neutral at rest and red
            // once the module is the one being pointed at. On an opaque card it
            // would be invisible; on a translucent one it is what gives the pane
            // a thickness, because a sheet of glass is lit at its edges and not
            // across its face.
            "transition-shadow duration-300",
            isActive
              ? "shadow-[inset_0_1px_0_0_rgb(255_255_255/0.18),inset_0_-1px_0_0_rgb(0_0_0/0.6),inset_0_0_14px_0_rgb(255_42_42/0.09)]"
              : "shadow-[inset_0_1px_0_0_rgb(255_255_255/0.10),inset_0_-1px_0_0_rgb(0_0_0/0.6),inset_0_0_10px_0_rgb(190_205_220/0.06)] group-hover:shadow-[inset_0_1px_0_0_rgb(255_255_255/0.16),inset_0_-1px_0_0_rgb(0_0_0/0.6),inset_0_0_10px_0_rgb(190_205_220/0.1)]",
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
              background: isActive
                ? // LIT FROM BELOW, BECAUSE THAT IS WHERE THE LIGHT COMES FROM.
                  //
                  // Every other surface on this deck is lit from above, and this
                  // gradient used to be too — a cool wash falling from the top
                  // lip. On the TARGETED module that is now wrong: a beam arrives
                  // at the bottom edge, and the one thing a light source must do
                  // is light the surface it lands on, from the side it lands on.
                  //
                  // So the selected card inverts. Warm red rising from the bottom
                  // where the beam terminates, falling off by 70% of the height,
                  // with the cool top lip kept underneath it so the module still
                  // reads as a physical part rather than as a red rectangle.
                  "linear-gradient(0deg, rgb(255 60 60 / 0.17), rgb(255 60 60 / 0.05) 42%, transparent 70%)," +
                  "linear-gradient(180deg, rgb(214 230 255 / 0.03), transparent 58%)"
                : "linear-gradient(180deg, rgb(214 230 255 / 0.028), transparent 58%)",
            }}
          />

          <StatusRail status={status} isActive={isActive} />

          {/* THE WIDTH MUST BE DEFINITE. This column's containing block is the
              zero-width <button> at the node's anchor point, so shrink-to-fit
              resolves "available width" to 0 and the box collapses to
              min-content — which rendered the summary one short word per line
              and made every panel a tall ragged column. `max-width` cannot fix
              that; only an explicit width can.

              THE `lg` COLUMN CAME DOWN FROM 200px TO 176px, AND THE TEXT
              MEASURE WITH IT — 160px to 136px. That is a real cost: two-line
              summaries clamp harder than they used to. It buys the deck-md
              threshold, which is the larger prize. The panel box is the second
              biggest term in the --orbit-radius reserve after the rail, and
              dropping both is what let the full instrument layout reach 1180px
              instead of stopping at 1500px, where most laptops never saw it.
              3px rail + 176 + 2px bezel = the 181px outer box the solver models.

              `deck-sm` is the same 11rem as `lg` and is NOT redundant: below
              620px BOTH media queries match, so it exists to beat deck-md's
              9.25rem in the cascade. (It is moot in practice — no callout is
              drawn at that tier — but a silently wrong value here would be
              waiting for whoever changes that.) */}
          {/* 13.75rem -> 10.5rem WHEN THE CALLOUTS WERE CENTRED, AND THE WHOLE
              REDUCTION IS GEOMETRY RATHER THAN TASTE.

              A side-hung card occupies its full width on ONE side of its anchor;
              a centred one occupies half its width on BOTH, so the same box
              sweeps a wider band of the ring and neighbouring anchors start
              fighting. The binding pair is ORION against AURORA: their anchors
              are 0.64R apart horizontally, and two centred cards need
              `1.05 * box + 8` of that (1.15 for a targeted ORION, 0.95 for
              AURORA, plus the solver's 8px margin). At the old 220px column that
              demanded R > 382, which almost nothing solves to — 1600x900 gives
              374 — so the deck overlapped nearly everywhere.

              168px puts the requirement at R > 298, which clears every lg
              viewport down to 1366x768 (height-bound at R=300, with 2px to
              spare). That last 6px of margin is why this is 10.5rem and not the
              11rem it would otherwise round to.

              The focal card barely moves: 168 * 1.15 = 193 against the 230 ORION
              was drawn at. What shrinks is everything else, which is the
              hierarchy that was asked for.

              `deck-sm` is no longer larger than `deck-md`. It used to be 11rem
              against md's 11.5rem, which was harmless only because no callout is
              drawn at that tier; leaving an inverted pair in the cascade is a
              trap for whoever changes that. */}
          <span
            className={cn(
              "relative flex flex-col",
              // PER-TIER WIDTH, from CALLOUT_TIER. Every card used to be exactly
              // 16rem, and before that the width had been walked 13.75 -> 10.5 ->
              // 9.75 across three turns purely to make the collision solver pass,
              // which is the tail wagging the dog. Detaching the cards from the
              // ring removed that constraint: the arrangement is authored, so
              // spacing is a thing you choose rather than a thing you inherit.
              //
              // The tiers run 250 / 215 / 178 / 157, measured off the reference
              // where the cards occupy roughly 10-16% of the frame width. NOT a
              // transform — see the note on CALLOUT_TIER for why the distinction
              // between scaling the box and scaling its contents is the whole
              // reason a size ramp is viable this time.
              //
              // Below `deck-md` the ramp collapses to one width. The narrow tiers
              // have no room for a hierarchy of boxes, and a 157px card at that
              // size is a card nobody can read.
              "w-[var(--callout-w)]",
            )}
            style={{ "--callout-w": `${spec.w}px` } as CSSProperties}
          >
            {/* SECTION 1 — NAMEPLATE. Recessed, seamed off from the body, and
                the only part of the module that changes ground when selected.
                A designator engraved into its own plate is how every piece of
                real hardware is identified. */}
            <span
              className={cn(
                "relative flex items-center gap-2 py-[7px]",
                spec.padX,
                "border-b border-black/45",
                "font-mono text-[10.5px] leading-none",
                "tracking-micro transition-colors duration-300",
                // HOVER BRINGS UP THE ENGRAVING, NOT THE PLATE. The ground stays
                // recessed — changing it is what selection does, and the two
                // states must not be the same gesture at different strengths.
                // All hover does is make the designator legible enough to act
                // on, which is what "available" means.
                // THE WHOLE SUBHEADER GOES RED, NOT JUST THE DESIGNATOR. Only
                // `M-01` used to redden, which left "M-01 / ORION" reading as
                // half-lit — the designator answering the pointer and the
                // codename beside it still at rest. They are one identifier
                // rendered as two spans, and an identifier does not change colour
                // halfway through.
                isActive
                  ? "bg-white/[0.065] text-[#ff3333]"
                  : "text-t3 group-hover:text-t2 bg-black/[0.18]",
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
                  "bg-signal absolute inset-y-0 left-0 w-[2px] transition-opacity duration-300",
                  isActive ? "opacity-100" : "opacity-0",
                )}
              />
              {/* ICON THEN DESIGNATOR, STACKED ABOVE THE TITLE.
                  This line used to read "M-01 / ORION" — designator, separator,
                  codename — which put two names on one row and left the actual
                  project title competing with them below. The reference splits
                  the job: this row is a QUIET INDEX ("which mission is this"),
                  and the row under it is the LOUD NAME. Two registers, one each.

                  The codename is no longer drawn. It is a third name for the same
                  thing, and with `title` promoted to the headline it had nothing
                  left to say that the index and the title do not. It stays on the
                  record and in the accessibility description below. */}
              <Icon size={12} strokeWidth={1.75} aria-hidden="true" className="shrink-0" />
              <span>{designator}</span>
            </span>

            {/* SECTION 2 — BODY. The lit face of the module; carries the name
                and, at full detail, the one line of prose. */}
            <span
              className={cn(
                // px-4/py-2, down from px-5/py-2.5. Six full-size cards have to
                // share a vertical budget that three full and three reduced ones
                // never tested, and padding is the cheapest 9px of card height
                // available — it costs no words.
                "flex flex-col py-4 transition-shadow duration-300",
                spec.padX,
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
                  "truncate leading-[1.2] font-semibold tracking-[-0.01em] transition-colors duration-300",
                  spec.title,
                  // THE SELECTED TITLE IS WHITE, NOT RED — reversing an earlier
                  // call. The argument for red was that leaving the title white
                  // while the frame turned red would read as the frame being
                  // selected and the content not. What actually happens is worse:
                  // the title is the highest-contrast element on the card, so
                  // reddening it drops #f2f5f8 to #ff2a2a against a near-black
                  // face — a large contrast LOSS on the one line every reader is
                  // scanning for, at the exact moment the card is being read.
                  //
                  // The reference keeps it white and puts the red where nothing
                  // has to be read through it: the bezel, the brackets, the
                  // nameplate and the status word. Selection gets brighter, and
                  // the title goes UP to pure white rather than sideways into a
                  // hue.
                  isActive ? "text-white" : "text-[#cfd8e2]",
                )}
                style={at(ACTIVATION.surface)}
              >
                {title}
              </span>

              {showSummary && (
                <span
                  className={cn(
                    // `text-t2` is #98a2ad — about 6.4:1 against the opaque
                    // #0f1620 face. It measured far worse before, because the
                    // real background was whatever ring happened to be behind the
                    // card. Fixing the ground is what made this colour honest.
                    "text-t2 mt-2 line-clamp-2 leading-[1.5]",
                    spec.summary,
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
                "flex items-center gap-1.5 py-[7px]",
                spec.padX,
                "border-t border-black/45",
                "tracking-micro font-mono text-[10.5px] leading-none",
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
                // SELECTION OVERRIDES THE LIFECYCLE COLOUR, AND THAT IS A REVERSAL
                // OF WHAT THIS COMMENT USED TO SAY.
                //
                // The old rule — "the status COLOUR never changes, because it
                // means something" — was defending against HOVER changing it,
                // and it is still right about that: hover is not new information.
                // Selection is different. A selected module is answering a
                // question the operator asked, and on this deck the answer is
                // always red. Leaving one green word inside an otherwise red
                // frame reads as a rendering miss, not as preserved meaning —
                // and the meaning is not lost, because the lifecycle is still
                // spelled out in words right next to the colour.
                isActive ? "text-signal" : tone.text,
              )}
              style={at(ACTIVATION.status)}
            >
              {/* LABELLED READOUT: field name left, value right.
                  The strip used to be a dot and a word, which is a badge — the
                  same device a notification uses. Naming the field and pushing
                  the value to the opposite edge is what makes it an instrument
                  row, and it gives the eye a fixed column to scan lifecycle down
                  when six modules are on screen at once. */}
              <span className="text-t3">STATUS</span>
              <span className="ml-auto flex items-center gap-1.5">
                <span
                  className={cn(
                    "h-1 w-1",
                    isActive ? "bg-signal" : tone.dot,
                    status !== "PLANNED" && "signal-blink",
                  )}
                />
                {STATUS_LABEL[status]}
              </span>
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
          // THE SELECTED RAIL GOES RED WITH THE REST OF THE FRAME. It is the one
          // part of the card that was still reporting lifecycle colour while
          // everything around it — bezel, brackets, nameplate, status word — had
          // handed over to the selection, so a targeted amber mission wore a
          // bright amber spine inside a red frame. Same rule as the status word
          // (see STATUS_TONE): selection temporarily owns the whole card, which
          // is not the same as amber meaning something new.
          isActive ? "bg-signal" : tone.rail,
          // 0.55 -> 0.38 at rest. Six lit spines on a black ground were reading
          // as the loudest thing in the field of cards; the gauge only has to be
          // findable at rest, because hover and selection both take it to full.
          isActive ? "opacity-100" : "opacity-[0.38] group-hover:opacity-100",
        )}
        style={{ height: STATUS_FILL[status], ...at(ACTIVATION.accent) }}
      />
      {/* Graduations turn the bar into a scale. */}
      <span className="absolute inset-x-0 top-1/3 h-px bg-black/70" />
      <span className="absolute inset-x-0 top-2/3 h-px bg-black/70" />
    </span>
  );
}
