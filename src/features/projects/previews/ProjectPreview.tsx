import type { ComponentType } from "react";
import type { PreviewKind } from "../types";
import { PreviewFrame } from "./primitives";
import {
  ChatSchematic,
  ConsoleMapSchematic,
  DagSchematic,
  GatewaySchematic,
  IacTopologySchematic,
  PipelineSchematic,
  ScorePanelSchematic,
  ThreatMapSchematic,
  type SchematicProps,
} from "./schematics";

/**
 * A TABLE, NOT A SWITCH STATEMENT.
 *
 * `PreviewKind` is a closed union, so a `Record` keyed by it is checked by the
 * compiler: adding a ninth kind to the union breaks this line until the schematic
 * exists. A switch with a `default` would silently fall back and the new card
 * would ship with the wrong picture.
 */
const SCHEMATICS: Record<PreviewKind, ComponentType<SchematicProps>> = {
  "console-map": ConsoleMapSchematic,
  "score-panel": ScorePanelSchematic,
  dag: DagSchematic,
  gateway: GatewaySchematic,
  chat: ChatSchematic,
  pipeline: PipelineSchematic,
  "iac-topology": IacTopologySchematic,
  "threat-map": ThreatMapSchematic,
};

/**
 * The preview well.
 *
 * IT IS `aria-hidden` ALL THE WAY DOWN, and that is the right call rather than a
 * shortcut. The schematic depicts nothing a screen reader user could act on — it
 * is a caricature of a screen, with no real values in it — so describing it would
 * mean inventing content ("a chart showing eight bars") that does not exist. The
 * card's actual meaning is in its name, its subtitle and its summary, all of which
 * are real text a few units below.
 *
 * The frame carries the inset edge and the top highlight rather than the schematic
 * doing it in SVG, so the well reads as a recessed screen set INTO the card —
 * which is the one thing the reference's previews do that a flat rectangle of
 * artwork does not.
 */
export function ProjectPreview({ kind, accent }: { kind: PreviewKind; accent: string }) {
  const Schematic = SCHEMATICS[kind];

  return (
    <div
      aria-hidden="true"
      className="border-panel-rule relative w-full overflow-hidden rounded-[3px] border shadow-[inset_0_1px_0_0_rgb(255_255_255/0.05),inset_0_0_22px_-12px_rgb(0_0_0/0.9)]"
      style={{ height: "var(--preview-h)" }}
    >
      <PreviewFrame>
        <Schematic accent={accent} />
      </PreviewFrame>

      {/* The screen's own light, spilling from the top edge in the card's accent.
          Very low alpha — it is what stops eight dark rectangles reading as eight
          holes punched in the grid. */}
      <span
        className="pointer-events-none absolute inset-0 opacity-70 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `linear-gradient(180deg, ${accent}14, transparent 46%)`,
        }}
      />
    </div>
  );
}
