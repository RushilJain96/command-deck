"use client";

import { useEffect, useState } from "react";

/**
 * Mission time, pinned to the operator's timezone rather than the visitor's.
 *
 * That choice is load-bearing, not thematic: a visitor-local clock would have
 * the server render IST and a client in another zone render its own, so the
 * TIMEZONE LABEL itself would mismatch on hydration. Fixing the zone leaves
 * only the digits nondeterministic, which the placeholder below handles.
 *
 * `suppressHydrationWarning` would be the wrong tool here. It silences the
 * warning but React keeps the server-rendered text, so the deck would display a
 * stale build-time timestamp until the first tick. Rendering a placeholder and
 * filling it from an effect is both correct and self-documenting.
 *
 * The `useState` lives in this leaf deliberately: at 1Hz it must not re-render
 * anything above it.
 */
const ZONE = "Asia/Kolkata";
const ZONE_LABEL = "UTC+5:30";

const FORMAT = new Intl.DateTimeFormat("en-GB", {
  timeZone: ZONE,
  hour12: false,
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

export function MissionClock() {
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    const tick = () => setTime(FORMAT.format(new Date()));
    tick();

    // Align to the next second boundary, otherwise the display drifts against
    // the real second and the digits visibly stutter.
    let interval: number | undefined;
    const align = window.setTimeout(
      () => {
        tick();
        interval = window.setInterval(tick, 1000);
      },
      1000 - (Date.now() % 1000),
    );

    return () => {
      window.clearTimeout(align);
      if (interval !== undefined) window.clearInterval(interval);
    };
  }, []);

  return (
    <span className="flex items-baseline gap-2 font-mono">
      <time className="text-t1 text-[13px] tabular-nums">{time ?? "--:--:--"}</time>
      <span className="text-t3 tracking-micro text-[8.5px]">{ZONE_LABEL}</span>
    </span>
  );
}
