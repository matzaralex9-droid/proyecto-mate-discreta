import { useRef, useState } from 'react';
import { motion } from 'motion/react';
import type { DijkstraStep, Graph, GraphNode } from '../lib/algorithms';
import { formatDistance } from '../lib/algorithms';
export type GraphTool = 'move' | 'add' | 'connect';
export type GraphSelection = { type: 'node' | 'edge'; id: string } | null;
export default function GraphCanvas({ graph, step, tool, selected, connectionStart, onNodeClick, onEdgeClick, onMove, onAdd }: { graph: Graph; step?: DijkstraStep; tool: GraphTool; selected: GraphSelection; connectionStart: string | null; onNodeClick: (id: string) => void; onEdgeClick: (id: string) => void; onMove: (id: string, x: number, y: number) => void; onAdd: (x: number, y: number) => void }) {
  const svgRef = useRef<SVGSVGElement>(null), drag = useRef<{id:string; startX:number;startY:number;moved:boolean} | null>(null);
  const [dragPosition, setDragPosition] = useState<{ id: string; x: number; y: number } | null>(null);
  const nodes = graph.nodes.map(n => dragPosition?.id === n.id ? { ...n, ...dragPosition } : n);
  function coordinates(e: React.PointerEvent | React.MouseEvent) { const point = svgRef.current!.createSVGPoint(); point.x = e.clientX; point.y = e.clientY; return point.matrixTransform(svgRef.current!.getScreenCTM()!.inverse()); }
  function pointerDown(e: React.PointerEvent<SVGGElement>, node: GraphNode) { if (tool !== 'move') return; e.stopPropagation(); const p = coordinates(e); drag.current = { id: node.id, startX: p.x - node.x, startY: p.y - node.y, moved: false }; e.currentTarget.setPointerCapture(e.pointerId); }
  function pointerMove(e: React.PointerEvent) { if (!drag.current) return; const p = coordinates(e), x = Math.max(45, Math.min(755, p.x - drag.current.startX)), y = Math.max(55, Math.min(420, p.y - drag.current.startY)); const original = graph.nodes.find(n => n.id === drag.current!.id)!; if (Math.abs(x - original.x) + Math.abs(y - original.y) > 3) drag.current.moved = true; if (drag.current.moved) setDragPosition({ id: drag.current.id, x, y }); }
  function pointerUp(e: React.PointerEvent<SVGGElement>, id: string) { if (!drag.current) return; const moved = drag.current.moved; if (moved && dragPosition) onMove(id, dragPosition.x, dragPosition.y); drag.current = null; setDragPosition(null); e.currentTarget.releasePointerCapture(e.pointerId); if (!moved) onNodeClick(id); }
  return <svg ref={svgRef} viewBox="0 0 800 480" className={'graph-svg tool-' + tool} role="group" aria-label="Grafo editable. Selecciona nodos con Enter y muévelos con las flechas." onClick={e => { if (tool === 'add' && (e.target as Element).tagName === 'svg') { const p = coordinates(e); onAdd(p.x, p.y); } }}>
    <defs>{['default','active','route'].map(type => <marker key={type} id={'arrow-' + type} markerWidth="7" markerHeight="7" refX="5.5" refY="3.5" orient="auto"><path d="M0 0 L7 3.5 L0 7" fill={type === 'route' ? '#168477' : type === 'active' ? '#146b3a' : '#a1b8a6'}/></marker>)}</defs>
    {graph.edges.map(edge => {
      const a = nodes.find(n => n.id === edge.from)!, b = nodes.find(n => n.id === edge.to)!;
      const dx = b.x - a.x, dy = b.y - a.y, distance = Math.sqrt(dx * dx + dy * dy) || 1, ux = dx / distance, uy = dy / distance;
      const hasReverse = graph.directed && graph.edges.some(e => e.from === edge.to && e.to === edge.from);
      const offset = hasReverse ? 38 : 0, cx = (a.x + b.x) / 2 - uy * offset, cy = (a.y + b.y) / 2 + ux * offset;
      const x1 = a.x + ux * 29, y1 = a.y + uy * 29, x2 = b.x - ux * (graph.directed ? 37 : 29), y2 = b.y - uy * (graph.directed ? 37 : 29);
      const d = `M${x1},${y1} Q${cx},${cy} ${x2},${y2}`, lx = (x1 + 2 * cx + x2) / 4, ly = (y1 + 2 * cy + y2) / 4;
      const isRoute = step?.pathEdges.includes(edge.id), isActive = step?.edge === edge.id, isSelected = selected?.type === 'edge' && selected.id === edge.id;
      const color = isRoute ? '#168477' : isActive || isSelected ? '#146b3a' : '#bdcfc1';
      return <g key={edge.id} className="graph-edge" role="button" tabIndex={0} aria-label={`Conexión ${a.label} a ${b.label}, peso ${edge.weight}. Editar`} onClick={e => {e.stopPropagation();onEdgeClick(edge.id);}} onKeyDown={e => {if(e.key==='Enter'||e.key===' '){e.preventDefault();onEdgeClick(edge.id);}}}>
        <path d={d} stroke="transparent" strokeWidth="22" fill="none"/>
        <motion.path d={d} animate={{stroke:color,strokeWidth:isRoute || isActive ? 3.5 : 2}} fill="none" markerEnd={graph.directed ? `url(#arrow-${isRoute?'route':isActive||isSelected?'active':'default'})` : undefined}/>
        {isActive && <motion.path key={edge.id + '-active'} d={d} stroke="#a4e1b2" strokeWidth="5" strokeLinecap="round" fill="none" initial={{pathLength:0}} animate={{pathLength:1}} transition={{duration:.5}}/>}
        <rect x={lx-17} y={ly-13} width="34" height="26" rx="8" fill={isRoute?'#e0f2ee':isActive||isSelected?'#ecf6ee':'#fafcfa'} stroke={isActive||isSelected?'#a5e1b2':'#dfebe2'}/>
        <text x={lx} y={ly+1} dominantBaseline="middle" textAnchor="middle" className="edge-label" fill={isRoute?'#146c61':isActive?'#146b3a':'#607464'}>{formatDistance(edge.weight)}</text>
      </g>;
    })}
    {nodes.map((node,i) => {
      const active = step?.current === node.id, settled = step?.settled.includes(node.id), route = step?.path.includes(node.id), picked = selected?.type === 'node' && selected.id === node.id || connectionStart === node.id;
      const fill = active ? '#146b3a' : route ? '#168477' : '#ffffff';
      return <g key={node.id} transform={`translate(${node.x},${node.y})`} className="graph-node" role="button" tabIndex={0} aria-label={`${node.label}${settled?', distancia confirmada':''}. Seleccionar o mover con las flechas.`} onPointerDown={e => pointerDown(e,node)} onPointerMove={pointerMove} onPointerUp={e => pointerUp(e,node.id)} onPointerCancel={() => {drag.current=null;setDragPosition(null);}} onClick={e => {e.stopPropagation();if(tool!=='move')onNodeClick(node.id);}} onKeyDown={e => {if(e.key==='Enter'||e.key===' '){e.preventDefault();onNodeClick(node.id);}if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();onMove(node.id,Math.max(45,Math.min(755,node.x+(e.key==='ArrowLeft'?-10:e.key==='ArrowRight'?10:0))),Math.max(55,Math.min(420,node.y+(e.key==='ArrowUp'?-10:e.key==='ArrowDown'?10:0))));}}}>
        {(active || route || picked) && <motion.circle r="37" fill={route?'#dcefe9':'#eaf5ec'} initial={{opacity:0,scale:.8}} animate={{opacity:1,scale:1}}/>}
        <motion.circle r="27" animate={{fill,stroke:active?'#146b3a':route||settled?'#168477':picked?'#146b3a':'#bed7c4'}} strokeWidth={settled||picked||active?2.5:1.7}/>
        <text y="1" dominantBaseline="middle" textAnchor="middle" className="node-value" fill={active||route?'#ffffff':'#435f49'}>{String.fromCharCode(65+i)}</text>
        <rect x={-Math.min(80,node.label.length*3.4+8)} y="38" width={Math.min(160,node.label.length*6.8+16)} height="23" rx="6" fill="#fafcfa"/>
        <text y="53" textAnchor="middle" className="node-label">{node.label}</text>
        {step && <g transform="translate(0,-45)"><rect x="-22" y="-11" width="44" height="23" rx="8" fill={settled?'#e0f2ee':'#ebf6ed'}/><text y="1" dominantBaseline="middle" textAnchor="middle" className="distance-label" fill={settled?'#146c61':'#668c6e'}>{formatDistance(step.distances[node.id])}{settled?' ✓':''}</text></g>}
      </g>;
    })}
  </svg>;
}
