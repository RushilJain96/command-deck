/**
 * The most recent commit on the portfolio itself.
 *
 * PLACEHOLDER, on the same terms as `stats.ts`: the subject and timestamp are
 * constants here until the GitHub integration lands, and `live` is false so the
 * panel renders its unlit provenance pip rather than claiming the line was
 * fetched. A deck that reports a stale commit as current is worse than one that
 * admits the link is not wired.
 *
 * `relative` is stored pre-formatted rather than as a timestamp on purpose.
 * Deriving "2 hours ago" from a date at render time is a hydration mismatch —
 * the server and the client compute it at different instants — and this panel is
 * not worth a second mount-effect clock. When the integration lands it should
 * arrive already formatted from the same place the subject does.
 */
export const LATEST_COMMIT = {
  subject: "feat: extend the instrument layout down to 1180px",
  relative: "2 hours ago",
  live: false,
} as const;
