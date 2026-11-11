import { useMemo, useState } from 'react';
import { ArrowLeft, GitFork, Minus, Plus } from 'lucide-react';
import type { WikiNote } from '../utils/wikiGraph';

export interface WikiEdge { source: string; target: string }

interface Props {
  notes: WikiNote[];
  edges: WikiEdge[];
  currentId: string;
  loading: boolean;
  onOpen: (note: WikiNote) => void;
  onClose: () => void;
}

const width = 920;
const height = 570;

function layoutGraph(notes: WikiNote[], edges: WikiEdge[], currentId: string) {
  const points = notes.map((note, index) => {
    const angle = index * Math.PI * (3 - Math.sqrt(5));
    const radius = Math.sqrt(index / Math.max(1, notes.length - 1));
    return { id: note.id, x: width / 2 + Math.cos(angle) * radius * 375,
      y: height / 2 + Math.sin(angle) * radius * 220, dx: 0, dy: 0 };
  });
  const byId = new Map(points.map(point => [point.id, point]));
  const links = edges.flatMap(edge => {
    const source = byId.get(edge.source);
    const target = byId.get(edge.target);
    return source && target ? [[source, target]] : [];
  });

  for (let iteration = 0; iteration < 36; iteration++) {
    for (const point of points) {
      point.dx = (width / 2 - point.x) * .006;
      point.dy = (height / 2 - point.y) * .006;
    }
    for (let left = 0; left < points.length; left++) {
      const first = points[left];
      for (let right = left + 1; right < points.length; right++) {
        const second = points[right];
        const x = first.x - second.x;
        const y = first.y - second.y;
        const force = 125 / Math.max(120, x * x + y * y);
        first.dx += x * force;
        first.dy += y * force;
        second.dx -= x * force;
        second.dy -= y * force;
      }
    }
    for (const [source, target] of links) {
      const x = target.x - source.x;
      const y = target.y - source.y;
      const length = Math.max(1, Math.hypot(x, y));
      const spring = (length - 118) * .035 / length;
      source.dx += x * spring;
      source.dy += y * spring;
      target.dx -= x * spring;
      target.dy -= y * spring;
    }
    for (const point of points) {
      if (point.id === currentId) continue;
      point.x = Math.max(48, Math.min(width - 48, point.x + point.dx));
      point.y = Math.max(32, Math.min(height - 42, point.y + point.dy));
    }
  }
  return byId;
}

export function KnowledgeGraph({ notes, edges, currentId, loading, onOpen, onClose }: Props) {
  const [local, setLocal] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [query, setQuery] = useState('');
  const eligible = useMemo(() => {
    const neighbors = new Set([currentId]);
    if (local) {
      for (const edge of edges) {
        if (edge.source === currentId) neighbors.add(edge.target);
        if (edge.target === currentId) neighbors.add(edge.source);
      }
    }
    const search = query.trim().toLowerCase();
    return notes.filter(note => (!local || neighbors.has(note.id)) && note.path.toLowerCase().includes(search));
  }, [notes, edges, currentId, local, query]);
  const visible = useMemo(() => eligible.slice(0, 120), [eligible]);
  const positions = useMemo(() => layoutGraph(visible, edges, currentId), [visible, edges, currentId]);
  return <section className="knowledge-graph" aria-label="知识星图">
    <header className="graph-header">
      <button type="button" title="返回文档" aria-label="返回文档" onClick={onClose}><ArrowLeft size={16} /></button>
      <h2><GitFork size={17} />知识星图</h2>
      <button type="button" aria-pressed={!local} onClick={() => setLocal(false)}>全局</button>
      <button type="button" aria-pressed={local} onClick={() => setLocal(true)}>当前文档</button>
      <input aria-label="筛选星图文档" placeholder="筛选文档…" value={query} onChange={event => setQuery(event.target.value)} />
    </header>
    <div className="graph-stage">
      <svg viewBox={`0 0 ${width} ${height}`} role="group" aria-label="文档节点与双链连线">
        <g transform={`translate(${width / 2} ${height / 2}) scale(${zoom}) translate(${-width / 2} ${-height / 2})`}>
          {edges.map(edge => {
            const start = positions.get(edge.source);
            const end = positions.get(edge.target);
            if (!start || !end) return null;
            return <line key={JSON.stringify([edge.source, edge.target])} x1={start.x} y1={start.y} x2={end.x} y2={end.y}
              className={edge.source === currentId || edge.target === currentId ? 'graph-connected' : undefined} />;
          })}
          {visible.map(note => {
            const point = positions.get(note.id)!;
            const title = note.title.replace(/\.(md|markdown|txt)$/i, '');
            return <g key={note.id} transform={`translate(${point.x} ${point.y})`} className="graph-node"
              data-current={note.id === currentId} role="button" tabIndex={0} aria-label={note.path}
              onClick={() => onOpen(note)} onKeyDown={event => {
                if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onOpen(note); }
              }}>
              <title>{note.path}</title>
              <circle r="13" className="graph-hit" />
              <circle r={note.id === currentId ? 8 : 5} />
              {(visible.length <= 30 || note.id === currentId) && <text y="22" textAnchor="middle">{title.length > 22 ? title.slice(0, 21) + '…' : title}</text>}
            </g>;
          })}
        </g>
      </svg>
      {visible.length === 0 && <p className="graph-empty">没有匹配的文档</p>}
    </div>
    <footer className="graph-footer">
      <span role="status">{loading ? '正在读取本地文档…' : `${visible.length} / ${eligible.length} 篇文档 · ${edges.filter(edge => positions.has(edge.source) && positions.has(edge.target)).length} 条链接`}</span>
      <button type="button" aria-label="缩小星图" disabled={zoom <= .75} onClick={() => setZoom(value => Math.max(.75, value - .25))}><Minus size={15} /></button>
      <button type="button" title="重置缩放" onClick={() => setZoom(1)}>{Math.round(zoom * 100)}%</button>
      <button type="button" aria-label="放大星图" disabled={zoom >= 2} onClick={() => setZoom(value => Math.min(2, value + .25))}><Plus size={15} /></button>
    </footer>
  </section>;
}
