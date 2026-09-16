// Pure-SVG chart primitives. No client JS, no external deps — safe to render
// inside server components. All sizing is responsive via viewBox + w-full.

type Point = { label: string; value: number };

function niceMax(max: number) {
  if (max <= 0) return 1;
  const pow = Math.pow(10, Math.floor(Math.log10(max)));
  const n = max / pow;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * pow;
}

/** Smooth area + line chart for time-series trends. */
export function AreaChart({
  data,
  height = 220,
  stroke = '#4f46e5',
  fill = 'rgba(99,102,241,0.14)',
  valuePrefix = '',
  formatValue,
}: {
  data: Point[];
  height?: number;
  stroke?: string;
  fill?: string;
  valuePrefix?: string;
  formatValue?: (v: number) => string;
}) {
  const W = 640;
  const H = height;
  const padX = 8;
  const padTop = 16;
  const padBottom = 28;
  const innerW = W - padX * 2;
  const innerH = H - padTop - padBottom;
  const max = niceMax(Math.max(...data.map((d) => d.value), 0));
  const n = data.length;
  const stepX = n > 1 ? innerW / (n - 1) : 0;

  const pts = data.map((d, i) => {
    const x = padX + i * stepX;
    const y = padTop + innerH - (d.value / max) * innerH;
    return { x, y, ...d };
  });

  // Smooth path (catmull-rom -> bezier)
  const linePath = pts
    .map((p, i) => {
      if (i === 0) return `M ${p.x} ${p.y}`;
      const prev = pts[i - 1];
      const cx = (prev.x + p.x) / 2;
      return `C ${cx} ${prev.y} ${cx} ${p.y} ${p.x} ${p.y}`;
    })
    .join(' ');
  const areaPath = `${linePath} L ${pts[pts.length - 1]?.x ?? padX} ${padTop + innerH} L ${pts[0]?.x ?? padX} ${padTop + innerH} Z`;

  const fmt = formatValue ?? ((v: number) => `${valuePrefix}${v.toLocaleString('en-IN')}`);
  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none" role="img">
      {gridLines.map((g) => {
        const y = padTop + innerH - g * innerH;
        return (
          <g key={g}>
            <line x1={padX} y1={y} x2={W - padX} y2={y} stroke="#eef2f7" strokeWidth={1} />
            <text x={padX} y={y - 4} fontSize={10} fill="#94a3b8">
              {fmt(Math.round(g * max))}
            </text>
          </g>
        );
      })}
      {data.length > 0 && (
        <>
          <path d={areaPath} fill={fill} />
          <path d={linePath} fill="none" stroke={stroke} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
          {pts.map((p) => (
            <circle key={p.label} cx={p.x} cy={p.y} r={3} fill="#fff" stroke={stroke} strokeWidth={2} />
          ))}
          {pts.map((p, i) => (
            <text
              key={`${p.label}-lbl`}
              x={p.x}
              y={H - 8}
              fontSize={10}
              fill="#94a3b8"
              textAnchor={i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}>
              {p.label}
            </text>
          ))}
        </>
      )}
    </svg>
  );
}

/** Vertical bar chart. */
export function BarChart({
  data,
  height = 200,
  color = '#6366f1',
  formatValue,
}: {
  data: Point[];
  height?: number;
  color?: string;
  formatValue?: (v: number) => string;
}) {
  const W = 640;
  const H = height;
  const padX = 8;
  const padTop = 12;
  const padBottom = 26;
  const innerW = W - padX * 2;
  const innerH = H - padTop - padBottom;
  const max = niceMax(Math.max(...data.map((d) => d.value), 0));
  const n = data.length || 1;
  const slot = innerW / n;
  const barW = Math.min(46, slot * 0.6);
  const fmt = formatValue ?? ((v: number) => v.toLocaleString('en-IN'));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img">
      <line x1={padX} y1={padTop + innerH} x2={W - padX} y2={padTop + innerH} stroke="#e2e8f0" strokeWidth={1} />
      {data.map((d, i) => {
        const h = max > 0 ? (d.value / max) * innerH : 0;
        const x = padX + i * slot + (slot - barW) / 2;
        const y = padTop + innerH - h;
        return (
          <g key={d.label}>
            <rect x={x} y={y} width={barW} height={h} rx={6} fill={color} opacity={0.9} />
            <text x={x + barW / 2} y={y - 6} fontSize={10} fontWeight={600} fill="#475569" textAnchor="middle">
              {d.value > 0 ? fmt(d.value) : ''}
            </text>
            <text x={x + barW / 2} y={H - 8} fontSize={10} fill="#94a3b8" textAnchor="middle">
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/** Donut chart with center total. */
export function Donut({
  data,
  size = 168,
  thickness = 22,
}: {
  data: { label: string; value: number; color: string }[];
  size?: number;
  thickness?: number;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const r = (size - thickness) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="flex items-center gap-5">
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className="shrink-0">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#eef2f7" strokeWidth={thickness} />
        {total > 0 &&
          data.map((d) => {
            const frac = d.value / total;
            const dash = frac * circ;
            const el = (
              <circle
                key={d.label}
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke={d.color}
                strokeWidth={thickness}
                strokeDasharray={`${dash} ${circ - dash}`}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
                transform={`rotate(-90 ${cx} ${cy})`}
              />
            );
            offset += dash;
            return el;
          })}
        <text x={cx} y={cy - 2} textAnchor="middle" fontSize={22} fontWeight={700} fill="#0f172a">
          {total.toLocaleString('en-IN')}
        </text>
        <text x={cx} y={cy + 16} textAnchor="middle" fontSize={10} fill="#94a3b8">
          Total
        </text>
      </svg>
      <ul className="space-y-2 text-sm">
        {data.map((d) => (
          <li key={d.label} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
            <span className="text-ink-muted">{d.label}</span>
            <span className="ml-auto font-semibold text-ink">
              {total > 0 ? Math.round((d.value / total) * 100) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Tiny inline sparkline for KPI cards. */
export function Sparkline({ values, color = '#6366f1', width = 120, height = 36 }: { values: number[]; color?: string; width?: number; height?: number }) {
  if (values.length === 0) return null;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const stepX = values.length > 1 ? width / (values.length - 1) : 0;
  const path = values
    .map((v, i) => {
      const x = i * stepX;
      const y = height - ((v - min) / range) * (height - 4) - 2;
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} className="overflow-visible">
      <path d={path} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
