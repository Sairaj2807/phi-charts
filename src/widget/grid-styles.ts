/**
 * The chart grid's rules. Kept apart from grid.ts so the shared component
 * sheet can carry them without importing the grid, which imports the shell.
 * Every colour is a widget token, written on the grid root by the grid, apart
 * from the link group hues, which have one value per theme here. The bar's
 * menus bring their own rules when they load (grid-menus.ts).
 */

/** Link group hues, by letter: eight, repeated for groups I to P. The letter always says which group. */
const HUES_DARK = ['#5b9cf6', '#f0a445', '#4cc38a', '#d673d1', '#3fc1c9', '#d9c34a', '#ef6a6a', '#9d85f2'];
const HUES_LIGHT = ['#1f63c9', '#b8660b', '#17864f', '#a23c9e', '#0e7f86', '#8a7300', '#c0392b', '#6247c4'];
const hues = (theme: 'dark' | 'light', list: readonly string[]): string => [...'ABCDEFGHIJKLMNOP']
  .map((letter, i) => `.phi-grid[data-theme="${theme}"] [data-group="${letter}"] { --phi-group: ${list[i % list.length]}; }`).join('\n');

export const CHART_GRID_CSS = `
.phi-grid { position: relative; display: flex; flex-direction: column; width: 100%; height: 100%; min-width: 0; min-height: 0;
  background: var(--phi-bg); color: var(--phi-tx); font: var(--phi-fs)/1.35 var(--phi-font); }
.phi-grid [hidden] { display: none !important; }
.phi-grid__tabs { display: flex; gap: 2px; padding: 4px; overflow-x: auto; flex: none; background: var(--phi-panel);
  border-bottom: 1px solid var(--phi-bd-soft); scrollbar-width: thin; scrollbar-color: var(--phi-sb-thumb) transparent; }
.phi-grid__tabs::-webkit-scrollbar { height: 6px; }
.phi-grid__tabs::-webkit-scrollbar-thumb { background: var(--phi-sb-thumb); border-radius: 999px; }
.phi-grid__tab { flex: none; height: 26px; padding: 0 10px; border: 1px solid transparent; border-radius: var(--phi-radius);
  background: transparent; color: var(--phi-mut); font: inherit; cursor: pointer; white-space: nowrap; }
.phi-grid__tab:hover { color: var(--phi-tx); background: var(--phi-elev); }
.phi-grid__tab[aria-selected="true"] { color: var(--phi-tx-strong); background: var(--phi-on-bg); border-color: var(--phi-on-bd); }
.phi-grid__tab:focus-visible, .phi-grid__split:focus-visible { outline: 2px solid var(--phi-ring); outline-offset: -2px; }
.phi-grid__cells { position: relative; flex: 1; display: grid; min-height: 0; background: var(--phi-bd-soft); }
.phi-grid__cell { position: relative; min-width: 0; min-height: 0; overflow: hidden; }
.phi-grid__cell::after { content: ''; position: absolute; inset: 0; border: 1px solid transparent; pointer-events: none; z-index: 30; }
.phi-grid[data-single="false"][data-compact="false"]:not([data-maximized="true"]) .phi-grid__cell[data-active="true"]::after { border-color: var(--phi-acc); }
.phi-grid__split { position: relative; z-index: 31; touch-action: none; transition: background .12s; }
.phi-grid__split::before { content: ''; position: absolute; inset: 0 -3px; }
.phi-grid__split[data-axis="row"]::before { inset: -3px 0; }
.phi-grid__split[data-axis="column"] { cursor: col-resize; }
.phi-grid__split[data-axis="row"] { cursor: row-resize; }
.phi-grid__split:hover, .phi-grid__split.is-drag { background: var(--phi-acc); }
.phi-grid:is([data-compact="true"], [data-maximized="true"]) .phi-grid__cells { grid-template: minmax(0,1fr) / minmax(0,1fr) !important; }
.phi-grid:is([data-compact="true"], [data-maximized="true"]) .phi-grid__cell { grid-area: 1 / 1 / 2 / 2 !important; }

/* Dragging a chart by its bar onto another's place. */
.phi-grid[data-single="false"][data-compact="false"]:not([data-maximized="true"]) .phi-grid__cell .phi-topbar { cursor: grab; }
.phi-grid[data-single="false"][data-compact="false"]:not([data-maximized="true"]) .phi-grid__cell .phi-topbar input { cursor: text; }
.phi-grid[data-dragging="true"], .phi-grid[data-dragging="true"] * { cursor: grabbing !important; user-select: none; }
.phi-grid__cell[data-dragging="true"] { opacity: .55; }
.phi-grid__cell[data-drop="true"]::after { border: 2px dashed var(--phi-acc); background: var(--phi-on-bg); }

/* Dense cells: a chart a few hundred pixels across keeps its plot and the
   controls a chart needs every minute; the rest waits for maximize. */
/* One row that scrolls sideways rather than a bar wrapped over a third of the plot. */
.phi-grid__cell[data-dense="true"] :is(.phi-rail, .phi-rail-tab) { display: none; }
.phi-grid__cell[data-dense="true"] .phi-topbar { gap: 2px; padding: 3px 5px; flex-wrap: nowrap; overflow-x: auto; overflow-y: hidden;
  scrollbar-width: none; -webkit-mask-image: linear-gradient(to right, #000 calc(100% - 18px), transparent);
  mask-image: linear-gradient(to right, #000 calc(100% - 18px), transparent); }
.phi-grid__cell[data-dense="true"] .phi-topbar::-webkit-scrollbar { display: none; }
.phi-grid__cell[data-dense="true"] .phi-topbar > * { flex-shrink: 0; }
.phi-grid__cell[data-dense="true"] .phi-sym > input { width: 96px; }
.phi-grid__cell[data-dense="true"] .phi-sym__ex { display: none; }
.phi-grid__cell[data-dense="true"] :is(.phi-topbar__goto, .phi-topbar__objects, .phi-topbar__data, .phi-topbar__watchlist,
  .phi-topbar__news, .phi-topbar__alerts, .phi-topbar__theme, .phi-topbar__branding-slot, .phi-topbar__spacer + .phi-sep) { display: none; }
/* A label goes where its glyph shows: a host's chart type with none keeps its name. */
.phi-grid__cell[data-dense="true"] .phi-topbar > .phi-btn > span:not(.phi-glyph):not(.phi-chev):not([hidden] + span) { display: none; }

/* The grid's own chrome takes the widget's controls; these rules only place it. The bar's strip
   holds its height (a control and its padding) before the bar loads into it (grid-bar.ts). */
.phi-widget.phi-grid__bar { position: relative; display: flex; align-items: center; gap: 4px; flex: none; height: auto;
  min-height: calc(var(--phi-ctl-h) + 9px); padding: 4px 6px; background: var(--phi-panel); border-bottom: 1px solid var(--phi-bd-soft);
  overflow: visible; container: phi-grid-bar / inline-size; }
/* One bar under the charts: the widget's own strip, acting on the active chart. */
.phi-widget.phi-grid__foot { display: block; flex: none; height: auto; min-height: 0; }
.phi-widget.phi-grid__overlay { position: absolute; inset: 0; display: block; background: transparent; pointer-events: none;
  z-index: 80; overflow: visible; }
/* A link group mark: the letter on a panel, the group's hue as a stripe. */
.phi-grid__chip { display: inline-flex; align-items: center; justify-content: center; min-width: 17px; height: 17px;
  padding: 0 4px 0 6px; border-radius: 4px; background: var(--phi-elev-2); color: var(--phi-tx-strong);
  box-shadow: inset 3px 0 0 var(--phi-group, var(--phi-faint)); font: 700 10.5px/1 var(--phi-font); flex: none; }
.phi-grid__chip[data-group="none"] { padding: 0 3px; box-shadow: none; background: transparent; color: var(--phi-faint); }
.phi-grid__chip[data-group="none"] > svg { width: 13px; height: 13px; fill: none; stroke: currentColor; stroke-width: 2;
  stroke-linecap: round; stroke-linejoin: round; }
.phi-grid__mark { display: inline-flex; align-items: center; justify-content: center; height: 24px; min-width: 24px; padding: 0 3px;
  margin-right: 2px; border: 1px solid transparent; border-radius: 6px; background: transparent; cursor: pointer; flex: none; }
.phi-grid__mark:hover { background: var(--phi-elev); border-color: var(--phi-bd-soft); }
.phi-grid__mark:focus-visible { outline: 2px solid var(--phi-ring); outline-offset: -1px; }
.phi-grid__mark--float { position: absolute; top: 6px; left: 6px; z-index: 32; background: var(--phi-panel); border-color: var(--phi-bd-soft); }
${hues('dark', HUES_DARK)}
${hues('light', HUES_LIGHT)}
@media (prefers-reduced-motion: reduce) {
  .phi-grid__split { transition: none; }
}
`;
