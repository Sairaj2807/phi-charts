import { describe, expect, it, vi } from 'vitest';
import { OrderEngine, type OrderEngineOptions, type OrderFeed, type PlaceRequest } from '../src/trade/order-engine';
import { assertTradingCapability, checkTradingCapability, TradingCapabilityError, type TradingCapabilities, type TradingCapabilitySource, type TradingCapabilityRequest } from '../src/feed/trading-capabilities';

const order: PlaceRequest = { symbol: 'SYNTHETIC', exchange: 'NSE', side: 'BUY', type: 'LIMIT', qty: 1, price: 100, clientToken: 'intent-1' };

function memoryFeed(capabilities?: TradingCapabilitySource) {
  let id = 0;
  return {
    capabilities,
    place: vi.fn(async () => ({ orderId: `broker-${++id}` })),
    modify: vi.fn(async () => {}),
    cancel: vi.fn(async () => {}),
  } satisfies OrderFeed;
}

function engine(feed: OrderFeed, options: Partial<OrderEngineOptions> = {}): OrderEngine {
  return new OrderEngine({ feed, constraints: { tickSize: 0.05 }, armed: true, ...options });
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((done, fail) => { resolve = done; reject = fail; });
  return { promise, resolve, reject };
}

describe('shared capability query', () => {
  it('distinguishes omitted legacy declarations from unavailable provider metadata', () => {
    expect(checkTradingCapability(undefined, { operation: 'place' })).toEqual({ supported: true });
    expect(checkTradingCapability({}, { operation: 'place' })).toEqual({ supported: true });
    expect(checkTradingCapability(() => undefined, { operation: 'place' })).toEqual({
      supported: false, reason: 'Trading capabilities are unavailable',
    });
    expect(checkTradingCapability({ modify: 'unknown' }, { operation: 'modify' })).toMatchObject({ supported: false, reason: expect.stringContaining('unknown') });
  });

  it('says what is refused in words a trader reads, not in ids', () => {
    const reason = (capabilities: TradingCapabilities, request: TradingCapabilityRequest): string => {
      const result = checkTradingCapability(capabilities, request);
      return result.supported ? '' : result.reason;
    };
    expect(reason({ place: false }, { operation: 'place' })).toBe('Placing orders is not supported');
    expect(reason({ cancel: 'unknown' }, { operation: 'cancel' })).toBe('Support for cancelling orders is unknown');
    expect(reason({ orderTypes: ['LIMIT'] }, { operation: 'place', type: 'SL' })).toBe('Stop-loss orders are not supported');
    expect(reason({ orderTypes: ['LIMIT'] }, { operation: 'place', type: 'SL-M' })).toBe('Stop-loss market orders are not supported');
    expect(reason({ modes: ['analyzer'] }, { operation: 'place', type: 'LIMIT', mode: 'live' })).toBe('Live trading is not supported');
  });

  it('requires the relevant qualifiers when a declaration restricts new orders', () => {
    const capabilities: TradingCapabilities = { orderTypes: ['LIMIT'], modes: ['analyzer'] };
    expect(checkTradingCapability(capabilities, { operation: 'place' }).supported).toBe(false);
    expect(checkTradingCapability(capabilities, { operation: 'place', type: 'LIMIT' }).supported).toBe(false);
    expect(checkTradingCapability(capabilities, { operation: 'place', type: 'LIMIT', mode: 'analyzer' }).supported).toBe(true);
    expect(checkTradingCapability(capabilities, { operation: 'cancel', type: 'MARKET', mode: 'live' }).supported).toBe(true);
  });

  it('exposes typed preflight refusals and request context without letting providers alter it', () => {
    const request = { operation: 'place' as const, symbol: order.symbol, exchange: order.exchange, type: order.type, mode: 'live' as const };
    const provider = vi.fn((_request: Readonly<TradingCapabilityRequest>) => ({ place: false }));
    expect(() => assertTradingCapability(provider, request)).toThrow(TradingCapabilityError);
    expect(provider).toHaveBeenCalledWith(request);
    expect(Object.isFrozen(provider.mock.calls[0][0])).toBe(true);
    try { assertTradingCapability(provider, request); } catch (error) {
      expect(error).toMatchObject({ name: 'TradingCapabilityError', operation: 'place', preflight: true });
    }
  });
});

describe('trading capability enforcement', () => {
  it('preserves the legacy path when declarations are omitted', async () => {
    const feed = memoryFeed();
    const manager = engine(feed);
    const placed = await manager.placeOrder(order);
    expect(placed).toMatchObject({ ok: true, intent: 'SUBMITTED' });
    expect(manager.brokerStatus(placed.clientId!)).toBeUndefined();
    manager.requestModify(placed.clientId!, 101);
    await manager.commitModify(placed.clientId!);
    await manager.cancelOrder(placed.clientId!);
    expect(feed.place).toHaveBeenCalledTimes(1);
    expect(feed.modify).toHaveBeenCalledTimes(1);
    expect(feed.cancel).toHaveBeenCalledTimes(1);
  });

  it.each<TradingCapabilitySource>([
    { place: false }, { place: 'unknown' }, { orderTypes: [] }, { orderTypes: ['MARKET'] },
    { modes: ['analyzer'] }, () => undefined, () => { throw new Error('metadata unavailable'); },
  ])('blocks unsupported or unknown placement before confirmation and transport: %s', async capabilities => {
    const feed = memoryFeed(capabilities);
    const gate = vi.fn(() => true);
    const manager = engine(feed, { armed: false, gate });
    expect(await manager.placeOrder(order)).toMatchObject({ ok: false, intent: 'BLOCKED', reason: expect.any(String) });
    expect(feed.place).not.toHaveBeenCalled();
    expect(gate).not.toHaveBeenCalled();
  });

  it('combines host restrictions with feed restrictions instead of overriding them', async () => {
    const feed = memoryFeed({ place: false });
    expect(await engine(feed, { capabilities: { place: true } }).placeOrder(order)).toMatchObject({ ok: false, intent: 'BLOCKED' });
    const supported = memoryFeed({ place: true });
    expect(await engine(supported, { capabilities: { place: false } }).placeOrder(order)).toMatchObject({ ok: false, intent: 'BLOCKED' });
    expect(feed.place).not.toHaveBeenCalled();
    expect(supported.place).not.toHaveBeenCalled();
  });

  it('rechecks a dynamic host lock after confirmation and releases only the unsent token', async () => {
    const confirmed = deferred<boolean>();
    let replayOrSelection = false;
    const feed = memoryFeed();
    const manager = engine(feed, {
      armed: false, gate: () => confirmed.promise,
      capabilities: () => ({ place: !replayOrSelection }),
    });
    const pending = manager.placeOrder(order);
    replayOrSelection = true;
    confirmed.resolve(true);
    expect(await pending).toMatchObject({ ok: false, intent: 'BLOCKED' });
    expect(feed.place).not.toHaveBeenCalled();
    expect(manager.state(order.clientToken!)).toBeUndefined();
    replayOrSelection = false;
    expect(await manager.placeOrder(order)).toMatchObject({ ok: true, intent: 'SUBMITTED' });
    expect(feed.place).toHaveBeenCalledTimes(1);
  });

  it('rechecks feed capabilities when support disappears during confirmation', async () => {
    const confirmed = deferred<boolean>();
    let available = true;
    const feed = memoryFeed(() => available ? { place: true } : undefined);
    const manager = engine(feed, { armed: false, gate: () => confirmed.promise });
    const pending = manager.placeOrder(order);
    available = false;
    confirmed.resolve(true);
    expect(await pending).toMatchObject({ ok: false, intent: 'BLOCKED' });
    expect(feed.place).not.toHaveBeenCalled();
  });

  it('refuses modify and cancel without changing an existing authoritative order', async () => {
    let capabilities: TradingCapabilities = {};
    const feed = memoryFeed(() => capabilities);
    const onValidationError = vi.fn();
    const manager = engine(feed, { onValidationError });
    await manager.placeOrder(order);
    manager.onBrokerUpdate('broker-1', 'partial');
    capabilities = { modify: false, cancel: 'unknown' };
    manager.requestModify(order.clientToken!, 102);
    await manager.commitModify(order.clientToken!);
    await manager.cancelOrder(order.clientToken!);
    expect(feed.modify).not.toHaveBeenCalled();
    expect(feed.cancel).not.toHaveBeenCalled();
    expect(onValidationError).toHaveBeenCalledTimes(2);
    expect(manager.state(order.clientToken!)).toBe('partial');
    expect(manager.intentState(order.clientToken!)).toBe('ACKNOWLEDGED');
    expect(manager.brokerStatus(order.clientToken!)).toBe('partial');
  });

  it('rechecks a queued modify at flush and discards it when support is withdrawn', async () => {
    let supported = true;
    const feed = memoryFeed(() => ({ modify: supported }));
    const manager = engine(feed, { now: () => 100, minModifyIntervalMs: 150 });
    await manager.placeOrder(order);
    manager.onBrokerUpdate('broker-1', 'working');
    manager.requestModify(order.clientToken!, 101);
    await Promise.resolve();
    manager.requestModify(order.clientToken!, 102);
    supported = false;
    await manager.commitModify(order.clientToken!);
    expect(feed.modify).toHaveBeenCalledTimes(1);
    expect(manager.state(order.clientToken!)).toBe('working');
    expect(manager.intentState(order.clientToken!)).toBe('ACKNOWLEDGED');
    supported = true;
    await manager.commitModify(order.clientToken!);
    expect(feed.modify).toHaveBeenCalledTimes(1);
  });

  it.each(['modify', 'cancel'] as const)('preserves state when a direct feed refuses %s before delivery', async operation => {
    const feed = memoryFeed();
    feed[operation].mockRejectedValueOnce(Object.assign(new Error('Capability withdrawn'), { preflight: true }));
    const manager = engine(feed);
    await manager.placeOrder(order);
    manager.onBrokerUpdate('broker-1', 'partial');
    if (operation === 'modify') {
      manager.requestModify(order.clientToken!, 101);
      await Promise.resolve();
      await manager.commitModify(order.clientToken!);
    } else await manager.cancelOrder(order.clientToken!);
    expect(manager.state(order.clientToken!)).toBe('partial');
    expect(manager.intentState(order.clientToken!)).toBe('ACKNOWLEDGED');
    expect(manager.brokerStatus(order.clientToken!)).toBe('partial');
  });

  it('retains an ambiguous intent and its token when capability support changes', async () => {
    let supported = true;
    const feed = memoryFeed(() => ({ place: supported }));
    feed.place.mockRejectedValueOnce(new Error('Response lost after delivery'));
    const manager = engine(feed, { maxSettledOrders: 0 });
    expect(await manager.placeOrder(order)).toMatchObject({ ok: false, intent: 'AMBIGUOUS' });
    supported = false;
    expect(await manager.placeOrder(order)).toMatchObject({ ok: false, intent: 'AMBIGUOUS' });
    expect(manager.intentState(order.clientToken!)).toBe('AMBIGUOUS');
    expect(manager.brokerStatus(order.clientToken!)).toBeUndefined();
    supported = true;
    expect(await manager.placeOrder(order)).toMatchObject({ ok: false, intent: 'AMBIGUOUS' });
    expect(feed.place).toHaveBeenCalledTimes(1);
  });

  it('permits cancelling an existing order after support for new orders of its type is removed', async () => {
    let capabilities: TradingCapabilities = { orderTypes: ['LIMIT'] };
    const feed = memoryFeed(() => capabilities);
    const manager = engine(feed);
    await manager.placeOrder(order);
    capabilities = { place: false, orderTypes: [], cancel: true };
    await manager.cancelOrder(order.clientToken!);
    expect(feed.cancel).toHaveBeenCalledWith('broker-1');
    expect(manager.brokerStatus(order.clientToken!)).toBeUndefined();
  });

  it('does not infer acknowledgement when a submitted order has a preflight cancel refusal', async () => {
    const feed = memoryFeed();
    const manager = engine(feed);
    await manager.placeOrder(order);
    feed.cancel.mockRejectedValueOnce(Object.assign(new Error('Unsupported cancel'), { preflight: true }));
    await manager.cancelOrder(order.clientToken!);
    expect(manager.state(order.clientToken!)).toBe('working');
    expect(manager.intentState(order.clientToken!)).toBe('SUBMITTED');
    expect(manager.brokerStatus(order.clientToken!)).toBeUndefined();
  });

  it('retains a broker fill received while a preflight refusal is pending', async () => {
    const response = deferred<void>();
    const feed = memoryFeed();
    feed.cancel.mockReturnValueOnce(response.promise);
    const manager = engine(feed);
    await manager.placeOrder(order);
    const pending = manager.cancelOrder(order.clientToken!);
    manager.onBrokerUpdate('broker-1', 'filled');
    response.reject(Object.assign(new Error('Capability unavailable'), { preflight: true }));
    await pending;
    expect(manager.state(order.clientToken!)).toBe('filled');
    expect(manager.intentState(order.clientToken!)).toBe('SETTLED');
    expect(manager.brokerStatus(order.clientToken!)).toBe('filled');
  });

  it('applies cancellation capabilities to the OCO peer route', async () => {
    const feed = memoryFeed({ cancel: false });
    const manager = engine(feed);
    await manager.placeOrder(order);
    await manager.placeOrder({ ...order, clientToken: 'intent-2' });
    manager.linkOco('intent-1', 'intent-2');
    manager.onFill('broker-1', true);
    expect(feed.cancel).not.toHaveBeenCalled();
    expect(manager.state('intent-2')).toBe('working');
    expect(manager.intentState('intent-2')).toBe('SUBMITTED');
  });
});
