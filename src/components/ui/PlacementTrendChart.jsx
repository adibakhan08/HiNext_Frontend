export function PlacementTrendChart({
  title = 'Placement Trend',
  seriesAName = 'Applications',
  seriesBName = 'Placed',
  data = [],
}) {
  const width = 680;
  const height = 240;
  const padLeft = 40;
  const padRight = 20;
  const padTop = 16;
  const padBottom = 32;

  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const maxVal = Math.max(
    ...data.map((d) => Math.max(d.applications || 0, d.placed || 0)),
    10
  );
  const yMax = Math.ceil(maxVal / 10) * 10;

  const getCoords = (key) =>
    data.map((item, idx) => {
      const x =
        padLeft + (data.length > 1 ? (idx / (data.length - 1)) * plotW : plotW / 2);
      const y = padTop + plotH - ((item[key] || 0) / yMax) * plotH;
      return { x, y };
    });

  const pointsA = getCoords('applications');
  const pointsB = getCoords('placed');

  const toLinePath = (pts) =>
    pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  const toAreaPath = (pts) => {
    if (!pts.length) return '';
    const line = toLinePath(pts);
    return `${line} L ${pts[pts.length - 1].x} ${padTop + plotH} L ${pts[0].x} ${
      padTop + plotH
    } Z`;
  };

  return (
    <div className="flex flex-col justify-between rounded-xl border border-border-subtle bg-surface-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ink-primary">{title}</h2>

        <div className="flex items-center gap-4 text-[11px] font-medium">
          <span className="flex items-center gap-1.5 text-indigo-400">
            <span className="h-2 w-2 rounded-full bg-indigo-400" />
            {seriesAName}
          </span>
          <span className="flex items-center gap-1.5 text-accent-emerald">
            <span className="h-2 w-2 rounded-full bg-accent-emerald" />
            {seriesBName}
          </span>
        </div>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full overflow-visible">
        <defs>
          <linearGradient id="gradIndigo" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="gradEmerald" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal Grid Lines & Y-Axis Labels */}
        {[0, 0.5, 1].map((step) => {
          const y = padTop + plotH * (1 - step);
          const val = Math.round(yMax * step);
          return (
            <g key={step}>
              <line
                x1={padLeft}
                y1={y}
                x2={width - padRight}
                y2={y}
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="1"
              />
              <text
                x={padLeft - 10}
                y={y + 4}
                textAnchor="end"
                className="fill-ink-muted text-[11px]"
              >
                {val}
              </text>
            </g>
          );
        })}

        {/* Series A (Applications) */}
        {pointsA.length > 0 && (
          <>
            <path d={toAreaPath(pointsA)} fill="url(#gradIndigo)" />
            <path
              d={toLinePath(pointsA)}
              fill="none"
              stroke="#6366f1"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        )}

        {/* Series B (Placed) */}
        {pointsB.length > 0 && (
          <>
            <path d={toAreaPath(pointsB)} fill="url(#gradEmerald)" />
            <path
              d={toLinePath(pointsB)}
              fill="none"
              stroke="#10b981"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        )}

        {/* X-Axis Month Labels */}
        {data.map((item, idx) => {
          const x =
            padLeft + (data.length > 1 ? (idx / (data.length - 1)) * plotW : plotW / 2);
          return (
            <text
              key={item.month}
              x={x}
              y={height - 6}
              textAnchor="middle"
              className="fill-ink-secondary text-[11px]"
            >
              {item.month}
            </text>
          );
        })}
      </svg>
    </div>
  );
}