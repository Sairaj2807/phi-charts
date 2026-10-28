import { expect, test, type Page } from '@playwright/test';

const FIXTURE = '/tests/e2e/widget-feed-events-fixture.html';

/** A seeded random walk of daily bars that looks like a traded stock. */
function dailyBars(count: number, seed: number): Array<Record<string, number>> {
  let state = seed;
  const next = (): number => { state = (state * 1664525 + 1013904223) % 4294967296; return state / 4294967296; };
  const end = Date.UTC(2026, 8, 25) / 1000;
  let close = 2840;
  return Array.from({ length: count }, (_, i) => {
    const open = close;
    close = Math.max(1, open * (1 + (next() - 0.49) * 0.03));
    const high = Math.max(open, close) * (1 + next() * 0.008);
    const low = Math.min(open, close) * (1 - next() * 0.008);
    const round = (value: number): number => Math.round(value * 20) / 20;
    return { timestamp: end - (count - 1 - i) * 86400, open: round(open), high: round(high), low: round(low), close: round(close), volume: Math.round(2e6 + next() * 3e6) };
  });
}

async function mount(page: Page): Promise<void> {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/api/v1/history', route => route.fulfill({ json: { status: 'success', data: dailyBars(160, 11) } }));
  await page.setViewportSize({ width: 1180, height: 720 });
  await page.goto(FIXTURE);
  await page.waitForFunction(() => ((window as any).__feedEvents?.widget.series.getData().length ?? 0) > 100);
  expect(errors).toEqual([]);
}

test('event details render feed content as text and run host actions', async ({ page }, info) => {
  await mount(page);
  const point = await page.evaluate(() => {
    const { widget } = (window as any).__feedEvents;
    const bars = widget.series.getData();
    (window as any).__xss = 0;
    widget.chart.setEvents([{
      id: 'q2', time: bars[bars.length - 30].time, type: 'earnings', label: 'E', title: 'Quarterly results (sample data)',
      details: {
        summary: 'Sample event for the reference fixture, not a real announcement.',
        fields: [{ label: 'EPS', value: '31.40' }, { label: 'Revenue', value: '2.31 L Cr' }],
        blocks: [
          { type: 'heading', text: 'Highlights <img src=x onerror="window.__xss=1">' },
          { type: 'paragraph', text: [{ text: 'Margins ' }, { text: 'widened', strong: true }, { text: ' on lower input costs. ', em: true },
            { text: 'Filing', href: 'https://example.com/filings/q2' }, { text: ' and ' }, { text: 'a script link', href: 'javascript:window.__xss=1' }] },
          { type: 'list', items: ['Retail volume up 9%', '<script>window.__xss=1</script>', [{ text: 'Guidance kept', strong: true }]] },
        ],
      },
    }]);
    const rect = document.querySelector('#host .phi-chart')!.getBoundingClientRect();
    return new Promise<{ x: number; y: number } | null>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => {
      const markers = widget.chart.eventMarkers();
      for (let y = 0; y < rect.height; y++) for (let x = 0; x < rect.width; x++) {
        if (markers.hitTest(x, y)) { resolve({ x: rect.left + x, y: rect.top + y }); return; }
      }
      resolve(null);
    })));
  });
  expect(point).not.toBeNull();
  await page.mouse.click(point!.x, point!.y);
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('.phi-event-details__subhead')).toHaveText('Highlights <img src=x onerror="window.__xss=1">');
  await expect(dialog.locator('.phi-event-details__list li')).toHaveText(['Retail volume up 9%', '<script>window.__xss=1</script>', 'Guidance kept']);
  await expect(dialog.locator('img, script')).toHaveCount(0);
  await expect(dialog.locator('strong')).toHaveText(['widened', 'Guidance kept']);
  const links = dialog.locator('a');
  await expect(links).toHaveCount(1);
  await expect(links).toHaveAttribute('href', 'https://example.com/filings/q2');
  await expect(links).toHaveAttribute('rel', 'noopener noreferrer');
  await expect(links).toHaveAttribute('target', '_blank');
  await expect(dialog).toContainText('Filing and a script link');
  await dialog.getByText('a script link').click();
  expect(await page.evaluate(() => (window as any).__xss)).toBe(0);
  await page.screenshot({ path: info.outputPath('event-details-rich.png') });

  await dialog.getByRole('button', { name: 'Add to watchlist', exact: true }).click();
  await expect(dialog).toBeHidden();
  expect(await page.evaluate(() => (window as any).__feedEvents.actions)).toEqual(['q2']);
});
