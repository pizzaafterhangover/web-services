import { useState } from 'preact/hooks';

// ROS 2 노드·토픽 구조도. 좌표는 글에서 직접 지정한다(노드 수가 적고 배치가 의미를 가지므로 자동 배치하지 않는다).

export interface GraphNode {
  id: string;
  label: string;
  sublabel?: string;
  /** 구조도에 보이는 역할. 줄바꿈 위치를 직접 정한다. */
  lines: string[];
  /** 세부 패널에 보이는 전체 역할 */
  role: string;
  kind: 'node' | 'hardware';
  owner?: string;
  origin?: string;
  note?: string;
  /** tokens.css의 --cat-* 이름 */
  color: string;
  /** 이 노드가 속한 그룹 id. 그룹에서 나가는 토픽은 그룹 안 노드가 보내는 것으로 본다. */
  group?: string;
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

export interface GraphBus {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Topic {
  name: string;
  type: string;
  note?: string;
}

export interface GraphEdge {
  id: string;
  from: string;
  to: string;
  kind: 'topic' | 'action' | 'hardware';
  topics: Topic[];
  /** 화살표 경로 꼭짓점. 마지막 점이 화살촉 위치다. */
  points: [number, number][];
  both?: boolean;
  note?: string;
}

interface Props {
  nodes: GraphNode[];
  edges: GraphEdge[];
  groups?: GraphGroup[];
  bus?: GraphBus;
  width: number;
  height: number;
  caption?: string;
}

type Selection = { type: 'node' | 'edge' | 'bus'; id: string } | null;

const NODE_H = 70;
const KIND_LABEL = { topic: '토픽', action: '액션', hardware: '하드웨어 연결' };

export default function RosGraph({ nodes, edges, groups = [], bus, width, height, caption }: Props) {
  const [sel, setSel] = useState<Selection>(null);

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
    const edge = edges.find((e) => e.id === sel.id)!;
    return touches(edge, id);
  };

  const select = (next: Selection) => setSel(sel && next && sel.type === next.type && sel.id === next.id ? null : next);
  const onKey = (next: Selection) => (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      select(next);
    }
  };

  return (
    <figure class="widget ros-graph">
      <ul class="ros-graph-legend" aria-label="범례">
        {[...new Map(nodes.map((n) => [n.owner ?? '하드웨어', n.color])).entries()].map(([owner, color]) => (
          <li>
            <span class="swatch" style={{ background: `var(--cat-${color})` }} aria-hidden="true" />
            {owner}
          </li>
        ))}
        <li>
          <span class="line" aria-hidden="true" />
          토픽
        </li>
        <li>
          <span class="line action" aria-hidden="true" />
          액션
        </li>
        <li>
          <span class="line hardware" aria-hidden="true" />
          하드웨어 연결
        </li>
      </ul>

      <div class="ros-graph-scroll">
        <svg viewBox={`0 0 ${width} ${height}`} role="group" aria-label="ROS 2 노드·토픽 구조도" class={sel ? 'has-selection' : ''}>
          <defs>
            {['idle', 'on'].map((state) => (
              <marker id={`ros-arrow-${state}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M0,0 L10,5 L0,10 z" class={`arrow-head ${state}`} />
              </marker>
            ))}
          </defs>

          {groups.map((g) => (
            <g class="group">
              <rect x={g.x} y={g.y} width={g.w} height={g.h} rx="8" />
              <text x={g.x + 10} y={g.y + 17}>
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
              <text x={bus.x + bus.w / 2} y={bus.y + bus.h / 2 + 5} text-anchor="middle">
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
            <TopicTable rows={edges.filter((e) => e.from === bus.id || e.to === bus.id)} nameOf={nameOf} />
          </>
        )}
      </div>

      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
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
  const incoming = own.filter((e) => e.kind !== 'hardware' && ends.includes(e.to));
  const outgoing = own.filter((e) => e.kind !== 'hardware' && ends.includes(e.from));
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
        <dd>{node.origin ?? '하드웨어'}</dd>
        {node.note && (
          <>
            <dt>비고</dt>
            <dd>{node.note}</dd>
          </>
        )}
      </dl>
      {incoming.length > 0 && (
        <>
          <h5>받는 토픽</h5>
          <TopicTable rows={incoming} nameOf={nameOf} peer="from" />
        </>
      )}
      {outgoing.length > 0 && (
        <>
          <h5>보내는 토픽</h5>
          <TopicTable rows={outgoing} nameOf={nameOf} peer="to" />
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
      {edge.topics.length > 0 && <TopicTable rows={[edge]} nameOf={nameOf} />}
      {edge.note && <p>{edge.note}</p>}
    </>
  );
}

function TopicTable({ rows, nameOf, peer }: { rows: GraphEdge[]; nameOf: (id: string) => string; peer?: 'from' | 'to' }) {
  return (
    <table>
        <thead>
          <tr>
            <th>{rows.some((r) => r.kind === 'action') ? '토픽 / 액션' : '토픽'}</th>
            <th>메시지 형식</th>
            <th>{peer === 'from' ? '보내는 쪽' : peer === 'to' ? '받는 쪽' : '보내는 쪽 → 받는 쪽'}</th>
          </tr>
        </thead>
        <tbody>
          {rows.flatMap((edge) =>
            edge.topics.map((t) => (
              <tr>
                <td>
                  <code>{t.name}</code>
                  {t.note && <span class="note">{t.note}</span>}
                </td>
                <td>
                  <code>{t.type}</code>
                </td>
                <td>{peer ? nameOf(edge[peer]) : `${nameOf(edge.from)} → ${nameOf(edge.to)}`}</td>
              </tr>
            )),
          )}
        </tbody>
    </table>
  );
}
