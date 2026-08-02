/**
 * Who is flying this thing.
 *
 * The deck can explain what it IS within a second — an engineering command
 * centre — but until this panel existed it never said who built it or what they
 * care about. A visitor who arrives and cannot answer "whose work is this?"
 * without clicking has been given an interface instead of an introduction.
 *
 * Kept to one thesis line and three focus areas on purpose: this is a caption
 * for the deck, not an about page. Edit here; no component knows the content.
 */
export const OPERATOR = {
  name: "Rushil Jain",
  role: "Engineering Command Center",
  /** One line. Should say what he builds, not how he feels about building. */
  thesis: "Building backend systems that stay predictable under load.",
  focus: ["Distributed Systems", "Backend", "AI Infrastructure"],
  /** Present tense, and specific enough to be checkable. */
  currentFocus: "Event-driven pipelines and observability",
} as const;
