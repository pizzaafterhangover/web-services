import * as Plot from '@observablehq/plot';
import { useEffect, useRef } from 'preact/hooks';

type Row = Record<string, number | string>;

export interface ChartProps {
  data: Row[];
  x: string;
  y: string | string[];
  kind?: 'line' | 'dot' | 'bar';
  xLabel?: string;
  yLabel?: string;
  caption?: string;
  height?: number;
}

const seriesTokens = ['--cat-slam', '--cat-robotics', '--cat-math', '--cat-learning', '--cat-control', '--cat-perception'];

function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

// 여러 y 열을 { x, value, series } 형태로 펼친다.
function toLong(data: Row[], x: string, ys: string[]) {
  return data.flatMap((row) => ys.map((series) => ({ x: row[x], value: Number(row[series]), series })));
}

// 실험 회차처럼 정수 x가 몇 개뿐이면 그 값만 눈금으로 쓴다(1.5 같은 눈금 방지).
function integerTicks(data: Row[], x: string) {
  const xs = [...new Set(data.map((row) => row[x]))];
  if (xs.length > 12 || !xs.every((v) => Number.isInteger(v))) return undefined;
  return { ticks: xs as number[], tickFormat: 'd' };
}

export function renderChart(el: HTMLElement, { data, x, y, kind = 'line', xLabel, yLabel, height = 300 }: ChartProps) {
  const ys = Array.isArray(y) ? y : [y];
  const rows = toLong(data, x, ys);
  const mark = { line: Plot.lineY, dot: Plot.dot, bar: Plot.barY }[kind];
  const text = cssVar('--text');
  const muted = cssVar('--text-muted');

  const chart = Plot.plot({
    width: el.clientWidth || 640,
    height,
    marginLeft: 48,
    marginBottom: 44,
    style: { background: 'transparent', color: text, fontFamily: cssVar('--font-sans'), fontSize: '12px' },
    x: {
      label: xLabel ?? x,
      labelAnchor: 'center',
      labelOffset: 38,
      labelArrow: 'none',
      ...(kind === 'bar' ? {} : { nice: true }),
      ...(integerTicks(data, x) ?? {}),
    },
    y: { label: yLabel ?? (ys.length === 1 ? ys[0] : null), grid: true, nice: true },
    color: { domain: ys, range: seriesTokens.map(cssVar), legend: ys.length > 1 },
    marks: [
      Plot.ruleY([0], { stroke: muted }),
      mark(rows, { x: 'x', y: 'value', stroke: kind === 'bar' ? undefined : 'series', fill: kind === 'line' ? undefined : 'series', tip: true }),
    ],
  });

  el.replaceChildren(chart);
}

export default function Chart(props: ChartProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current!;
    const draw = () => renderChart(el, props);
    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(el);
    document.addEventListener('themechange', draw);
    return () => {
      observer.disconnect();
      document.removeEventListener('themechange', draw);
    };
  }, [props]);

  return (
    <figure class="chart">
      <div ref={ref} style={{ minHeight: `${props.height ?? 300}px` }} />
      {props.caption && <figcaption>{props.caption}</figcaption>}
    </figure>
  );
}
