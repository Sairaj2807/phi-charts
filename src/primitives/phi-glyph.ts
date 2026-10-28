/** The PHI symbol, a ring crossed by a vertical bar, as one filled path so SVG export keeps it as vectors. */
export function drawPhiGlyph(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  const centre = size / 2;
  const bar = size * 0.1;
  ctx.beginPath();
  ctx.arc(x + centre, y + centre, size * 0.34, 0, Math.PI * 2);
  ctx.arc(x + centre, y + centre, size * 0.24, 0, Math.PI * 2, true);
  ctx.rect(x + centre - bar / 2, y, bar, size);
  ctx.fill();
}
