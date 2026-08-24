"use client";

import { SearchX } from "lucide-react";
import { ProjectCard } from "./ProjectCard";
import type { Project } from "./types";

/**
 * FOUR ACROSS AND TWO DEEP, with the row height authored in `globals.css` rather
 * than left to the content.
 *
 * `auto-rows-fr` is doing the load-bearing work: the eight cards carry summaries of
 * different lengths and stacks of different widths, so content-sized rows would
 * give the grid two different heights and a ragged fold across the middle. Equal
 * rows mean the eight footers line up, which is what makes a roster read as a
 * roster rather than as eight cards that happen to be adjacent.
 *
 * The card absorbs the difference internally — its tag row carries `mt-auto`, so a
 * short summary pushes the stack and the footer down to the same line as its
 * neighbours instead of leaving a hole above them.
 */
export function ProjectGrid({ projects }: { projects: readonly Project[] }) {
  if (projects.length === 0) return <EmptyRoster />;

  return (
    <section
      aria-label="Projects"
      // `h-full` and `auto-rows-fr` are the WIDE-TIER shape and both are overridden
      // below 1152 by `.proj-grid > section` in globals.css — equal rows only make
      // sense while the grid has a fixed height to divide.
      className="grid h-full auto-rows-fr grid-cols-1 gap-[18px] @2xl:grid-cols-2 @5xl:grid-cols-3 @6xl:grid-cols-4"
    >
      {projects.map((project, index) => (
        <ProjectCard key={project.id} project={project} index={index} />
      ))}
    </section>
  );
}

/**
 * THE EMPTY STATE IS A REAL STATE, NOT A FALLBACK.
 *
 * Every filter on this console is capable of returning nothing — a category
 * crossed with a status, or a search for a technology no project lists — and a grid
 * that simply renders no children leaves an 550-unit hole with the console's
 * background showing through, which reads as a rendering failure rather than as an
 * answer. Saying so, in the same housing language as everything around it, is the
 * difference between "no results" and "something broke".
 */
function EmptyRoster() {
  return (
    <div
      role="status"
      className="border-panel-edge flex h-full flex-col items-center justify-center gap-3 rounded-[4px] border border-dashed bg-[rgb(190_205_220/0.015)]"
    >
      <SearchX size={26} strokeWidth={1.5} aria-hidden="true" className="text-t3" />
      <p className="text-t2 text-[13px] leading-none">No projects match those filters.</p>
      <p className="text-t3 tracking-micro font-mono text-[10px] uppercase">
        Clear a filter to see the full roster
      </p>
    </div>
  );
}
