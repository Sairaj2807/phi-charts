/**
 * The widget stylesheet: one `<style>` per document, every rule scoped under
 * `.phi-widget`, every colour a token from `tokens.ts`.
 *
 * Nothing here names a colour twice or reaches outside the widget root. A
 * host page keeps its own cascade, and two widgets on one page share the one
 * sheet while carrying their own token values inline, so one can be dark and
 * the other light.
 *
 * The rules follow the craft standard in CLAUDE.md: styled scrollbars on
 * every scrolling surface, no browser-default checkbox, select or colour
 * input, small square swatches, dense rows, muted uppercase section heads.
 * The dialog modules mount inside `.phi-widget`, so they inherit all of it.
 */

import { token as v } from './tokens';
import { ICON_SIZE, ICON_STROKE, CHROME_ICON_SIZE, CHROME_ICON_STROKE } from 'phi-charts/draw';

/** Id of the injected `<style>`; one per document. */
export const WIDGET_STYLE_ID = 'phi-widget-css';

export const WIDGET_CSS = `
.phi-widget { position: relative; display: grid; grid-template-rows: auto 1fr auto; width: 100%; height: 100%;
  min-height: 0; min-width: 0; background: ${v('bg')}; color: ${v('tx')}; font: ${v('fs')}/1.35 ${v('font')};
  -webkit-font-smoothing: antialiased; overflow: hidden; }
.phi-widget, .phi-widget * { box-sizing: border-box; }
.phi-widget.phi-alert-host { position: absolute; inset: 0; display: block; background: transparent; pointer-events: none; z-index: 40; }
.phi-widget[data-theme="dark"] { color-scheme: dark; }
.phi-widget[data-theme="light"] { color-scheme: light; }
.phi-widget button, .phi-widget input, .phi-widget select, .phi-widget textarea { font: inherit; color: inherit; }
.phi-widget button { cursor: pointer; }
.phi-widget kbd { font: 11px/1 ${v('mono')}; font-variant-numeric: tabular-nums; }
.phi-widget [hidden] { display: none !important; }
.phi-widget .phi-row:has(> .phi-input-error:not([hidden])) { flex-wrap: wrap; }
.phi-widget .phi-input-error { flex-basis: 100%; min-width: 0; color: ${v('danger')}; font-size: 11px; overflow-wrap: anywhere; }
.phi-widget .phi-row__ctl:has([data-input-action]) { flex-wrap: wrap; }
.phi-widget .phi-row__ctl [data-input-action] { font-size: 11px; padding: 3px 7px; }
.phi-widget [aria-invalid="true"] { border-color: ${v('danger')}; }
.phi-widget .phi-input-pick { position: absolute; top: 8px; left: 50%; transform: translateX(-50%);
  display: flex; align-items: center; gap: 8px; max-width: calc(100% - 16px); padding: 8px;
  color: ${v('tx')}; background: ${v('panel')}; border: 1px solid ${v('bd')}; border-radius: 6px; pointer-events: auto; }

/* Scrollbars: a thumb one step lighter than its panel, and no visible track. */
.phi-widget * { scrollbar-width: thin; scrollbar-color: ${v('sb-thumb')} transparent; }
.phi-widget ::-webkit-scrollbar { width: 10px; height: 10px; }
.phi-widget ::-webkit-scrollbar-track { background: transparent; }
.phi-widget ::-webkit-scrollbar-thumb { background: ${v('sb-thumb')}; border: 2px solid transparent;
  background-clip: padding-box; border-radius: 999px; }
.phi-widget ::-webkit-scrollbar-thumb:hover { background: ${v('sb-thumb-hover')}; background-clip: padding-box; }
.phi-widget ::-webkit-scrollbar-corner { background: transparent; }

/* Focus: one ring, keyboard only. Text fields glow on the border instead. */
.phi-widget :focus-visible { outline: 2px solid ${v('ring')}; outline-offset: 2px; }
.phi-widget :focus:not(:focus-visible) { outline: none; }
.phi-widget input:not([type=checkbox]):not([type=color]):not([type=range]):focus-visible,
.phi-widget select:focus-visible, .phi-widget textarea:focus-visible {
  outline: none; border-color: ${v('acc')}; box-shadow: 0 0 0 3px ${v('ring-soft')}; }
.phi-widget .phi-sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; border: 0;
  overflow: hidden; clip: rect(0 0 0 0); clip-path: inset(50%); white-space: nowrap; }

/* Form controls: nothing left to the browser on a themed panel. */
.phi-widget input[type=checkbox] { appearance: none; -webkit-appearance: none; flex: none; margin: 0;
  width: 15px; height: 15px; border: 1px solid ${v('bd')}; border-radius: 4px; background: ${v('elev')};
  cursor: pointer; display: inline-grid; place-content: center; transition: background .12s, border-color .12s; }
.phi-widget input[type=checkbox]:hover { border-color: ${v('bd-hover')}; }
.phi-widget input[type=checkbox]:checked { background: ${v('acc')}; border-color: ${v('acc')}; }
.phi-widget input[type=checkbox]:checked::after { content: ''; width: 4px; height: 8px; margin-top: -2px;
  border: solid ${v('bg')}; border-width: 0 2px 2px 0; transform: rotate(45deg); }
.phi-widget input[type=checkbox]:disabled { opacity: .4; cursor: not-allowed; }
/* A radio is the checkbox's round sibling; the dot is an inset ring, which needs no pseudo-element. */
.phi-widget input[type=radio] { appearance: none; -webkit-appearance: none; flex: none; margin: 0; width: 15px; height: 15px;
  border: 1px solid ${v('bd')}; border-radius: 50%; background: ${v('elev')}; cursor: pointer; transition: background .12s, border-color .12s; }
.phi-widget input[type=radio]:hover { border-color: ${v('bd-hover')}; }
.phi-widget input[type=radio]:checked { border-color: ${v('acc')}; background: ${v('acc')}; box-shadow: inset 0 0 0 3px ${v('elev')}; }
.phi-widget select { appearance: none; -webkit-appearance: none; height: ${v('ctl-h')}; padding: 0 24px 0 8px;
  background: ${v('elev')}; border: 1px solid ${v('bd')}; border-radius: ${v('radius')}; cursor: pointer; }
.phi-widget .phi-select { position: relative; display: inline-flex; }
/* The chevron overlays the select rather than sitting beside it. selectBox
   wraps the glyph in an phi-chev span, and this rule used to name
   .phi-select > svg, which that markup has never had: the span stayed an
   ordinary flex item, so it took eleven pixels of the row and left the select
   eleven pixels short of every input beside it, with its arrow outside its own
   box. Sized here rather than left to .phi-chev, whose inline-grid is right
   where a chevron follows a word, as it does in the top bar. */
.phi-widget .phi-select > .phi-chev { position: absolute; right: 7px; top: 50%; width: 11px; height: 11px;
  transform: translateY(-50%); pointer-events: none; display: block; color: ${v('mut')}; }
.phi-widget select option, .phi-widget select optgroup { background: ${v('panel')}; color: ${v('tx')}; }
.phi-widget input[type=color] { width: 26px; height: 26px; padding: 0; flex: none; cursor: pointer; appearance: none;
  -webkit-appearance: none; background-color: ${v('elev')}; border: 1px solid ${v('bd')}; border-radius: ${v('radius')}; }
.phi-widget input[type=color]:hover { border-color: ${v('bd-hover')}; }
.phi-widget input[type=color]::-webkit-color-swatch-wrapper { padding: 3px; }
.phi-widget input[type=color]::-webkit-color-swatch { border: 1px solid rgba(0,0,0,.35); border-radius: 4px; }
.phi-widget input[type=color]::-moz-color-swatch { border: 1px solid rgba(0,0,0,.35); border-radius: 4px; }
.phi-widget .phi-swatch { width: 20px; height: 20px; border-radius: 5px; border: 1px solid rgba(0,0,0,.35); }
.phi-widget input[type=number] { -moz-appearance: textfield; appearance: textfield; }
.phi-widget input[type=number]::-webkit-inner-spin-button, .phi-widget input[type=number]::-webkit-outer-spin-button {
  -webkit-appearance: none; margin: 0; }
.phi-widget input[type=text], .phi-widget input[type=number], .phi-widget input[type=search], .phi-widget textarea {
  height: ${v('ctl-h')}; padding: 0 8px; background: ${v('elev')}; border: 1px solid ${v('bd')}; border-radius: ${v('radius')};
  transition: border-color .15s, box-shadow .15s; }
.phi-widget textarea { height: auto; padding: 6px 8px; }
.phi-widget input::placeholder { color: ${v('faint')}; }
.phi-widget input:hover, .phi-widget select:hover { border-color: ${v('bd-hover')}; }
.phi-widget input[type=range] { appearance: none; -webkit-appearance: none; height: 22px; margin: 0;
  background: transparent; cursor: pointer; }
.phi-widget input[type=range]::-webkit-slider-runnable-track { height: 3px; border-radius: 2px; background: ${v('elev-3')}; }
.phi-widget input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 12px; height: 12px;
  margin-top: -4.5px; border-radius: 50%; background: ${v('acc')}; border: 0; }
.phi-widget input[type=range]::-moz-range-track { height: 3px; border-radius: 2px; background: ${v('elev-3')}; }
.phi-widget input[type=range]::-moz-range-thumb { width: 12px; height: 12px; border-radius: 50%; background: ${v('acc')}; border: 0; }

/* Section heads and rows shared by every panel. */
.phi-widget .phi-head { padding: 8px 10px 4px; color: ${v('faint')}; font-size: 10px; font-weight: 600;
  text-transform: uppercase; letter-spacing: .7px; }
.phi-widget .phi-row { display: flex; align-items: center; gap: 8px; min-height: 26px; padding: 2px 0; }
.phi-widget .phi-row > label { flex: 1 1 auto; min-width: 0; color: ${v('tx')}; }

/* Help mark: a 13px ring after a label, muted until pointed at. It must not
   grow the row, so it sits on the label's own line box and never wraps away
   from the words it belongs to. */
.phi-widget .phi-help { display: inline-flex; align-items: center; justify-content: center;
  width: 13px; height: 13px; margin-left: 5px; vertical-align: -2px; flex: none;
  border: 1px solid ${v('bd')}; border-radius: 50%; color: ${v('faint')};
  font-size: 9px; font-weight: 600; line-height: 1; cursor: help; user-select: none; }
.phi-widget .phi-help:hover { color: ${v('tx')}; border-color: ${v('bd-hover')}; }
/* A heading's rows as one named group, laid out as if the box were not there. */
.phi-widget .phi-form__group { display: contents; }

/* Buttons: flat, 28px tall, a tint when pressed or active. */
.phi-widget .phi-btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  height: ${v('ctl-h')}; padding: 0 9px; background: transparent; border: 1px solid transparent;
  border-radius: ${v('radius')}; color: ${v('tx')}; white-space: nowrap; transition: background .1s, border-color .1s, color .1s; }
.phi-widget .phi-btn:hover { background: ${v('elev')}; border-color: ${v('bd-soft')}; }
.phi-widget .phi-btn.is-on, .phi-widget .phi-btn[aria-pressed="true"], .phi-widget .phi-btn[aria-expanded="true"] {
  background: ${v('on-bg')}; border-color: ${v('on-bd')}; color: ${v('acc-2')}; }
.phi-widget .phi-btn.is-off, .phi-widget .phi-btn[aria-disabled="true"], .phi-widget .phi-btn:disabled {
  color: ${v('faint')}; cursor: default; }
.phi-widget .phi-btn.is-off:hover, .phi-widget .phi-btn[aria-disabled="true"]:hover, .phi-widget .phi-btn:disabled:hover {
  background: transparent; border-color: transparent; }
.phi-widget .phi-btn--icon { width: ${v('ctl-h')}; padding: 0; }
.phi-widget .phi-btn--primary { background: ${v('acc')}; color: ${v('bg')}; border-color: transparent; font-weight: 600; }
.phi-widget .phi-btn--primary:hover { background: ${v('acc-2')}; border-color: transparent; }
.phi-widget .phi-btn--danger:not(.is-off):hover { color: ${v('danger')}; }
.phi-widget .phi-btn > b { font-weight: 700; letter-spacing: .3px; }
.phi-widget .phi-glyph { display: inline-grid; place-items: center; line-height: 0; flex: none; }
.phi-widget .phi-glyph > svg { fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; }
.phi-widget .phi-glyph--tool > svg { width: ${ICON_SIZE}px; height: ${ICON_SIZE}px; stroke-width: ${ICON_STROKE}; }
.phi-widget .phi-glyph--chrome > svg { width: ${CHROME_ICON_SIZE}px; height: ${CHROME_ICON_SIZE}px; stroke-width: ${CHROME_ICON_STROKE}; }
.phi-widget .phi-glyph--text { display: inline-grid; place-items: center; width: ${ICON_SIZE}px; height: ${ICON_SIZE}px;
  font-size: 12px; font-weight: 600; }
.phi-widget .phi-chev { display: inline-grid; place-items: center; line-height: 0; color: ${v('mut')}; }
.phi-widget .phi-chev > svg { width: 11px; height: 11px; fill: none; stroke: currentColor; stroke-width: 1.5;
  stroke-linecap: round; stroke-linejoin: round; }
.phi-widget .phi-sep { width: 1px; height: 20px; background: ${v('bd-soft')}; margin: 0 2px; flex: none; }

/* Top bar */
.phi-widget .phi-topbar { grid-row: 1; display: flex; align-items: center; gap: 4px; min-height: ${v('topbar-h')};
  padding: 5px 8px; background: ${v('panel')}; border-bottom: 1px solid ${v('bd-soft')}; flex-wrap: wrap; }
.phi-widget .phi-topbar__spacer { flex: 1 1 auto; }
.phi-widget .phi-topbar__branding-slot { display: inline-flex; align-items: center; }
.phi-widget .phi-topbar__branding { color: ${v('mut')}; font-size: 11px; text-decoration: none; white-space: nowrap; }
.phi-widget .phi-topbar__branding:hover { color: ${v('tx')}; text-decoration: underline; }
.phi-widget .phi-sym { position: relative; display: inline-flex; align-items: center; }
.phi-widget .phi-sym > input { width: 132px; height: ${v('ctl-h')}; padding: 0 8px 0 28px; font-weight: 600;
  letter-spacing: .3px; text-transform: uppercase; }
.phi-widget .phi-sym > .phi-glyph { position: absolute; left: 8px; color: ${v('mut')}; pointer-events: none; }
.phi-widget .phi-sym__ex { margin-left: 6px; color: ${v('faint')}; font-size: 11px; font-weight: 600; letter-spacing: .5px; }
.phi-widget .phi-pills { display: inline-flex; background: ${v('elev')}; border: 1px solid ${v('bd-soft')};
  border-radius: 7px; padding: 2px; }
.phi-widget .phi-pills > button { height: 22px; padding: 0 8px; background: transparent; border: 0; border-radius: 5px;
  color: ${v('mut')}; font-weight: 600; font-size: 11.5px; letter-spacing: .2px; }
.phi-widget .phi-pills > button:hover { color: ${v('tx')}; }
.phi-widget .phi-pills > button[aria-pressed="true"] { background: ${v('elev-2')}; color: ${v('acc-2')}; }
.phi-widget .phi-pills > button:focus-visible { outline-offset: -1px; }

/* Popup menu (chart types, screenshot, symbol results) */
.phi-widget .phi-menu { min-width: 190px; max-width: 320px; max-height: 60vh; overflow-y: auto; padding: 5px;
  background: ${v('panel')}; border: 1px solid ${v('bd')}; border-radius: 9px; box-shadow: ${v('shadow')}; outline: none; }
.phi-widget .phi-menu__find { padding: 3px 3px 6px; }
.phi-widget .phi-menu__find > input { width: 100%; }
.phi-widget .phi-menu__row { display: flex; align-items: center; gap: 9px; width: 100%; padding: 6px 8px;
  background: transparent; border: 0; border-radius: 6px; color: ${v('tx')}; text-align: left; white-space: nowrap; }
.phi-widget .phi-menu__row:hover, .phi-widget .phi-menu__row:focus-visible, .phi-widget .phi-menu__row.is-active {
  background: ${v('elev-2')}; outline: none; }
.phi-widget .phi-menu__row[aria-checked="true"] { color: ${v('acc-2')}; }
.phi-widget .phi-menu__row[aria-checked="true"]::before { content: ''; width: 6px; height: 6px; border-radius: 50%;
  background: ${v('acc-2')}; margin: 0 2px 0 -2px; flex: none; }
.phi-widget .phi-menu__row[aria-checked="false"]::before { content: ''; width: 6px; height: 6px; margin: 0 2px 0 -2px; flex: none; }
.phi-widget .phi-menu__row[aria-disabled="true"] { color: ${v('faint')}; cursor: default; background: transparent; }
.phi-widget .phi-menu__row.is-danger:hover { color: ${v('danger')}; }
.phi-widget .phi-menu__label { flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; }
.phi-widget .phi-menu__sub { color: ${v('faint')}; font-size: 11px; }
.phi-widget .phi-menu__key { margin-left: auto; color: ${v('faint')}; }
.phi-widget .phi-menu__empty { padding: 8px 10px; color: ${v('faint')}; }
/* A hovered row is elev-2, where faint text no longer reads: its hints brighten with it. */
.phi-widget .phi-menu__row:is(:hover, :focus-visible, .is-active) :is(.phi-menu__sub, .phi-menu__key),
.phi-widget .phi-fly__row:is(:hover, :focus-visible) .phi-fly__chord { color: ${v('mut')}; }

/* Stage: the rail on the left, the chart filling the rest. */
.phi-widget .phi-stage { grid-row: 2; position: relative; min-height: 0; min-width: 0; display: flex; }
.phi-widget .phi-chart { position: relative; flex: 1 1 auto; min-width: 0; min-height: 0;
  cursor: var(--phi-tool-cursor, crosshair); }
.phi-widget .phi-chart:focus-visible { outline-offset: -2px; }

/* Data state stays compact inside a chart, including narrow embedded widgets. */
.phi-widget .phi-data-status { position: absolute; top: 8px; right: 8px; z-index: 30;
  max-width: calc(100% - 16px); width: max-content; max-height: 45%; overflow-y: auto;
  display: flex; flex-direction: column; gap: 4px; pointer-events: none; font-size: 12px; }
.phi-widget .phi-data-status__row { display: flex; align-items: center; gap: 8px;
  max-width: 320px; padding: 4px 6px 4px 10px; background: ${v('panel')}; color: ${v('tx')};
  border: 1px solid ${v('bd')}; border-radius: 6px; pointer-events: auto; }
.phi-widget .phi-data-status__text { min-width: 0; overflow-wrap: anywhere; }
.phi-widget .phi-data-status__row > button { flex: none; color: ${v('acc-2')}; }

/* Rail */
.phi-widget .phi-rail { flex: none; width: ${v('rail-w')}; display: flex; flex-direction: column; align-items: center;
  gap: 2px; padding: 6px 0 0; background: ${v('panel-2')}; border-right: 1px solid ${v('bd-soft')};
  overflow-y: auto; overflow-x: hidden; scrollbar-width: none; }
.phi-widget .phi-rail::-webkit-scrollbar { width: 0; height: 0; }
.phi-widget .phi-rail__btn { position: relative; width: 32px; height: 30px; padding: 0; display: grid; place-items: center;
  flex: none; background: transparent; border: 1px solid transparent; border-radius: 6px; color: ${v('mut')};
  transition: background .09s, color .09s, border-color .09s; }
.phi-widget .phi-rail__btn:hover { background: ${v('elev')}; color: ${v('tx')}; }
.phi-widget .phi-rail__btn:focus-visible { outline: 2px solid ${v('acc-2')}; outline-offset: -2px; }
.phi-widget .phi-rail__btn.is-on { background: ${v('on-bg')}; border-color: ${v('on-bd')}; color: ${v('acc-2')}; }
.phi-widget .phi-rail__btn.is-weak { color: ${v('acc-2')}; }
.phi-widget .phi-rail__btn.is-off { color: ${v('faint')}; cursor: default; }
.phi-widget .phi-rail__btn.is-off:hover { background: transparent; color: ${v('faint')}; }
.phi-widget .phi-rail__btn--danger:not(.is-off):hover { color: ${v('danger')}; }
.phi-widget .phi-rail__chev { position: absolute; right: 0; bottom: 0; width: 13px; height: 13px; display: grid;
  place-items: center; border-radius: 5px 0 6px 0; color: ${v('mut')}; opacity: 0; transition: opacity .1s, background .1s; }
.phi-widget .phi-rail__chev > svg { width: 9px; height: 9px; fill: none; stroke: currentColor; stroke-width: 2.2;
  stroke-linecap: round; stroke-linejoin: round; }
.phi-widget .phi-rail__btn:hover .phi-rail__chev, .phi-widget .phi-rail__btn:focus-visible .phi-rail__chev,
.phi-widget .phi-rail__btn[aria-expanded="true"] .phi-rail__chev { opacity: 1; }
.phi-widget .phi-rail__chev:hover { background: ${v('elev-2')}; color: ${v('tx')}; }
.phi-widget .phi-rail__btn.is-held::after, .phi-widget .phi-rail__btn[data-mode="weak"]::after,
.phi-widget .phi-rail__btn[data-mode="strong"]::after { content: ''; position: absolute; top: 3px; right: 3px;
  width: 5px; height: 5px; border-radius: 50%; }
.phi-widget .phi-rail__btn.is-held::after, .phi-widget .phi-rail__btn[data-mode="strong"]::after { background: ${v('acc-2')}; }
.phi-widget .phi-rail__btn[data-mode="weak"]::after { border: 1.5px solid ${v('acc-2')}; width: 4px; height: 4px; }
.phi-widget .phi-rail__sep { width: 22px; height: 1px; background: ${v('bd-soft')}; margin: 4px 0; flex: none; }
.phi-widget .phi-rail__favs { display: contents; }
.phi-widget .phi-rail__ctl { margin-top: auto; position: sticky; bottom: 0; display: flex; flex-direction: column;
  align-items: center; gap: 2px; width: 100%; padding: 4px 0 6px; background: ${v('panel-2')};
  border-top: 1px solid ${v('bd-soft')}; flex: none; }
/* Tools that scroll under the controls fade out instead of being cut through. */
.phi-widget .phi-rail__ctl::before { content: ''; position: absolute; left: 0; right: 0; bottom: 100%; height: 14px;
  background: linear-gradient(to bottom, transparent, ${v('panel-2')}); pointer-events: none; }
.phi-widget .phi-rail__ctl .phi-rail__sep { margin: 3px 0; }
.phi-widget .phi-rail.is-collapsed { display: none; }
.phi-widget .phi-rail-tab { position: absolute; left: 0; bottom: 6px; z-index: 6; width: 16px; height: 26px; padding: 0;
  display: grid; place-items: center; background: ${v('panel-2')}; color: ${v('mut')};
  border: 1px solid ${v('bd-soft')}; border-left: 0; border-radius: 0 6px 6px 0;
  transition: background .09s, color .09s, width .09s; }
.phi-widget .phi-rail-tab:hover { width: 20px; background: ${v('elev')}; color: ${v('tx')}; }
.phi-widget .phi-rail-tab:focus-visible { outline: 2px solid ${v('acc-2')}; outline-offset: -2px; }
.phi-widget .phi-rail-tab > svg { width: 12px; height: 12px; }
.phi-widget .phi-rail-tab[hidden] { display: none; }

/* Rail flyout: a group's tools, with a pin star and the chord on each row. */
.phi-widget .phi-fly { min-width: 244px; max-width: 320px; max-height: calc(100% - 16px); overflow-y: auto; padding: 6px;
  background: ${v('panel')}; border: 1px solid ${v('bd')}; border-radius: 10px; box-shadow: ${v('shadow')}; outline: none; }
.phi-widget .phi-fly__row { display: flex; align-items: center; gap: 8px; padding: 4px 6px 4px 8px; border-radius: 7px;
  color: ${v('tx')}; font-size: 13px; cursor: pointer; outline: none; user-select: none; }
.phi-widget .phi-fly__row:hover, .phi-widget .phi-fly__row:focus-visible { background: ${v('elev-2')}; }
.phi-widget .phi-fly__row[aria-checked="true"] { background: ${v('on-bg')}; color: ${v('acc-2')}; }
.phi-widget .phi-fly__name { flex: 1 1 auto; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.phi-widget .phi-fly__chord { min-width: 40px; text-align: right; color: ${v('faint')}; }
.phi-widget .phi-fly__star { width: 22px; height: 22px; display: grid; place-items: center; padding: 0; border: 0;
  border-radius: 5px; background: transparent; color: ${v('faint')}; opacity: 0; transition: opacity .1s, color .1s; }
.phi-widget .phi-fly__row:hover .phi-fly__star, .phi-widget .phi-fly__row:focus-within .phi-fly__star,
.phi-widget .phi-fly__star[aria-pressed="true"] { opacity: 1; }
.phi-widget .phi-fly__star:hover { background: ${v('elev')}; color: ${v('tx')}; }
.phi-widget .phi-fly__star:focus-visible { outline: 2px solid ${v('acc-2')}; outline-offset: -1px; opacity: 1; }
.phi-widget .phi-fly__star[aria-pressed="true"] { color: ${v('amber')}; }
.phi-widget .phi-fly__star > svg { width: 14px; height: 14px; stroke: currentColor; stroke-width: 1.5;
  stroke-linecap: round; stroke-linejoin: round; }
.phi-widget .phi-fly__star[aria-pressed="false"] > svg { fill: none; }

/* Tooltip */
.phi-widget .phi-tip-spot { position: absolute; width: 1px; height: 1px; pointer-events: none; }
.phi-widget .phi-tip { position: absolute; z-index: 200; left: 0; top: 0; max-width: 260px; pointer-events: none;
  padding: 5px 9px; border-radius: 6px; background: ${v('elev-2')}; color: ${v('tx')}; border: 1px solid ${v('bd')};
  box-shadow: ${v('shadow')}; font-size: 12px; line-height: 1.4; opacity: 0; transition: opacity .09s ease; }
.phi-widget .phi-tip.is-on { opacity: 1; }
.phi-widget .phi-tip__chord { margin-left: 10px; color: ${v('mut')}; }
/* The tip sits on elev-2, a step above the surfaces faint text is measured on. */
.phi-widget .phi-tip__sub { display: block; margin-top: 2px; color: ${v('mut')}; font-size: 11px; }

/* Status line */
.phi-widget .phi-statusline { grid-row: 3; display: flex; align-items: center; gap: 12px; height: ${v('status-h')}; padding: 0 10px;
  background: ${v('panel')}; border-top: 1px solid ${v('bd-soft')}; color: ${v('mut')}; font-size: 11.5px;
  font-variant-numeric: tabular-nums; white-space: nowrap; overflow: hidden; }
.phi-widget .phi-statusline__sym { color: ${v('tx-strong')}; font-weight: 600; letter-spacing: .3px; }
.phi-widget .phi-statusline__iv { color: ${v('faint')}; margin-left: 4px; font-weight: 600; }
.phi-widget .phi-statusline__field { display: inline-flex; align-items: center; gap: 4px; }
.phi-widget .phi-statusline__field > i { font-style: normal; color: ${v('faint')}; }
.phi-widget .phi-statusline__field > b { font-weight: 500; color: ${v('tx')}; }
.phi-widget .phi-statusline .is-up > b { color: ${v('up')}; }
.phi-widget .phi-statusline .is-down > b { color: ${v('down')}; }
.phi-widget .phi-statusline__msg { margin-left: auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; color: ${v('mut')}; }
.phi-widget .phi-statusline__msg.is-error { color: ${v('danger')}; }
.phi-widget .phi-statusline__tz { color: ${v('faint')}; }

/* Narrow widget chrome */
.phi-widget .phi-mobile { display: none; }
.phi-widget.is-mobile { grid-template-rows: auto minmax(0, 1fr) auto; }
.phi-widget.is-mobile > .phi-topbar, .phi-widget.is-mobile > .phi-statusline,
.phi-widget.is-mobile > .phi-stage > :is(.phi-rail, .phi-rail-tab) { display: none; }
.phi-widget.is-mobile > .phi-stage { grid-row: 2; }
.phi-widget.is-mobile > .phi-mobile { display: contents; }
.phi-widget .phi-mobile__header { grid-row: 1; z-index: 40; display: grid; grid-template-columns: minmax(0, 1fr) auto;
  gap: 8px; min-height: 52px; padding: calc(4px + env(safe-area-inset-top)) max(8px, env(safe-area-inset-right)) 4px
  max(8px, env(safe-area-inset-left)); background: ${v('panel')}; border-bottom: 1px solid ${v('bd-soft')}; }
.phi-widget .phi-mobile__symbol { width: 100%; min-width: 0; height: 44px; text-transform: uppercase; font-weight: 600; }
.phi-widget .phi-mobile__footer { grid-row: 3; z-index: 40; min-width: 0; padding-bottom: env(safe-area-inset-bottom);
  background: ${v('panel')}; border-top: 1px solid ${v('bd-soft')}; }
.phi-widget .phi-mobile__bar, .phi-widget .phi-mobile__selection { display: grid; grid-auto-flow: column;
  grid-auto-columns: minmax(0, 1fr); min-width: 0; }
.phi-widget .phi-mobile__selection { border-bottom: 1px solid ${v('bd-soft')}; }
.phi-widget .phi-mobile__action { min-width: 0; min-height: 44px; padding: 6px 10px; border: 0; border-radius: 0;
  background: transparent; color: ${v('tx')}; overflow-wrap: anywhere; touch-action: manipulation; }
.phi-widget .phi-mobile__action:hover, .phi-widget .phi-mobile__action:focus-visible { background: ${v('elev')}; }
.phi-widget .phi-mobile__action[aria-pressed="true"] { color: ${v('acc-2')}; background: ${v('on-bg')}; }
.phi-widget .phi-mobile__action[aria-disabled="true"] { color: ${v('faint')}; cursor: default; background: transparent; }
.phi-widget .phi-mobile__branding { display: flex; align-items: center; width: 100%; min-height: 44px; text-decoration: none; }
.phi-widget .phi-mobile-sheet.phi-dialog { left: 0; right: 0; top: auto; bottom: 0; transform: none; width: 100%;
  max-width: 100%; max-height: calc(100% - env(safe-area-inset-top) - 12px); border-radius: 14px 14px 0 0;
  padding-bottom: env(safe-area-inset-bottom); }
.phi-widget .phi-mobile-sheet__head { flex: none; display: flex; align-items: center; gap: 8px;
  min-height: 52px; padding: 4px 8px 4px 14px; border-bottom: 1px solid ${v('bd-soft')}; }
.phi-widget .phi-mobile-sheet__title { flex: 1 1 auto; color: ${v('tx-strong')}; font-size: 14px; }
.phi-widget .phi-mobile-sheet__body { flex: 1 1 auto; min-height: 0; overflow: auto; overscroll-behavior: contain;
  display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); align-content: start; padding: 8px; }
.phi-widget .phi-mobile-sheet__body > .phi-head { grid-column: 1 / -1; }
.phi-widget .phi-mobile-sheet__controls { grid-column: 1 / -1; display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr)); border-bottom: 1px solid ${v('bd-soft')}; margin-bottom: 6px; }
.phi-widget .phi-mobile-sheet__body small { display: block; color: ${v('faint')}; }
/* A sheet row with a glyph (a chart type): the glyph sits on the middle of its label, not the baseline. */
.phi-widget .phi-mobile-sheet .phi-mobile__action > .phi-glyph { vertical-align: middle; margin: -2px 8px 0 0; }
.phi-widget .phi-mobile-results { width: min(360px, calc(100% - 16px)); max-height: min(50%, 360px); overflow: hidden;
  display: flex; flex-direction: column; background: ${v('panel')}; border: 1px solid ${v('bd')}; border-radius: 10px; box-shadow: ${v('shadow')}; }
.phi-widget .phi-mobile-results__head { flex: none; display: flex; align-items: center; gap: 8px; min-height: 44px;
  padding-left: 12px; border-bottom: 1px solid ${v('bd-soft')}; }
.phi-widget .phi-mobile-results__head > strong { flex: 1 1 auto; color: ${v('tx-strong')}; }
.phi-widget .phi-mobile-results__list { flex: 1 1 auto; min-height: 0; max-height: min(42vh, 300px);
  overflow-y: auto; overscroll-behavior: contain; }
.phi-widget .phi-mobile-results__list > .phi-mobile__action { display: block; width: 100%; text-align: left; }
.phi-widget .phi-mobile-results__list small { display: block; color: ${v('faint')}; }
.phi-widget .phi-mobile-results__status { min-height: 44px; padding: 13px 12px; color: ${v('mut')}; }
.phi-widget.is-mobile .phi-toasts { bottom: calc(54px + env(safe-area-inset-bottom)); }

/* Toasts */
.phi-widget .phi-toasts { position: absolute; right: 12px; bottom: calc(${v('status-h')} + 10px); z-index: 90; display: flex;
  flex-direction: column; gap: 8px; width: min(340px, calc(100% - 24px)); pointer-events: none; }
.phi-widget .phi-toast { display: flex; align-items: flex-start; gap: 8px; padding: 8px 6px 8px 12px; border-radius: 8px;
  background: ${v('panel')}; color: ${v('tx')}; border: 1px solid ${v('bd')}; border-left: 3px solid ${v('acc')};
  box-shadow: ${v('shadow')}; font-size: 12.5px; line-height: 1.45; pointer-events: auto; animation: phi-toast-in .16s ease-out; }
.phi-widget .phi-toast--success { border-left-color: ${v('buy')}; }
.phi-widget .phi-toast--error { border-left-color: ${v('sell')}; }
.phi-widget .phi-toast__msg { flex: 1 1 auto; min-width: 0; overflow-wrap: anywhere; padding-top: 2px; }
.phi-widget .phi-toast__x { flex: none; width: 26px; height: 26px; border: 0; border-radius: 6px; background: transparent;
  color: ${v('faint')}; padding: 0; display: grid; place-items: center; }
.phi-widget .phi-toast__x:hover { background: ${v('elev-2')}; color: ${v('tx')}; }
.phi-widget .phi-toast__x > svg { width: 12px; height: 12px; fill: none; stroke: currentColor; stroke-width: 1.5; }
.phi-widget .phi-toast.is-out { opacity: 0; transform: translateY(6px); transition: opacity .16s, transform .16s; }
@keyframes phi-toast-in { from { opacity: 0; transform: translateY(6px); } }

/* Overlay layer: popovers anchored to a control, dialogs centred over a scrim. */
.phi-widget .phi-layer { container: phi-widget / inline-size; position: absolute; inset: 0; z-index: 60; pointer-events: none; }
/* Not the tooltip: it shows over controls (the rail's tab, the bar's buttons) and
   must never take the press meant for them. */
.phi-widget .phi-layer > :not(.phi-tip, .phi-tip-spot) { pointer-events: auto; }
.phi-widget .phi-scrim { position: absolute; inset: 0; background: ${v('scrim')}; }
.phi-widget .phi-pop { position: absolute; left: 0; top: 0; }
.phi-widget .phi-dialog { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);
  min-width: 0; max-width: calc(100% - 24px); max-height: calc(100% - 24px); display: flex; flex-direction: column;
  background: ${v('panel')}; border: 1px solid ${v('bd')}; border-radius: 12px; box-shadow: ${v('shadow')}; outline: none; }
.phi-widget .phi-dialog__head { flex: none; min-width: 0; display: flex; align-items: center; gap: 8px; padding: 12px 14px 8px; }
.phi-widget .phi-dialog__title { flex: 1 1 auto; min-width: 0; overflow-wrap: anywhere; font-size: 14px; font-weight: 700; color: ${v('tx-strong')}; }
.phi-widget .phi-dialog__body { flex: 1 1 auto; min-height: 0; min-width: 0; overflow: auto; overscroll-behavior: contain; padding: 4px 14px 10px; }
.phi-widget .phi-dialog__foot { flex: none; min-width: 0; display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding: 10px 14px 12px;
  border-top: 1px solid ${v('bd-soft')}; }
.phi-widget .phi-dialog__foot > .phi-spacer { flex: 1 1 auto; }
.phi-widget .phi-csv { width: 490px; }
.phi-widget .phi-csv__ranges, .phi-widget .phi-csv .phi-dialog__actions { display: flex; flex-wrap: wrap; gap: 8px; }
.phi-widget .phi-csv__hint { color: ${v('mut')}; line-height: 1.5; }
.phi-widget .phi-csv__error { color: ${v('danger')}; overflow-wrap: anywhere; }
.phi-widget .phi-csv__error:empty { display: none; }

/* Point and figure and Renko settings: a size, its unit and its method share one control column. */
.phi-widget .phi-ctset { width: 380px; }
.phi-widget .phi-ctset .phi-row__ctl { width: min(244px, 66%); }
.phi-widget .phi-ctset__presets { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 4px; width: 100%; padding: 2px 0; }
.phi-widget .phi-ctset__preset { height: 24px; padding: 0 4px; font-size: 11px; font-variant-numeric: tabular-nums;
  background: ${v('elev')}; border-color: ${v('bd-soft')}; }
.phi-widget .phi-ctset__size { display: flex; align-items: center; gap: 6px; width: 100%; min-width: 0; }
.phi-widget .phi-ctset .phi-row__ctl .phi-ctset__size > input { flex: 1 1 0; width: auto; min-width: 0; }
.phi-widget .phi-ctset .phi-input--num { text-align: right; font-variant-numeric: tabular-nums; }
.phi-widget .phi-ctset .phi-row__ctl .phi-ctset__size > .phi-select { flex: 0 0 100px; width: 100px; }
.phi-widget .phi-ctset__unit { flex: none; color: ${v('mut')}; font-size: 11px; white-space: nowrap; }
.phi-widget .phi-ctset__radios { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 4px 14px; }
.phi-widget .phi-ctset__radio { display: inline-flex; align-items: center; gap: 6px; color: ${v('tx')}; white-space: nowrap; cursor: pointer; }

/* Shortcuts panel */
.phi-widget .phi-keys { columns: 2; column-gap: 24px; min-width: 520px; }
.phi-widget .phi-keys__group { break-inside: avoid; margin-bottom: 8px; }
.phi-widget .phi-keys__row { display: flex; align-items: center; gap: 10px; padding: 3px 0; }
.phi-widget .phi-keys__row > span { flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; }
.phi-widget .phi-keys__row > kbd { flex: none; padding: 2px 6px; border-radius: 4px; background: ${v('elev')};
  border: 1px solid ${v('bd-soft')}; color: ${v('mut')}; }
.phi-widget .phi-keys__row.is-shadowed > span, .phi-widget .phi-keys__row.is-shadowed > kbd { color: ${v('faint')}; text-decoration: line-through; }
.phi-widget .phi-keys__note { color: ${v('faint')}; font-size: 11px; padding: 4px 0 0; }

@container phi-widget (max-width: 720px) {
  .phi-widget .phi-keys { columns: 1; min-width: 0; }
}
@media (max-width: 720px) {
  .phi-widget .phi-sym > input { width: 104px; }
}
@media (prefers-reduced-motion: reduce) {
  .phi-widget .phi-rail__btn, .phi-widget .phi-rail__chev, .phi-widget .phi-tip, .phi-widget .phi-fly__star,
  .phi-widget .phi-btn, .phi-widget .phi-toast.is-out { transition: none; }
  .phi-widget .phi-toast { animation: none; }
  .phi-widget .phi-mobile__action { transition: none; }
}
`;

/**
 * Put the stylesheet into `doc` once. Safe to call per widget: the second
 * call leaves a populated sheet untouched. An empty server-rendered sheet
 * is filled in place, preserving its nonce. `extra` is appended to the
 * shell's rules when filling the sheet; the dialog modules hand theirs in
 * here, so the page still carries one sheet. `nonce` authorizes the style
 * element under CSP; the host controls its style-attribute policy separately.
 */
export function injectWidgetStyles(doc: Document, extra = '', nonce?: string): HTMLStyleElement {
  const existing = doc.getElementById(WIDGET_STYLE_ID) as HTMLStyleElement | null;
  if (existing?.textContent?.trim()) return existing;
  const style = existing ?? doc.createElement('style');
  style.id = WIDGET_STYLE_ID;
  // CSP checks connected sheets when their text changes. Read the IDL
  // property because browsers hide a connected element's nonce attribute.
  if (!style.nonce && nonce !== undefined) style.nonce = nonce;
  style.textContent = WIDGET_CSS + extra;
  if (existing === null) (doc.head ?? doc.body ?? doc.documentElement).appendChild(style);
  return style;
}

/**
 * Add the rules of a part that loads on first use (lazy.ts) to the sheet,
 * once per document. Appended to the widget's own sheet they keep its CSP
 * nonce, and they come after every rule they refine, as they did when the
 * part was bundled in. A page with no sheet gets none here, as before.
 */
export function addWidgetStyles(doc: Document, css: string): void {
  const style = doc.getElementById(WIDGET_STYLE_ID);
  if (style !== null && !(style.textContent ?? '').includes(css)) style.appendChild(doc.createTextNode(css));
}
