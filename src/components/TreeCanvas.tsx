import { motion, useReducedMotion } from 'motion/react';
import { treeLayout } from '../lib/algorithms';
import type { TreeNode } from '../lib/algorithms';
export default function TreeCanvas({ root, active, visited = [], selected, onSelect, zoom = 1, mini = false, id = 'tree' }: { root: TreeNode | null; active?: number; visited?: number[]; selected?: number; onSelect?: (key: number) => void; zoom?: number; mini?: boolean; id?: string }) {
  const layout = treeLayout(root), { width, height } = layout;
  const reducedMotion = useReducedMotion();
  const previous = visited.length > 1 ? visited[visited.length - 2] : undefined;
  const parents = new Map(layout.edges.map(e => [e.to, e.from]));
  function ancestors(key: number) { const result = [key]; while (parents.has(key)) { key = parents.get(key)!; result.push(key); } return result; }
  let travelPath = '';
  if (previous !== undefined && active !== undefined && previous !== active && layout.nodes.some(n => n.key === previous) && layout.nodes.some(n => n.key === active)) {
    const before = ancestors(previous), after = ancestors(active), common = before.find(k => after.includes(k))!;
    const route = [...before.slice(0, before.indexOf(common) + 1), ...after.slice(0, after.indexOf(common)).reverse()];
    const points = route.map(key => layout.nodes.find(n => n.key === key)!);
    travelPath = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) { const a = points[i - 1], b = points[i], sign = b.y > a.y ? 1 : -1; travelPath += ` C ${a.x} ${a.y + 55 * sign}, ${b.x} ${b.y - 55 * sign}, ${b.x} ${b.y}`; }
  }
  return <svg className={'tree-svg ' + (mini ? 'mini' : '')} viewBox={`${width * (1 - 1 / zoom) / 2} ${height * (1 - 1 / zoom) / 2} ${width / zoom} ${height / zoom}`} role="group" aria-label="Árbol binario interactivo">
    <defs><filter id={'shadow-' + id} x="-70%" y="-70%" width="240%" height="240%"><feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#29743a" floodOpacity="0.09"/></filter></defs>
    {layout.edges.map(e => { const touched = visited.includes(e.from) && visited.includes(e.to); return <motion.path key={`${e.from}-${e.to}`} initial={false} animate={{ d: `M ${e.x1} ${e.y1 + 17} C ${e.x1} ${e.y1 + 66}, ${e.x2} ${e.y2 - 55}, ${e.x2} ${e.y2 - 23}`, stroke: touched ? '#8eda9f' : '#c6d7ca' }} transition={{ duration: .4 }} strokeWidth={touched ? 2.6 : 1.7} fill="none"/>; })}
    {travelPath && !reducedMotion && <g key={`${previous}-${active}`} aria-hidden="true"><motion.path d={travelPath} fill="none" stroke="#9edeac" strokeWidth="3" initial={{pathLength:0,opacity:1}} animate={{pathLength:1,opacity:.28}} transition={{duration:.7}}/><circle r="5.5" fill="#d5a341" stroke="#fff" strokeWidth="2"><animateMotion dur="0.7s" path={travelPath} fill="freeze"/></circle></g>}
    {layout.nodes.map(node => { const isActive = node.key === active, isVisited = visited.includes(node.key), isSelected = selected === node.key, isRoot = root?.key === node.key;
      return <motion.g key={node.key} initial={{ opacity: 0 }} animate={{ opacity: 1, x: node.x, y: node.y }} transition={{ type: 'spring', stiffness: 170, damping: 24 }} role={onSelect ? 'button' : 'img'} tabIndex={onSelect ? 0 : undefined} aria-label={`${node.name}, clave ${node.key}${isRoot ? ', raíz' : ''}${isActive ? ', actual' : isVisited ? ', visitado' : ''}`} onClick={() => onSelect?.(node.key)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect?.(node.key); } }} className="tree-node" style={{ cursor: onSelect ? 'pointer' : 'default' }}>
        {isActive && <motion.circle r="36" fill="#eef7f0" initial={{ scale: .7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: .3 }}/>}
        {isSelected && !isActive && <circle r="33" fill="none" stroke="#146b3a" strokeWidth="1.5" strokeDasharray="4 3"/>}
        <motion.circle r="26" filter={`url(#shadow-${id})`} initial={false} animate={{ fill: isActive ? '#146b3a' : isVisited ? '#edf7ef' : '#ffffff', stroke: isActive ? '#146b3a' : isVisited || isRoot ? '#91daa1' : '#cbddcf' }} strokeWidth={isRoot || isActive ? 2 : 1.5}/>
        <text y="1" dominantBaseline="middle" textAnchor="middle" className="node-value" fill={isActive ? '#ffffff' : isVisited ? '#43ba5d' : '#334537'}>{node.key}</text>
        {isVisited && !isActive && <g transform="translate(21,-20)"><circle r="8" fill="#146b3a"/><path d="m-3 0 2 2 4-4" fill="none" stroke="white" strokeWidth="1.5"/></g>}
        {!mini && <text y="46" textAnchor="middle" className="node-label">{node.name}</text>}
        {isRoot && !mini && <text y="-43" textAnchor="middle" className="root-label">Raíz</text>}
      </motion.g>;
    })}
  </svg>;
}
