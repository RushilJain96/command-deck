"use client";

import { motion } from "framer-motion";
import { JOURNEY_CLOSE } from "./data";

/**
 * THE PAGE'S SIGN-OFF, AND THE THIRD ATTEMPT AT THIS STRIP IS THE ONE THAT STAYS.
 *
 * The first was a stats band whose figures contradicted the Projects and Systems
 * consoles. The second was a "journey spine" — the same five entries replotted on
 * a decade axis, which restated the rail sideways and was cut for it. Both failed
 * the same test: they tried to put more DATA at the foot of a page that had
 * already said everything it knows.
 *
 * This one carries no data at all, which is precisely why it works. A timeline
 * ends, and what belongs at the end of one is not another readout but a sentence.
 * Three beats, centred, between two rules — the shape of a closing statement
 * rather than a panel, and the only element on the console with nothing to
 * interrogate.
 *
 * IT IS NOT A HUD PANEL. Giving it a bordered housing with a corner treatment
 * would file it alongside CURRENTLY and UP NEXT as a fourth instrument, and a
 * reader would go looking for the reading inside it. Bare type on the console's
 * own ground is what makes it read as the page exhaling.
 */
export function ClosingLine() {
  return (
    <motion.aside
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut", delay: 0.5 }}
      className="flex h-full items-center justify-center gap-6"
    >
      <Rule side="left" />

      <p className="tracking-micro flex shrink-0 items-baseline gap-3 font-mono text-[12.5px] whitespace-nowrap uppercase">
        {JOURNEY_CLOSE.map((beat, index) => (
          <span
            key={beat}
            // The last beat is the one the sentence is FOR — the two before it are
            // the setup. Lighting all three would flatten the cadence the line is
            // written in; lighting none would make it furniture.
            className={index === JOURNEY_CLOSE.length - 1 ? "text-signal" : "text-t2"}
          >
            {beat}
          </span>
        ))}
      </p>

      <Rule side="right" />
    </motion.aside>
  );
}

/**
 * A rule that fades out toward the frame rather than stopping dead.
 *
 * A hard-ended hairline either side of centred type reads as a table border with a
 * caption in it. Fading to nothing at the outer end makes the pair read as a
 * flourish around the sentence, which is what they are.
 */
function Rule({ side }: { side: "left" | "right" }) {
  return (
    <span
      aria-hidden="true"
      className="h-px min-w-0 flex-1"
      style={{
        background:
          side === "left"
            ? "linear-gradient(to right, transparent, rgb(190 205 220 / 0.22))"
            : "linear-gradient(to left, transparent, rgb(190 205 220 / 0.22))",
      }}
    />
  );
}
