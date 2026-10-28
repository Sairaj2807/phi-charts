import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BTC_USD_REFRESH_MS } from '../website/lib/market-data/btc-usd.mjs';
import { adapterContractChecks, authoritativeRepair, duplicateHistory, loadInitial, type AdapterHarness } from './conformance/adapter-contract';
import { adapterReferences, createCryptoHarness } from './conformance/reference-adapters';

let active: AdapterHarness[] = [];

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-09-20T00:30:00Z'));
});

afterEach(() => {
  for (const harness of active) harness.destroy();
  active = [];
  const timers = vi.getTimerCount();
  vi.useRealTimers();
  expect(timers, 'adapter teardown must release owned timers').toBe(0);
});

for (const reference of adapterReferences) {
  describe(`${reference.name} adapter conformance (${reference.evidence} transport)`, () => {
    for (const check of adapterContractChecks) {
      it(check.name, async () => {
        const harness = reference.create();
        active.push(harness);
        await check.run(harness);
      });
    }

    it('negative control: the shared runner rejects duplicate output', async () => {
      const harness = reference.create();
      active.push(harness);
      const defective: AdapterHarness = {
        ...harness,
        snapshot: () => {
          const snapshot = harness.snapshot();
          return { ...snapshot, bars: [...snapshot.bars, ...snapshot.bars.slice(0, 1)] };
        },
      };
      await expect(duplicateHistory(defective)).rejects.toThrow('history must be sorted, unique');
    });

    it('negative control: the shared runner rejects a discarded authoritative repair', async () => {
      const harness = reference.create();
      active.push(harness);
      const defective: AdapterHarness = {
        ...harness,
        snapshot: () => ({ ...harness.snapshot(), bars: harness.fixtures.initialBars }),
      };
      await expect(authoritativeRepair(defective)).rejects.toThrow('an authoritative closed-bar repair');
    });
  });
}

describe('crypto polling conformance (synthetic transport)', () => {
  it('keeps fractional volume and UTC-midnight weekend candles without a session reset', async () => {
    const harness = createCryptoHarness();
    active.push(harness);
    await loadInitial(harness);
    const bars = harness.snapshot().bars;
    expect(bars.map(bar => new Date(bar.time * 1000).toISOString())).toEqual([
      '2026-09-19T23:45:00.000Z', '2026-09-20T00:00:00.000Z', '2026-09-20T00:15:00.000Z',
    ]);
    expect(bars.map(bar => bar.volume)).toEqual([0.125, 0.25, 0.375]);
    expect(harness.transport.requests[0].init).toMatchObject({ cache: 'no-store', credentials: 'omit' });
  });

  it('automatically polls again after a transport failure and releases its timer on destroy', async () => {
    const harness = createCryptoHarness();
    active.push(harness);
    await loadInitial(harness);
    await vi.advanceTimersByTimeAsync(BTC_USD_REFRESH_MS);
    (await harness.transport.request(1)).fail(new Error('Synthetic polling interruption'));
    await vi.advanceTimersByTimeAsync(0);
    expect(harness.snapshot().status).toBe('stale');
    expect(harness.snapshot().bars).toEqual(harness.fixtures.initialBars);
    expect(vi.getTimerCount()).toBe(1);
    await vi.advanceTimersByTimeAsync(BTC_USD_REFRESH_MS);
    (await harness.transport.request(2)).reply(harness.fixtures.repairPayload);
    await vi.advanceTimersByTimeAsync(0);
    expect(harness.snapshot()).toMatchObject({ status: 'ready', bars: harness.fixtures.repairedBars });
    expect(vi.getTimerCount()).toBe(1);
    harness.destroy();
    await vi.advanceTimersByTimeAsync(BTC_USD_REFRESH_MS * 2);
    expect(harness.transport.requests).toHaveLength(3);
    expect(vi.getTimerCount()).toBe(0);
  });
});
