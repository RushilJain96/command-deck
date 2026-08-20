/**
 * ONE TYPE SCALE FOR THE CONSOLE'S FOUR PANEL HEADINGS.
 *
 * <HudPanel>'s default eyebrow is 9px `--text-tertiary` on 0.2em tracking. That is
 * correct where it was designed: the deck's instrument rail is 176 units wide, the
 * panels are stacked three-deep in a column, and the label's whole job is to name a
 * readout without competing with the figure under it.
 *
 * It is wrong here, and measurably so. These panels are 400 to 900 units across and
 * they are SECTIONS of a page — "TECHNOLOGIES I WORK WITH" is the title of a
 * nineteen-item library, not a caption on a gauge. At 9px tertiary it was smaller
 * and dimmer than the technology names inside it, which inverts the hierarchy: the
 * eye found the contents before it found what they were.
 *
 * 13px on `--text-primary` at 0.14em, with an 18px glyph. Three things move
 * together and all three are needed — size alone on a tertiary tone still reads as
 * a caption, and tone alone at 9px still reads as fine print.
 *
 * It is a constant rather than a prop default because all four panels must agree.
 * A console whose section headings are set at three sizes has no heading level, it
 * has four separate decisions.
 */
export const PANEL_LABEL = "text-t1 text-[13px] tracking-[0.14em]";

/** Paired with PANEL_LABEL — a 12px glyph beside 13px type reads as an afterthought. */
export const PANEL_ICON_SIZE = 18;
