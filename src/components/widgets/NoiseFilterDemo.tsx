import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { renderChart } from '../mdx/Chart';

// 고정 시드 난수 — 슬라이더를 움직여도 잡음 모양이 유지되게 한다.
function seeded(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
}

function gaussian(rand: () => number) {
  return Math.sqrt(-2 * Math.log(rand() || 1e-9)) * Math.cos(2 * Math.PI * rand());
}

export default function NoiseFilterDemo() {
  const [sigma, setSigma] = useState(0.3);
  const [size, setSize] = useState(5);
  const ref = useRef<HTMLDivElement>(null);

  const data = useMemo(() => {
    const rand = seeded(42);
    const raw = Array.from({ length: 120 }, (_, i) => {
      const t = i / 10;
      return { t, 실제값: Math.sin(t), 측정값: Math.sin(t) + sigma * gaussian(rand) };
    });
    return raw.map((row, i) => {
      const slice = raw.slice(Math.max(0, i - size + 1), i + 1);
      return { ...row, 이동평균: slice.reduce((s, r) => s + r.측정값, 0) / slice.length };
    });
  }, [sigma, size]);

  useEffect(() => {
    const el = ref.current!;
    const draw = () => renderChart(el, { data, x: 't', y: ['실제값', '측정값', '이동평균'], xLabel: '시간 (s)', yLabel: '값' });
    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(el);
    document.addEventListener('themechange', draw);
    return () => {
      observer.disconnect();
      document.removeEventListener('themechange', draw);
    };
  }, [data]);

  return (
    <figure class="widget">
      <div class="widget-controls">
        <label>
          잡음 표준편차 σ <output>{sigma.toFixed(2)}</output>
          <input type="range" min="0" max="1" step="0.05" value={sigma} onInput={(e) => setSigma(Number(e.currentTarget.value))} />
        </label>
        <label>
          이동평균 창 크기 <output>{size}</output>
          <input type="range" min="1" max="25" step="1" value={size} onInput={(e) => setSize(Number(e.currentTarget.value))} />
        </label>
      </div>
      <div ref={ref} style={{ minHeight: '300px' }} />
      <figcaption>창이 클수록 잡음은 줄지만 실제 신호보다 늦게 따라간다(지연).</figcaption>
    </figure>
  );
}
