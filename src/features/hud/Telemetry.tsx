"use client";

import { useState } from "react";
import { useAnimationFrame, useMotionValue } from "framer-motion";
import { useCamera } from "@/features/camera/CameraProvider";
import { MISSIONS } from "@/features/missions/data";
import { HudPanel, HudRow } from "./HudPanel";

/**
 * Live readouts of the interaction engine itself.
 *
 * Everything here is REAL. Nothing on this deck displays invented numbers: the
 * frame time is measured, the zoom is read from the camera's own MotionValue,
 * and the slot count comes from the mission table. An audience of engineers
 * will open DevTools, and a fabricated telemetry panel is the fastest way to
 * lose them.
 *
 * A note on why this is not a MotionValue rendered directly: framer-motion
 * 12.43 does not update an element's text from a MotionValue child, so there is
 * no zero-render path to changing text. Instead the frame accumulator lives in
 * MotionValues (never read during render) and publishes to React state at 2Hz.
 * This component is a leaf, so that re-render reaches nothing else.
 */
const PUBLISH_INTERVAL_MS = 500;

export function Telemetry() {
  const camera = useCamera();

  const frameAccumulator = useMotionValue(0);
  const frameCount = useMotionValue(0);
  const lastPublish = useMotionValue(0);

  const [readout, setReadout] = useState({ frameMs: 0, zoom: 1 });

  useAnimationFrame((timestamp, delta) => {
    frameAccumulator.set(frameAccumulator.get() + delta);
    frameCount.set(frameCount.get() + 1);

    if (timestamp - lastPublish.get() < PUBLISH_INTERVAL_MS) return;

    const count = frameCount.get();
    setReadout({
      frameMs: count > 0 ? frameAccumulator.get() / count : 0,
      zoom: camera.zoom.get(),
    });

    lastPublish.set(timestamp);
    frameAccumulator.set(0);
    frameCount.set(0);
  });

  const deployed = MISSIONS.filter((mission) => mission.status === "DEPLOYED").length;

  return (
    <HudPanel label="Telemetry" className="w-60">
      <HudRow label="Frame" tone="telemetry">
        <span className="flex items-center gap-1.5">
          <span className="signal-blink bg-telemetry h-1.5 w-1.5" />
          {readout.frameMs.toFixed(1)} ms
        </span>
      </HudRow>
      <HudRow label="Zoom" tone="telemetry">
        {readout.zoom.toFixed(2)}&times;
      </HudRow>
      <HudRow label="Deployed" tone="nominal">
        {deployed} / {MISSIONS.length}
      </HudRow>
    </HudPanel>
  );
}
