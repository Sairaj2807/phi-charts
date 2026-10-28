/**
 * The chart instrument's news in a dock panel: a list of headlines with their
 * source and time, a detail view, and older pages on request.
 *
 * Provider text is only ever assigned as text, so a headline carrying markup
 * shows the markup rather than running it, and an article opens only through
 * an http or https link that cannot reach back into this page.
 */
import { DEFAULT_TIMEZONE, type InstrumentKey, type NewsFeed, type NewsItem } from 'phi-charts';
import type { WidgetContext } from './context';
import { button, el } from './form';
import { widgetText } from './localization';
import type { PanelDockContent } from './panel-dock';
import { NewsReader, type NewsSnapshot } from './news-reader';

export interface NewsPanelOptions {
  feed: NewsFeed;
  /** Items asked for per page. Default 20. */
  pageSize?: number;
  /** News older than this since it loaded is flagged stale. Default 300000 ms. */
  staleAfterMs?: number;
  /** Items held at most. Default 500. */
  maxItems?: number;
}

export interface NewsPanelHandle extends PanelDockContent {
  readonly el: HTMLElement;
  /** Reload the newest page for the chart's instrument. */
  refresh(): Promise<void>;
}

/** An absolute http or https URL without credentials, normalised, or null. */
export function safeNewsUrl(value: string | undefined): string | null {
  if (typeof value !== 'string') return null;
  const candidate = value.trim();
  if (!/^https?:\/\//i.test(candidate)) return null;
  try {
    const url = new URL(candidate);
    return (url.protocol === 'http:' || url.protocol === 'https:') && url.username === '' && url.password === '' ? url.href : null;
  } catch { return null; }
}

/** Mount the news reader into a host element, typically the widget's panel dock. */
export function mountNewsPanel(ctx: WidgetContext, host: HTMLElement, options: NewsPanelOptions): NewsPanelHandle {
  const doc = ctx.document;
  const text = (key: string, fallback: string, values: Record<string, string | number> = {}): string =>
    widgetText(ctx, `schema.ui.news.${key}`, values, fallback);
  const root = el(doc, 'div', 'phi-news');
  root.setAttribute('aria-label', text('title', 'News'));
  const bar = el(doc, 'div', 'phi-news__bar');
  const heading = el(doc, 'div', 'phi-news__heading');
  const instrumentLabel = el(doc, 'span', 'phi-news__instrument');
  const exchangeLabel = el(doc, 'span', 'phi-news__exchange');
  heading.append(instrumentLabel, exchangeLabel);
  const refreshButton = button(doc, { label: text('refresh', 'Refresh'), onClick: () => { void reader.refresh(); } });
  refreshButton.setAttribute('aria-label', text('refreshNews', 'Refresh news'));
  bar.append(heading, refreshButton);
  const status = el(doc, 'div', 'phi-news__status');
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  const list = el(doc, 'ul', 'phi-news__list');
  list.setAttribute('aria-label', text('headlines', 'Headlines'));
  const more = el(doc, 'div', 'phi-news__more');
  const moreError = el(doc, 'p', 'phi-news__more-error');
  const loadMore = button(doc, { label: '', onClick: () => { void reader.loadMore(); } });
  const end = el(doc, 'span', 'phi-news__end');
  more.append(moreError, loadMore, end);
  const detail = el(doc, 'article', 'phi-news__detail');
  detail.hidden = true;
  const back = button(doc, { label: text('back', 'Back to news'), onClick: () => closeDetail() });
  const detailHeadline = el(doc, 'h3', 'phi-news__detail-headline');
  const detailMeta = el(doc, 'p', 'phi-news__detail-meta');
  const detailSummary = el(doc, 'p', 'phi-news__detail-summary');
  const detailLink = el(doc, 'div', 'phi-news__detail-link');
  detail.append(back, detailHeadline, detailMeta, detailSummary, detailLink);
  root.append(bar, status, list, more, detail);
  host.appendChild(root);

  let destroyed = false;
  let snapshot: NewsSnapshot | null = null;
  let openId: string | null = null;
  const items = new Map<string, { li: HTMLElement; open: HTMLButtonElement; item: NewsItem }>();
  const zone = (): string => { try { return ctx.chart.timezone(); } catch { return DEFAULT_TIMEZONE; } };
  const formatter = (style: Intl.DateTimeFormatOptions): Intl.DateTimeFormat => {
    try { return new Intl.DateTimeFormat(ctx.locale, { timeZone: zone(), ...style }); }
    catch { return new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', ...style }); }
  };
  // One formatter per zone, not per item: a page repaints every headline's time.
  let stamp: { zone: string; format: Intl.DateTimeFormat } | null = null;
  const when = (seconds: number): string => {
    if (stamp?.zone !== zone()) stamp = { zone: zone(), format: formatter({ dateStyle: 'medium', timeStyle: 'short' }) };
    return stamp.format.format(new Date(seconds * 1000));
  };
  const iso = (seconds: number): string => { try { return new Date(seconds * 1000).toISOString(); } catch { return ''; } };
  const instrument = (): InstrumentKey | null => {
    const current = ctx.symbol();
    return current.symbol === '' ? null : { symbol: current.symbol, exchange: current.exchange };
  };
  const reader = new NewsReader({
    feed: options.feed, pageSize: options.pageSize, staleAfterMs: options.staleAfterMs, maxItems: options.maxItems,
    onChange: next => { snapshot = next; paint(); },
  });

  const meta = (item: NewsItem, into: HTMLElement): void => {
    into.textContent = '';
    if (item.source !== undefined) into.appendChild(el(doc, 'span', 'phi-news__source', item.source));
    const time = el(doc, 'time', 'phi-news__time', when(item.time));
    time.setAttribute('datetime', iso(item.time));
    into.appendChild(time);
  };

  function statusFor(state: NewsSnapshot): { text: string; kind: string } {
    const symbol = state.instrument?.symbol ?? '';
    if (state.instrument === null) return { text: text('status.none', 'Choose a symbol to see its news'), kind: 'idle' };
    if (state.status === 'loading') return state.items.length > 0
      ? { text: text('status.refreshing', 'Refreshing news for {symbol}', { symbol }), kind: 'loading' }
      : { text: text('status.loading', 'Loading news for {symbol}', { symbol }), kind: 'loading' };
    if (state.status === 'empty') return { text: text('status.empty', 'No news for {symbol}', { symbol }), kind: 'empty' };
    if (state.status === 'error') return { text: text('status.error', 'News could not load: {error}', { error: state.error ?? '' }), kind: 'error' };
    if (state.refreshFailed) return { text: text('status.staleFailed', 'Showing earlier news. Refresh failed: {error}', { error: state.error ?? '' }), kind: 'stale' };
    const updated = state.loadedAt === null ? '' : formatter({ timeStyle: 'short' }).format(new Date(state.loadedAt));
    if (state.stale) return { text: text('status.stale', 'Updated {time}. Refresh for newer news.', { time: updated }), kind: 'stale' };
    return { text: text('status.ready', 'Updated {time}', { time: updated }), kind: 'ready' };
  }

  function paint(): void {
    if (destroyed || snapshot === null) return;
    const state = snapshot;
    instrumentLabel.textContent = state.instrument?.symbol ?? '';
    exchangeLabel.textContent = state.instrument?.exchange ?? '';
    refreshButton.disabled = state.instrument === null || state.status === 'loading';
    const described = statusFor(state);
    status.textContent = described.text;
    status.dataset.state = described.kind;

    const ids = new Set(state.items.map(item => item.id));
    for (const [id, row] of items) if (!ids.has(id)) { row.li.remove(); items.delete(id); }
    state.items.forEach((item, index) => {
      let row = items.get(item.id);
      if (!row) {
        const li = el(doc, 'li', 'phi-news__item');
        const open = el(doc, 'button', 'phi-news__open');
        open.type = 'button';
        open.dataset.id = item.id;
        open.addEventListener('click', () => openDetail(item.id));
        li.appendChild(open);
        row = { li, open, item };
        items.set(item.id, row);
      }
      row.item = item;
      row.open.textContent = '';
      const metaLine = el(doc, 'span', 'phi-news__meta');
      meta(item, metaLine);
      row.open.append(el(doc, 'span', 'phi-news__headline', item.headline), metaLine);
      if (list.children[index] !== row.li) list.insertBefore(row.li, list.children[index] ?? null);
    });

    // One persistent button, so focus survives its own click and the page it loads.
    const moreFailed = state.hasMore && state.error !== null && !state.loadingMore && state.status === 'ready' && !state.refreshFailed;
    moreError.hidden = !moreFailed;
    moreError.textContent = moreFailed ? text('moreFailed', 'Older news could not load: {error}', { error: state.error ?? '' }) : '';
    loadMore.hidden = !state.hasMore;
    loadMore.textContent = state.loadingMore ? text('loadingMore', 'Loading older news') : text('loadMore', 'Load older news');
    loadMore.disabled = state.loadingMore || state.status !== 'ready';
    const exhausted = !state.hasMore && state.items.length > 0 && state.status === 'ready';
    end.hidden = !exhausted;
    end.textContent = exhausted ? text('end', 'No older news') : '';
    if (openId !== null && !items.has(openId)) closeDetail(false);
    list.hidden = more.hidden = openId !== null;
  }

  function openDetail(id: string): void {
    const row = items.get(id);
    if (!row) return;
    openId = id;
    const item = row.item;
    detailHeadline.textContent = item.headline;
    meta(item, detailMeta);
    detailSummary.textContent = item.summary ?? '';
    detailSummary.hidden = item.summary === undefined;
    detailLink.textContent = '';
    const url = safeNewsUrl(item.url);
    if (url !== null) {
      const link = el(doc, 'a', 'phi-btn phi-btn--primary phi-news__article', text('openArticle', 'Open article'));
      link.setAttribute('href', url);
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
      link.setAttribute('referrerpolicy', 'no-referrer');
      detailLink.appendChild(link);
    } else detailLink.appendChild(el(doc, 'p', 'phi-news__no-link', text('noLink', 'No article link')));
    detail.hidden = false;
    list.hidden = more.hidden = true;
    back.focus();
  }

  function closeDetail(focus = true): void {
    const id = openId;
    openId = null;
    detail.hidden = true;
    list.hidden = more.hidden = false;
    if (focus && id !== null) items.get(id)?.open.focus();
  }

  const follow = (): void => {
    const next = instrument();
    const current = snapshot?.instrument ?? null;
    if (next?.symbol === current?.symbol && next?.exchange === current?.exchange && snapshot !== null) return;
    if (openId !== null) closeDetail(false);
    reader.setInstrument(next);
  };
  const stopPointer = (event: Event): void => { event.stopPropagation(); };
  root.addEventListener('pointerdown', stopPointer);
  const offs = [
    ctx.chart.on('data:context', follow),
    ctx.chart.on('timezone:changed', () => {
      paint();
      const open = openId === null ? undefined : items.get(openId);
      if (open) meta(open.item, detailMeta);
    }),
  ];
  snapshot = reader.snapshot();
  follow();
  paint();
  return {
    el: root, initialFocus: refreshButton,
    refresh: () => reader.refresh(),
    destroy: () => {
      if (destroyed) return;
      destroyed = true;
      reader.destroy();
      for (const off of offs) off();
      root.removeEventListener('pointerdown', stopPointer);
      items.clear();
      root.remove();
    },
  };
}

/** Rules to add to the widget's shared stylesheet or a custom host stylesheet. */
export const NEWS_PANEL_CSS = `
.phi-widget .phi-news { display: flex; flex-direction: column; gap: 6px; padding: 8px 10px 10px; font-size: 12px; min-height: 0; }
.phi-widget .phi-news__bar { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.phi-widget .phi-news__heading { display: flex; align-items: baseline; gap: 5px; min-width: 0; }
.phi-widget .phi-news__instrument { font-weight: 600; color: var(--phi-tx); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.phi-widget .phi-news__exchange { font-size: 10px; color: var(--phi-mut); }
.phi-widget .phi-news .phi-btn { height: 26px; padding: 0 8px; font-size: 11px; }
.phi-widget .phi-news__status { font-size: 11px; color: var(--phi-mut); overflow-wrap: anywhere; }
.phi-widget .phi-news__status[data-state="error"], .phi-widget .phi-news__more-error { color: var(--phi-danger); }
.phi-widget .phi-news__status[data-state="stale"] { color: var(--phi-warn, var(--phi-mut)); }
.phi-widget .phi-news__list { list-style: none; margin: 0; padding: 0; }
.phi-widget .phi-news__list[hidden], .phi-widget .phi-news__more[hidden], .phi-widget .phi-news__detail[hidden], .phi-widget .phi-news__more > [hidden] { display: none; }
.phi-widget .phi-news__item { border-bottom: 1px solid var(--phi-bd-soft); }
.phi-widget .phi-news__open { display: flex; flex-direction: column; gap: 3px; width: 100%; padding: 7px 2px; border: 0; background: none; color: var(--phi-tx); font: inherit; text-align: left; cursor: pointer; }
.phi-widget .phi-news__open:hover, .phi-widget .phi-news__open:focus-visible { background: var(--phi-elev); }
.phi-widget .phi-news__headline { font-weight: 600; line-height: 1.35; overflow-wrap: anywhere; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.phi-widget .phi-news__meta, .phi-widget .phi-news__detail-meta { display: flex; flex-wrap: wrap; gap: 8px; font-size: 11px; color: var(--phi-mut); }
.phi-widget .phi-news__source { overflow-wrap: anywhere; }
.phi-widget .phi-news__more { display: flex; flex-direction: column; align-items: stretch; gap: 4px; padding-top: 4px; font-size: 11px; color: var(--phi-mut); text-align: center; }
.phi-widget .phi-news__more-error { margin: 0; text-align: left; overflow-wrap: anywhere; }
.phi-widget .phi-news__detail { display: flex; flex-direction: column; align-items: flex-start; gap: 8px; }
.phi-widget .phi-news__detail-headline { margin: 0; font: 600 14px/1.35 var(--phi-font); color: var(--phi-tx); overflow-wrap: anywhere; }
.phi-widget .phi-news__detail-meta { margin: 0; }
.phi-widget .phi-news__detail-summary { margin: 0; white-space: pre-line; line-height: 1.5; color: var(--phi-tx); overflow-wrap: anywhere; }
.phi-widget .phi-news__article { display: inline-flex; align-items: center; text-decoration: none; }
.phi-widget .phi-news__no-link { margin: 0; font-size: 11px; color: var(--phi-mut); }
.phi-widget .phi-panel-dock[data-sheet="true"] .phi-news__open { padding: 10px 2px; }
`;
