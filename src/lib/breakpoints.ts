// ═══════════════════════════════════════════════════════════════════════════
//   The one breakpoint script needs to know. Media queries cannot read a
//   custom property, so CSS spells the same 960px out (see tokens.css);
//   this is its twin for matchMedia, kept next to nothing else on purpose.
// ═══════════════════════════════════════════════════════════════════════════
export const STACKED_LAYOUT_QUERY = '(max-width: 959px)'
