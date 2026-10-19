import { useState } from 'preact/hooks';

// ROS 2 노드·토픽 구조도. 좌표는 글에서 직접 지정한다(노드 수가 적고 배치가 의미를 가지므로 자동 배치하지 않는다).

type Kind = 'topic' | 'service' | 'action' | 'hardware';

export interface Topic {
  name: string;
  type: string;
  note?: string;
}

/** 화살표로 그리지 않고 노드 세부에만 보이는 토픽(디버그용, 받는 쪽 미정 등) */
export interface ExtraTopic extends Topic {
  dir: 'in' | 'out';
  kind?: Kind;
  peer: string;
}

export interface GraphNode {
  id: string;
  label: string;
  sublabel?: string;
  /** 구조도에 보이는 역할. 줄바꿈 위치를 직접 정한다. */
  lines: string[];
  /** 세부 패널에 보이는 전체 역할 */
  role: string;
  kind: 'node' | 'hardware' | 'external';
  owner?: string;
  origin?: string;
  note?: string;
  /** tokens.css의 --cat-* 이름 */
  color: string;
  /** 이 노드가 속한 그룹 id. 그룹에서 나가는 토픽은 그룹 안 노드가 보내는 것으로 본다. */
  group?: string;
  /** 후보 전환용. 'none'이면 아무 후보도 고르지 않았을 때만 보인다. */
  mode?: string;
  extra?: ExtraTopic[];
  x: number;
  y: number;
  w: number;
}

export interface GraphGroup {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

/** 계층 띠. 노드 뒤에 깔리는 배경과 이름표 */
export interface GraphBand {
  label: string;
  sub?: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface GraphBus {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  vertical?: boolean;
}

export interface GraphEdge {
  id: string;
  from: string;
  to: string;
  kind: Kind;
  topics: Topic[];
  /** 화살표 경로 꼭짓점. 마지막 점이 화살촉 위치다. */
  points: [number, number][];
  both?: boolean;
  note?: string;
  mode?: string;
}

export interface GraphMode {
  id: string;
  label: string;
}

interface Props {
  nodes: GraphNode[];
  edges: GraphEdge[];
  groups?: GraphGroup[];
  bands?: GraphBand[];
  bus?: GraphBus;
  modes?: GraphMode[];
  modeLabel?: string;
  width: number;
  height: number;
  caption?: string;
}

type Selection = { type: 'node' | 'edge' | 'bus'; id: string } | null;

/** 표 한 줄. 화살표와 노드 세부의 추가 토픽을 같은 모양으로 맞춘다. */
interface Row extends Topic {
  kind: Kind;
  from: string;
  to: string;
}

const NODE_H = 70;
const KIND_LABEL: Record<Kind, string> = { topic: '토픽', service: '서비스', action: '액션', hardware: '하드웨어 연결' };
const NODE_KIND_LABEL = { hardware: '하드웨어', external: '외부' };

export default function RosGraph({ nodes: allNodes, edges: allEdges, groups = [], bands = [], bus, modes = [], modeLabel, width, height, caption }: Props) {
  const [sel, setSel] = useState<Selection>(null);
  const [mode, setMode] = useState<string | null>(null);

  const shown = (item: { mode?: string }) => !item.mode || (item.mode === 'none' ? mode === null : item.mode === mode);
  const nodes = allNodes.filter(shown);
  const edges = allEdges.filter(shown);

  const nameOf = (id: string) =>
    nodes.find((n) => n.id === id)?.label ??
    groups.find((g) => g.id === id)?.label ??
    (bus?.id === id ? bus.label : id);

  const touches = (edge: GraphEdge, id: string) => {
    const node = nodes.find((n) => n.id === id);
    const ends = [edge.from, edge.to];
    return ends.includes(id) || (!!node?.group && ends.includes(node.group));
  };

  const active = (edge: GraphEdge) => {
    if (!sel) return false;
    if (sel.type === 'edge') return sel.id === edge.id;
    return touches(edge, sel.id);
  };

  const nodeActive = (id: string) => {
    if (!sel) return false;
    if (sel.type !== 'edge') return sel.id === id;
    const edge = edges.find((e) => e.id === sel.id);
    return !!edge && touches(edge, id);
  };

  const select = (next: Selection) => setSel(sel && next && sel.type === next.type && sel.id === next.id ? null : next);
  const onKey = (next: Selection) => (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      select(next);
    }
  };
  const changeMode = (next: string | null) => {
    setMode(next);
    setSel(null);
  };

  const legendLabel = (n: GraphNode) => n.owner?.replace(/\s*\(제안\)$/, '') ?? NODE_KIND_LABEL[n.kind as 'hardware' | 'external'];
  const legend = [...new Map(allNodes.map((n) => [legendLabel(n), n.color])).entries()];
  const lineKinds = (['topic', 'service', 'action', 'hardware'] as Kind[]).filter((k) => allEdges.some((e) => e.kind === k));

  return (
    <figure class="widget ros-graph">
      <ul class="ros-graph-legend" aria-label="범례">
        {legend.map(([label, color]) => (
          <li>
            <span class="swatch" style={{ background: `var(--cat-${color})` }} aria-hidden="true" />
            {label}
          </li>
        ))}
        {lineKinds.map((kind) => (
          <li>
            <svg class={`legend-line edge ${kind}`} viewBox="0 0 24 6" aria-hidden="true">
              <path class="stroke" d="M0,3 H24" />
            </svg>
            {KIND_LABEL[kind]}
          </li>
        ))}
      </ul>

      {modes.length > 0 && (
        <div class="ros-graph-modes" role="group" aria-label={modeLabel}>
          <span>{modeLabel}</span>
          <button type="button" aria-pressed={mode === null} onClick={() => changeMode(null)}>
            고르지 않음
          </button>
          {modes.map((m) => (
            <button type="button" aria-pressed={mode === m.id} onClick={() => changeMode(m.id)}>
              {m.label}
            </button>
          ))}
        </div>
      )}

      <div class="ros-graph-scroll">
        <svg viewBox={`0 0 ${width} ${height}`} role="group" aria-label="ROS 2 노드·토픽 구조도" class={sel ? 'has-selection' : ''}>
          <defs>
            {['idle', 'on'].map((state) => (
              <marker id={`ros-arrow-${state}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M0,0 L10,5 L0,10 z" class={`arrow-head ${state}`} />
              </marker>
            ))}
          </defs>

          {bands.map((b) => (
            <g class="band">
              <rect x={b.x} y={b.y} width={b.w} height={b.h} rx="8" />
              <text x={b.x + 10} y={b.y + 15}>
                <tspan class="band-label">{b.label}</tspan>
                {b.sub && <tspan class="band-sub"> · {b.sub}</tspan>}
              </text>
            </g>
          ))}

          {groups.map((g) => (
            <g class="group">
              <rect x={g.x} y={g.y} width={g.w} height={g.h} rx="8" />
              <text x={g.x + 10} y={g.y + 14}>
                {g.label}
              </text>
            </g>
          ))}

          {bus && (
            <g
              class={`bus${sel?.type === 'bus' ? ' is-active' : ''}`}
              tabIndex={0}
              role="button"
              aria-pressed={sel?.type === 'bus'}
              aria-label={`${bus.label} 세부 보기`}
              onClick={() => select({ type: 'bus', id: bus.id })}
              onKeyDown={onKey({ type: 'bus', id: bus.id })}
            >
              <rect x={bus.x} y={bus.y} width={bus.w} height={bus.h} rx="8" />
              <text
                x={bus.x + bus.w / 2}
                y={bus.y + bus.h / 2}
                text-anchor="middle"
                dominant-baseline="central"
                transform={bus.vertical ? `rotate(-90 ${bus.x + bus.w / 2} ${bus.y + bus.h / 2})` : undefined}
              >
                {bus.label}
              </text>
            </g>
          )}

          {edges.map((edge) => {
            const on = active(edge);
            const d = edge.points.map(([x, y], i) => `${i ? 'L' : 'M'}${x},${y}`).join(' ');
            const marker = `url(#ros-arrow-${on ? 'on' : 'idle'})`;
            const title = edge.topics.map((t) => `${t.name} (${t.type})`).join('\n') || KIND_LABEL[edge.kind];
            return (
              <g
                class={`edge ${edge.kind}${on ? ' is-active' : ''}`}
                tabIndex={0}
                role="button"
                aria-pressed={on}
                aria-label={`${nameOf(edge.from)}에서 ${nameOf(edge.to)}로: ${title}`}
                onClick={() => select({ type: 'edge', id: edge.id })}
                onKeyDown={onKey({ type: 'edge', id: edge.id })}
              >
                <title>{title}</title>
                <path class="hit" d={d} />
                <path class="stroke" d={d} marker-end={marker} marker-start={edge.both ? marker : undefined} />
              </g>
            );
          })}

          {nodes.map((n) => {
            const on = nodeActive(n.id);
            const textX = n.x + 14;
            let lineY = n.y + 26;
            return (
              <g
                class={`node ${n.kind}${on ? ' is-active' : ''}`}
                style={{ '--node-color': `var(--cat-${n.color})` }}
                tabIndex={0}
                role="button"
                aria-pressed={sel?.type === 'node' && sel.id === n.id}
                aria-label={`${n.label}: ${n.role}`}
                onClick={() => select({ type: 'node', id: n.id })}
                onKeyDown={onKey({ type: 'node', id: n.id })}
              >
                <rect class="box" x={n.x} y={n.y} width={n.w} height={NODE_H} rx="6" />
                <rect class="stripe" x={n.x} y={n.y} width="5" height={NODE_H} rx="2" />
                <text class="label" x={textX} y={lineY}>
                  {n.label}
                </text>
                {n.sublabel && (
                  <text class="sublabel" x={textX} y={(lineY += 17)}>
                    {n.sublabel}
                  </text>
                )}
                {n.lines.map((line) => (
                  <text class="role" x={textX} y={(lineY += 17)}>
                    {line}
                  </text>
                ))}
              </g>
            );
          })}
        </svg>
      </div>

      <div class="ros-graph-detail" aria-live="polite">
        {!sel && <p class="hint">노드나 화살표를 누르면 세부 내용이 여기에 나타납니다.</p>}
        {sel?.type === 'node' && <NodeDetail node={nodes.find((n) => n.id === sel.id)!} edges={edges} nameOf={nameOf} touches={touches} />}
        {sel?.type === 'edge' && <EdgeDetail edge={edges.find((e) => e.id === sel.id)!} nameOf={nameOf} />}
        {sel?.type === 'bus' && bus && (
          <>
            <h4>{bus.label}</h4>
            <p>여러 노드가 함께 주고받는 공통 토픽이다.</p>
            <TopicTable rows={toRows(edges.filter((e) => e.from === bus.id || e.to === bus.id), nameOf)} />
          </>
        )}
      </div>

      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

function toRows(edges: GraphEdge[], nameOf: (id: string) => string): Row[] {
  return edges.flatMap((e) => e.topics.map((t) => ({ ...t, kind: e.kind, from: nameOf(e.from), to: nameOf(e.to) })));
}

function NodeDetail({
  node,
  edges,
  nameOf,
  touches,
}: {
  node: GraphNode;
  edges: GraphEdge[];
  nameOf: (id: string) => string;
  touches: (edge: GraphEdge, id: string) => boolean;
}) {
  const own = edges.filter((e) => touches(e, node.id));
  const ends = [node.id, node.group];
  const extra = (dir: 'in' | 'out'): Row[] =>
    (node.extra ?? [])
      .filter((t) => t.dir === dir)
      .map((t) => ({ ...t, kind: t.kind ?? 'topic', from: dir === 'in' ? t.peer : node.label, to: dir === 'out' ? t.peer : node.label }));
  const incoming = [...toRows(own.filter((e) => e.kind !== 'hardware' && ends.includes(e.to)), nameOf), ...extra('in')];
  const outgoing = [...toRows(own.filter((e) => e.kind !== 'hardware' && ends.includes(e.from)), nameOf), ...extra('out')];
  const hardware = own.filter((e) => e.kind === 'hardware');

  return (
    <>
      <h4>
        {node.label}
        {node.sublabel && <span class="sub"> {node.sublabel}</span>}
      </h4>
      <p>{node.role}</p>
      <dl>
        {node.owner && (
          <>
            <dt>담당</dt>
            <dd>{node.owner}</dd>
          </>
        )}
        <dt>구분</dt>
        <dd>{node.origin ?? NODE_KIND_LABEL[node.kind as 'hardware' | 'external']}</dd>
        {node.note && (
          <>
            <dt>비고</dt>
            <dd>{node.note}</dd>
          </>
        )}
      </dl>
      {incoming.length > 0 && (
        <>
          <h5>받는 것</h5>
          <TopicTable rows={incoming} peer="from" />
        </>
      )}
      {outgoing.length > 0 && (
        <>
          <h5>보내는 것</h5>
          <TopicTable rows={outgoing} peer="to" />
        </>
      )}
      {hardware.length > 0 && (
        <>
          <h5>하드웨어 연결</h5>
          <ul>
            {hardware.map((e) => (
              <li>{nameOf(e.from === node.id ? e.to : e.from)}</li>
            ))}
          </ul>
        </>
      )}
      {node.kind === 'node' && incoming.length + outgoing.length === 0 && <p class="hint">아직 정한 토픽이 없다.</p>}
    </>
  );
}

function EdgeDetail({ edge, nameOf }: { edge: GraphEdge; nameOf: (id: string) => string }) {
  return (
    <>
      <h4>{KIND_LABEL[edge.kind]}</h4>
      <p>
        {nameOf(edge.from)} {edge.both ? '↔' : '→'} {nameOf(edge.to)}
      </p>
      {edge.topics.length > 0 && <TopicTable rows={toRows([edge], nameOf)} />}
      {edge.note && <p>{edge.note}</p>}
    </>
  );
}

function TopicTable({ rows, peer }: { rows: Row[]; peer?: 'from' | 'to' }) {
  return (
    <table>
      <thead>
        <tr>
          <th>이름</th>
          <th>방식</th>
          <th>메시지 형식</th>
          <th>{peer === 'from' ? '보내는 쪽' : peer === 'to' ? '받는 쪽' : '보내는 쪽 → 받는 쪽'}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr>
            <td>
              <code>{r.name}</code>
              {r.note && <span class="note">{r.note}</span>}
            </td>
            <td>{KIND_LABEL[r.kind]}</td>
            <td>
              <code>{r.type}</code>
            </td>
            <td>{peer ? r[peer] : `${r.from} → ${r.to}`}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
