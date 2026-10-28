import { createBtcUsdFeed } from '../../website/lib/market-data/btc-usd.mjs';
import type { Bar } from '../../src/model/bar';
import type { AdapterFixtures, AdapterHarness, AdapterReference, AdapterSnapshot } from './adapter-contract';
import { ControlledTransport } from './controlled-transport';

function candles(start: number, price: number, volume: number): Bar[] {
  return [0, 1, 2].map(index => ({
    time: start + index * 900, open: price + index * 2,
    high: price + index * 2 + 10, low: price + index * 2 - 10,
    close: price + index * 2 + 2, volume: volume * (index + 1),
  }));
}

function repaired(bars: readonly Bar[]): Bar[] {
  return bars.map((bar, index) => index ? { ...bar } : {
    ...bar, open: bar.open + 1, high: bar.high - 2, low: bar.low + 8,
    close: bar.close + 1, volume: bar.volume! / 2,
  });
}

function cryptoPayload(bars: readonly Bar[]): unknown {
  return bars.map(bar => [bar.time * 1000, bar.open, bar.high, bar.low, bar.close, bar.volume]);
}

function fixtures(): AdapterFixtures {
  const start = Date.parse('2026-09-19T23:45:00Z') / 1000;
  const initialBars = candles(start, 60000, 0.125);
  const repairedBars = repaired(initialBars);
  const olderDuplicate = { ...initialBars[0], close: initialBars[0].close - 1, volume: initialBars[0].volume! / 2 };
  // The crypto API returns newest first.
  const duplicateRows = [initialBars[2], initialBars[1], initialBars[0], olderDuplicate];
  return {
    interval: '15m', nextInterval: '1h', initialBars, repairedBars,
    duplicatePayload: cryptoPayload(duplicateRows),
    repairPayload: cryptoPayload([...repairedBars].reverse()),
    invalidPayload: cryptoPayload([{ ...initialBars[0], high: initialBars[0].low - 1 }]),
    providerErrorPayload: { error: 'Synthetic provider rejection' },
  };
}

export function createCryptoHarness(): AdapterHarness {
  const transport = new ControlledTransport();
  const sample = fixtures();
  const publications: AdapterSnapshot[] = [];
  let current: AdapterSnapshot = { bars: [], status: 'idle', interval: sample.interval };
  const feed = createBtcUsdFeed({
    fetchImpl: transport.fetch,
    onBars: (bars, interval) => {
      current = { ...current, bars: bars.map(bar => ({ ...bar })), interval };
      publications.push(current);
    },
    onStatus: status => {
      current = {
        ...current, status: status.state === 'connected' ? 'ready' : status.state,
        interval: status.interval, error: status.message,
      };
      publications.push(current);
    },
  });
  return {
    transport, fixtures: sample, publications,
    snapshot: () => ({ ...current, bars: current.bars.map(bar => ({ ...bar })) }),
    load: (interval = sample.interval) => feed.selectInterval(interval),
    refresh: () => feed.refresh(),
    destroy: () => feed.destroy(),
  };
}

export const adapterReferences: readonly AdapterReference[] = [
  { name: 'Website crypto candle polling', evidence: 'synthetic', create: createCryptoHarness },
];
