# Getting started

PHI CHARTS is a dependency-free, canvas-based financial charting engine.
The base engine is **132.49 kB Brotli**; all nine tiers total **427.38 kB Brotli**,
measured with `size-limit` on the 2.6.6 build. Optional tiers are separate imports.

## Install

```bash
npm install phi-charts
```

## Your first chart

```ts
import { createChart } from 'phi-charts';

const container = document.getElementById('chart');
if (!container) throw new Error('Chart container not found');
const chart = createChart(container);
const series = chart.addSeries('candlestick');
series.setData([
  { time: 1705286700, open: 100, high: 101, low: 99.5, close: 100.6, volume: 1200 },
  { time: 1705286760, open: 100.6, high: 101.4, low: 100.2, close: 101.1, volume: 900 },
  // ...
]);
```

Give the chart container a non-zero height, for example `height: 400px`, before
creating it. Call `chart.destroy()` when the view is removed.

Time is **UTC seconds** internally. Feed adapters convert broker formats at the
edge (IST date strings, epoch milliseconds); see the feed example below.

## Live updates

```ts
import { CandleBuilder } from 'phi-charts';

const builder = new CandleBuilder({ intervalSec: 60, volumeMode: 'ltq-sum' });
builder.seed(lastHistoricalBar);

// Your market-data adapter calls this callback for each trade tick.
function onTradeTick({ price, ltq, timeSec }: { price: number; ltq?: number; timeSec: number }) {
  const u = builder.onTick({ time: timeSec, price, ltq });
  if (u) series.update(u.bar); // mutates the last candle or appends a new one
}
```

For production history loading, paging, reconnects and partial-bar repair, use
the shared [Data Loading controller](https://sairaj2807.github.io/phi-charts/docs/data-loading/).
`ltq-sum` requires actual trade quantities; choose `day-delta` for cumulative
day volume, and configure the instrument session anchor. A tick without OI must
not manufacture an observation. See [open interest](open-interest.md).

## Loadable tiers

Only pay for what you use: each of the nine tiers is a separate entry point.

| Import | Contents |
|---|---|
| `phi-charts` | base chart engine, registries, feeds, alerts, replay, comparisons, appearance linking, grouped timeline events, chart state and exports |
| `phi-charts/trade` | order/position/bracket lines, DOM ladder, order engine |
| `phi-charts/transform` | Renko, Range, Point &amp; Figure, Kagi, Line Break, Heikin Ashi |
| `phi-charts/profile` | Volume Profile, Market Profile (TPO), Footprint, order flow |
| `phi-charts/indicators` | 112 built-in indicators (SMA/EMA/MACD/Bollinger/RSI/ADX/...) + the Tier-2 contract |
| `phi-charts/draw` | 87 drawing tools, including Anchored VWAP and fixed-range Volume Profile, a headless controller and opt-in drawing linking |
| `phi-charts/webgl` | the WebGL2 series backend behind `renderer: 'auto'` |
| `phi-charts/workspace` | portable layouts, indicator templates, revisioned catalogs and asynchronous storage |
| `phi-charts/widget` | the chart with its chrome in one `createWidget` call: top bar, drawing rail, status line, dialogs, shortcuts, persistence. The only tier that supplies application controls |

## Your data

A feed is any object with `getBars()`. Convert your provider's formats to UTC
seconds there, at the edge, so the chart never sees anything else.

```ts
import type { DataFeed } from 'phi-charts';

const feed: DataFeed = {
  async getBars({ symbol, exchange, interval, from, to }) {
    // from/to are UTC seconds; convert them for your provider here.
    const url = `/history?symbol=${symbol}&exchange=${exchange}&interval=${interval}&from=${from}&to=${to}`;
    const rows = await (await fetch(url)).json();
    return rows.map((row) => ({ time: row.t, open: row.o, high: row.h, low: row.l, close: row.c, volume: row.v }));
  },
};

const day = 86400;
const bars = await feed.getBars({
  symbol: 'RELIANCE', exchange: 'NSE', interval: '1m',
  from: Math.floor(Date.now() / 1000) - 7 * day, to: Math.floor(Date.now() / 1000),
});
series.setData(bars);
```

Live ticks come from your own stream. Feed them through a `CandleBuilder` and
call `series.update()`:

```ts
import { CandleBuilder } from 'phi-charts';
const liveBuilder = new CandleBuilder({ intervalSec: 60, volumeMode: 'ltq-sum' });
const lastBar = bars[bars.length - 1];
if (lastBar) liveBuilder.seed(lastBar);
const stopTicks = myStream.onTick((tick) => {
  const time = tick.timeSec > 0 ? tick.timeSec : Math.floor(Date.now() / 1000);
  const update = liveBuilder.onTick({ time, price: tick.price, ltq: tick.quantity });
  if (update) series.update(update.bar);
});

// Call when this view is removed or the source is replaced.
function disposeLiveFeed() {
  stopTicks();
}
```

The chart's market data depends only on the `DataFeed` interface, so any
provider can be wired with a small adapter. Order entry is a separate contract:
the trade tier's `OrderFeed`, which its `OrderEngine` drives, and which a chart
without trading never needs.

See [guides.md](./guides.md) for chart types, trading, profiles, and writing
custom chart styles / primitives, [widget.md](./widget.md) for the one-call terminal,
and [migrating-to-2.md](./migrating-to-2.md) if you are coming from 1.9.x. Runnable
demos live in [`../examples`](../examples/index.html).

## Current host guides

- [Instrument metadata](instruments.md): sessions, intervals, precision and quantity units.
- [Open interest](open-interest.md): observations, gaps and the three studies.
- [Trader alerts](https://sairaj2807.github.io/phi-charts/docs/alerts/): standalone controller, restoration and host delivery.
- [Workspaces](workspaces.md): portable layouts, templates and asynchronous storage.
- [Chart data export](chart-data-export.md): loaded/revealed rows and host-owned CSV delivery.
- [Drawing tools](https://sairaj2807.github.io/phi-charts/docs/drawing-tools/): time-anchored analysis drawings, volume requirements and editing.
- [Chart linking](https://sairaj2807.github.io/phi-charts/docs/chart-linking/): independent appearance and drawing switches, with instrument identity checks.
- [Timeline events](https://sairaj2807.github.io/phi-charts/docs/events/): host-supplied groups, clustering and widget details.
