---
name: phi-chart-setup
description: Scaffold a working phi-charts chart in an existing project - detects the host (React, Next.js, Vue, vanilla bundler, or plain script tag), installs the right tiers, and writes a chart that renders real data. Use when the user asks to add a chart, set up phi-charts, or get a first chart running.
argument-hint: "[chart-type] [host]"
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

Scaffold a first working chart. Do not write a demo page unless the user asked for one; wire it into the project they already have.

## Arguments

- `$0` = chart type. Default: `candlestick`.
- `$1` = host. Default: detect it.

## Step 1 - detect the host before writing anything

```sh
cat package.json
rg -n "\"(react|next|vue|svelte|vite|webpack)\"" package.json
node -p "require('./node_modules/phi-charts/package.json').version" 2>/dev/null || echo "not installed"
```

Pick the shape from what you find:

| Finding | Shape |
|---|---|
| `next` | client-only component, `'use client'`, create in `useEffect` |
| `react` without `next` | component with `useRef` + `useEffect` |
| `vue` | a composable: chart in a `shallowRef`, `onMounted` / `onBeforeUnmount` |
| a bundler, no framework | plain module |
| no bundler, HTML only | `<script type="module">` from `dist/` or a CDN; with no module support, the script-tag files: `dist/phi-charts.standalone.js` (the `PhiCharts` global), then each tier's `phi-charts.<tier>.standalone.js` (`PhiCharts.<tier>`) |

Read [react-integration](../phi-charts/references/react-integration.md) for the React and Next.js shapes, [vue-integration](../phi-charts/references/vue-integration.md) for Vue 3 and Nuxt, and [bundling-and-tiers](../phi-charts/references/bundling-and-tiers.md) for the no-bundler shape.

## Step 2 - install

```sh
npm install phi-charts
```

Add tier imports only for what the user actually asked for. Each unused tier is bytes for nothing.

| They asked for | Add |
|---|---|
| indicators | `import 'phi-charts/indicators'` |
| drawing tools | `import { DrawingController } from 'phi-charts/draw'` |
| Renko / Heikin Ashi / P&F / Kagi | `import 'phi-charts/transform'` |
| volume or market profile, footprint | `import { ... } from 'phi-charts/profile'` |
| placing orders | `import { OrderEngine } from 'phi-charts/trade'` |
| packaged toolbar, rail and dialogs | `import { createWidget } from 'phi-charts/widget'` |
| optional GPU series rendering | `import 'phi-charts/webgl'`, then `renderer: 'auto'` |

## Step 3 - write the chart

Requirements the scaffold must satisfy:

1. The container has an explicit non-zero height. A chart in a zero-height box renders nothing and this is the most common setup failure.
2. Time values are **UTC seconds**.
3. The chart is created once and destroyed in cleanup with `chart.destroy()`.
4. The chart instance lives in a ref or module scope, never in component state. In Vue that ref is a `shallowRef`: `ref()` and `reactive()` hand back a proxy of the chart.
5. Real data if the project has a source; `generateBars` only as an explicit placeholder, clearly marked.
6. No emojis or icons anywhere in the code.

Vanilla baseline:

```ts
import { createChart } from 'phi-charts';

const chart = createChart(document.getElementById('chart')!);
const series = chart.addSeries('candlestick');
series.setData(bars);            // bars: { time, open, high, low, close, volume }[]
chart.fitContent();
```

Add a volume pane only if asked:

```ts
const volume = chart.addSeries('histogram', { paneIndex: 1 });
volume.setData(bars.map(b => ({ time: b.time, value: b.volume ?? 0 })));
chart.setPaneWeight(1, 0.3);
```

If the user wants a recent-bar default, pass
`navigation: { defaultVisibleBars: 120 }` when creating the chart and omit the explicit
`fitContent()` call above. Initial data uses the preference; later default resets use
`resetScale()`. A hidden tab defers its initial fit until measurement. See
[host-integration](../phi-charts/references/host-integration.md).

## Step 4 - connect data

If the project already has a bar source, use it. Otherwise write a small `DataFeed`: any object with `getBars()` is one. See [feeds-and-live](../phi-charts/references/feeds-and-live.md):

```ts
import type { DataFeed } from 'phi-charts';

declare const feed: DataFeed; // your adapter: convert provider formats to UTC seconds at the edge
const to = Math.floor(Date.now() / 1000);
const request = { symbol, exchange, interval: '5m', from: to - 7 * 86400, to };
const bars = await feed.getBars(request);
series.setData(bars);
const unsubscribe = feed.subscribeBars?.(request, b => series.update(b), {
  seedFrom: bars[bars.length - 1],
});
// On symbol replacement or unmount: unsubscribe?.(), then tear down owned resources.
```

`from` and `to` are UTC seconds. Save `unsubscribe` in the host's
cleanup scope and check liveness after the history await before subscribing. For repeated
symbol loads, replay or reconnect recovery, follow the request guards in
[host-integration](../phi-charts/references/host-integration.md).

Never read an API key from client-side source you commit. Take it from the project's existing env mechanism.

## Step 5 - verify it actually renders

Do not report success on a file write alone. Build or typecheck, and if the project has a dev server or a browser harness available, load the page and confirm the canvas has content.

```sh
npx tsc --noEmit
npm run build
```

Report the file paths you created or edited, the tiers you added, and how you verified it renders.
