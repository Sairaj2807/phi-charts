import { describe, it, expect } from 'vitest';
import { transition } from '../src/trade/order-state-machine';

describe('an authoritative rejection lands on every working state', () => {
  it('moves a working order to rejected', () => {
    expect(transition('working', 'reject')).toBe('rejected');
    expect(transition('partial', 'reject')).toBe('rejected');
    // The modify/cancel round trips still fall back to working, unchanged.
    expect(transition('modify_pending', 'reject')).toBe('working');
    expect(transition('cancel_pending', 'reject')).toBe('working');
  });
});
