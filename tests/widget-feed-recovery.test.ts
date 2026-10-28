import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { FakeDataFeed } from '../src/feed/fake-feed';
import type { Bar } from '../src/model/bar';
import { ensureWindowGlobal } from './helpers/fake-dom-widget';

beforeAll(ensureWindowGlobal);
const T = 1_700_000_040;
const initial: Bar = { time: T, open: 10, high: 12, low: 9, close: 11, volume: 100 };
afterEach(() => { vi.useRealTimers(); });

describe('widget feed recovery', () => {
  it('continues a supplied seed in the synthetic feed instead of updating old history', () => {
    let advance = (): void => {};
    const feed = new FakeDataFeed(60, callback => { advance = callback; return () => {}; });
    const delivered: Bar[] = [];
    feed.subscribeBars({ symbol: 'X', exchange: 'NSE', interval: '1m', from: T - 1800 },
      bar => delivered.push(bar), { seedFrom: initial });
    advance();
    expect(delivered[0].time).toBe(T + 60);
    expect(delivered[0].open).toBe(11);
  });
});
