import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Plus, Search, Trash2, ArrowRight, Play, GitBranch, Rows3, Check, Maximize2, Minus, MousePointer2, Pencil } from 'lucide-react';
import { buildTree, exampleRecords, height, insert, leafCount, orderInfo, orders, remove, searchPath, traverse } from '../lib/algorithms';
import type { Order, TreeKind, TreeNode } from '../lib/algorithms';
import TreeCanvas from './TreeCanvas';
import { EmptyState, IconButton, Modal, Playback, usePlayback } from './shared';
type Run = { type: 'traversal' | 'insert' | 'search' | 'delete'; sequence: TreeNode[]; messages: string[]; heading: string };
type Pending = { root: TreeNode | null; message: string };
export default function TreeLab({ root, kind, onChange, onKindChange, notify }: { root: TreeNode | null; kind: TreeKind; onChange: (tree: TreeNode | null) => void; onKindChange: (kind: TreeKind) => void; notify: (message: string) => void }) {
  const [order, setOrder] = useState<Order | 'all'>('inorder'), [operation, setOperation] = useState<'insert' | 'search' | 'delete'>('insert');
  const [keyInput, setKeyInput] = useState(''), [name, setName] = useState(''), [error, setError] = useState('');
  const [run, setRun] = useState<Run | null>(null), [pending, setPending] = useState<Pending | null>(null), [selected, setSelected] = useState<number>();
  const [zoom, setZoom] = useState(1), [showRecords, setShowRecords] = useState(false), [editing, setEditing] = useState(false);
  const records = traverse(root, 'inorder'), total = run?.sequence.length || 0, player = usePlayback(total);
  const current = run?.sequence[player.position - 1], visited = run?.sequence.slice(0, player.position).map(n => n.key) || [];
  const currentOrder = order === 'all' ? 'inorder' : order, info = orderInfo[currentOrder];
  useEffect(() => { if (pending && run && player.position === run.sequence.length) { onChange(pending.root); notify(pending.message); setPending(null); } }, [player.position, pending, run, onChange, notify]);
  function clearRun() { player.reset(); setRun(null); setPending(null); }
  function startTraversal() {
    if (!root || pending) return;
    const sequence = traverse(root, currentOrder);
    setRun({ type: 'traversal', sequence, heading: order === 'all' ? 'Tres formas de recorrer el mismo árbol' : `Recorrido en ${info.label.toLowerCase()}`, messages: sequence.map((n, i) => order === 'all' ? `Paso ${i + 1}: cada recorrido visita su siguiente nodo. ${i === sequence.length - 1 ? 'Compara las tres secuencias completas: los mismos datos, en distinto orden.' : 'Observa cómo cada regla cambia el orden de visita.'}` : `Paso ${i + 1}: visitamos ${n.key} (${n.name}). ${i === sequence.length - 1 ? 'Todos los registros han sido visitados una vez.' : info.short}`) });
    player.start();
  }
  function handleOperation(e: React.FormEvent) {
    e.preventDefault(); setError('');
    if (!/^\d{1,3}$/.test(keyInput.trim())) { setError('Ingresa una clave entera entre 0 y 999.'); return; }
    const key = Number(keyInput), path = searchPath(root, key), exists = path.at(-1)?.key === key;
    if (operation === 'insert' && exists) { setError(`La clave ${key} ya existe. Selecciónala para editar su nombre.`); return; }
    if (operation === 'insert' && records.length >= 31) { setError('Llegaste al límite de 31 registros. Elimina uno para continuar.'); return; }
    if (operation === 'insert' && !name.trim()) { setError('Añade un nombre para identificar este registro.'); return; }
    if (operation !== 'insert' && !root) { setError('Inserta tu primer registro para empezar.'); return; }
    const messages = path.map(n => n.key === key ? `Encontramos ${key}: ${n.name}.` : `${key} ${key < n.key ? 'es menor' : 'es mayor'} que ${n.key}. Seguimos por la ${key < n.key ? 'izquierda' : 'derecha'}.`);
    let sequence = [...path], heading = operation === 'insert' ? `Insertando el registro ${key}` : operation === 'delete' ? `Eliminando el registro ${key}` : `Buscando el registro ${key}`;
    if (operation === 'insert') {
      const record = { key, name: name.trim() };
      sequence = [...path, { ...record, left: null, right: null }];
      messages.push(`Insertamos ${key} en su lugar.${kind === 'avl' ? ' Rebalanceamos el árbol con rotaciones si es necesario.' : ' Se conserva la regla: menores a la izquierda, mayores a la derecha.'}`);
      setPending({ root: insert(root, record, kind), message: `Registro ${key} insertado` });
    } else if (operation === 'delete' && exists) {
      sequence = [...path, path.at(-1)!]; messages.push(`Eliminamos ${key}.${path.at(-1)!.left && path.at(-1)!.right ? ' Su sucesor (el menor del subárbol derecho) ocupa su lugar.' : ' Reconectamos sus hijos, si los tiene.'}${kind === 'avl' ? ' El árbol mantiene su balance AVL.' : ''}`);
      setPending({ root: remove(root, key, kind), message: `Registro ${key} eliminado` });
    } else {
      setPending(null);
      if (!exists) { sequence = [...path, path.at(-1)!]; messages.push(`La clave ${key} no está en el árbol. Llegamos a una rama vacía.`); heading = `Buscando el registro ${key}`; }
    }
    setRun({ type: operation, sequence, messages, heading }); player.start();
  }
  function selectNode(key: number) { setSelected(key); setKeyInput(String(key)); setName(records.find(n => n.key === key)?.name || ''); setError(''); }
  function rename() {
    if (!name.trim() || selected === undefined) return;
    const update = (n: TreeNode | null): TreeNode | null => n ? { ...n, name: n.key === selected ? name.trim() : n.name, left: update(n.left), right: update(n.right) } : null;
    onChange(update(root)); setEditing(false); notify('Nombre del registro actualizado');
  }
  const comparing = order === 'all' && (!run || run.type === 'traversal');
  return <>
    <div className="workspace-grid">
      <div className="canvas-column">
        <section className="canvas-card" aria-label="Visualización del árbol">
          <div className="canvas-topbar"><div className="canvas-title"><span className="tiny-dot"/><strong>{kind === 'avl' ? 'Árbol AVL' : 'Árbol binario de búsqueda'}</strong><span className="subtle-badge">{records.length} nodos</span></div><div className="canvas-tools"><IconButton label="Ver registros" onClick={() => setShowRecords(true)}><Rows3 size={17}/></IconButton><span className="toolbar-divider"/><IconButton label="Alejar árbol" onClick={() => setZoom(z => Math.max(.6, z - .15))} disabled={zoom <= .6 || comparing}><Minus size={16}/></IconButton><span className="zoom-value">{Math.round(zoom * 100)}%</span><IconButton label="Acercar árbol" onClick={() => setZoom(z => Math.min(1.6, z + .15))} disabled={zoom >= 1.6 || comparing}><Plus size={16}/></IconButton><IconButton label="Ajustar árbol al lienzo" onClick={() => setZoom(1)}><Maximize2 size={16}/></IconButton></div></div>
          <div className={'canvas-stage tree-stage ' + (comparing ? 'compare-stage' : '')}>
            {!root ? <EmptyState title="Un lienzo lleno de posibilidades" description="Inserta un registro desde el panel o empieza con nuestro árbol de ejemplo." onReset={() => { clearRun(); onChange(buildTree(exampleRecords, kind)); }}/>
              : comparing ? <div className="comparison-grid">{orders.map(o => { const sequence = traverse(root, o); return <div className="comparison-tree" key={o}><h3>{orderInfo[o].label}</h3><span>{orderInfo[o].rule.join(' → ')}</span><TreeCanvas root={root} active={sequence[player.position - 1]?.key} visited={sequence.slice(0, player.position).map(n => n.key)} mini id={o}/><div className="compare-current">{player.position ? <><span className="tiny-dot"/>Visitando {sequence[player.position - 1]?.key}</> : 'Listo para comenzar'}</div></div>; })}</div>
              : <TreeCanvas root={root} active={current?.key} visited={visited} selected={selected} onSelect={selectNode} zoom={zoom}/>}
            {root && !comparing && <div className="canvas-bottom-hint"><MousePointer2 size={13}/><span>Selecciona un nodo para ver su registro</span></div>}
            {!comparing && root && <div className="canvas-stats"><span>Altura <b>{height(root) - 1}</b></span><span>Hojas <b>{leafCount(root)}</b></span></div>}
          </div>
          <div className="legend-row"><div className="legend"><span><i className="legend-dot pending"/>Sin visitar</span><span><i className="legend-dot active"/>Nodo actual</span><span><i className="legend-dot visited"/><Check size={10}/>Visitado</span></div><span className="keyboard-hint"><kbd>espacio</kbd> para pausar</span></div>
          <Playback player={player} total={total} onStart={startTraversal} disabled={!root}/>
        </section>
        <section className="sequence-panel"><div className="section-heading"><div><h3>{run && run.type !== 'traversal' ? 'La ruta del registro' : 'El orden cuenta'}</h3><p>{comparing ? 'Mismos datos. Tres maneras de recorrerlos.' : run && run.type !== 'traversal' ? 'Sigue las comparaciones desde la raíz hasta el resultado.' : 'Cada nodo visitado deja una huella en la secuencia.'}</p></div><span className="subtle-badge">{player.position} / {total || records.length}</span></div>
          {(comparing ? orders : [currentOrder]).map(o => { const sequence = comparing ? traverse(root, o) : run?.sequence || traverse(root, o); return <div className="sequence-row" key={o}>{comparing && <span className="sequence-order">{orderInfo[o].label}</span>}<div className="sequence-chips" aria-label={`Secuencia ${orderInfo[o].label}`}>
            {sequence.length ? sequence.map((n, i) => <motion.span key={`${n.key}-${i}`} initial={false} animate={{ backgroundColor: player.position === i + 1 ? '#146b3a' : player.position > i ? '#edf7ef' : '#f7faf8', color: player.position === i + 1 ? '#ffffff' : player.position > i ? '#49b761' : '#758579', scale: player.position === i + 1 ? 1.05 : 1 }} className={'sequence-chip ' + (player.position <= i ? 'unrevealed' : '')}>{player.position > i ? n.key : <span className="placeholder-dot"/>}</motion.span>) : <span className="muted">Aquí aparecerán tus registros.</span>}
            {total > 0 && player.position === total && <span className="sequence-complete"><Check size={15}/></span>}</div></div>; })}
        </section>
      </div>
      <aside className="inspector">
        <div className="inspector-section"><div className="section-heading"><h2>Elige un recorrido</h2><GitBranch size={17} className="muted"/></div><p className="section-description">Un mismo árbol, distintas perspectivas.</p>
          <div className="segmented order-tabs" aria-label="Tipo de recorrido">{(['preorder','inorder','postorder'] as Order[]).map(o => <button key={o} className={order === o ? 'selected' : ''} disabled={!!pending} aria-pressed={order === o} onClick={() => { clearRun(); setOrder(o); }}>{orderInfo[o].label}</button>)}</div>
          <button className={'compare-toggle ' + (order === 'all' ? 'checked' : '')} disabled={!!pending} role="switch" aria-checked={order === 'all'} onClick={() => { clearRun(); setOrder(order === 'all' ? 'inorder' : 'all'); }}><span>Comparar los tres a la vez</span><span className="switch-track"><span/></span></button>
          <div className="order-explainer"><div className="order-rule">{(order === 'all' ? ['3 recorridos', 'En paralelo'] : info.rule).map((part,i) => <span key={part}>{i > 0 && <ArrowRight size={12}/>}<b className={part === 'Raíz' ? 'root-chip' : ''}>{part}</b></span>)}</div><p>{order === 'all' ? 'Observa cómo cambia la secuencia sin cambiar la estructura.' : info.short}</p></div>
          <button className="button primary full" disabled={!root || !!pending} onClick={() => run?.type === 'traversal' && (player.playing || player.position > 0 && player.position < total) ? player.toggle() : startTraversal()}><Play size={16} fill="currentColor"/>{player.playing && run?.type === 'traversal' ? 'Pausar recorrido' : run?.type === 'traversal' && player.position > 0 && player.position < total ? 'Continuar recorrido' : run?.type === 'traversal' && player.position ? 'Reiniciar recorrido' : 'Iniciar recorrido'}<span className="button-key">↵</span></button>
        </div>
        <div className="inspector-section"><div className="section-heading"><h2>Tus registros</h2><button className="text-button" onClick={() => setShowRecords(true)}>Ver todos <ArrowRight size={13}/></button></div>
          <div className="operation-tabs">{([{id:'insert',label:'Insertar',Icon:Plus},{id:'search',label:'Buscar',Icon:Search},{id:'delete',label:'Eliminar',Icon:Trash2}] as const).map(({id,label,Icon}) => <button key={id} disabled={!!pending} aria-pressed={operation === id} className={operation === id ? 'selected' : ''} onClick={() => { setOperation(id); setError(''); }}><Icon size={14}/>{label}</button>)}</div>
          <form onSubmit={handleOperation} noValidate><div className="record-fields"><label>Clave numérica<input type="text" inputMode="numeric" placeholder="Ej. 35" maxLength={3} value={keyInput} onChange={e => { setKeyInput(e.target.value); setError(''); }} aria-invalid={!!error} aria-describedby={error ? 'record-error' : undefined} disabled={!!pending}/></label>{operation === 'insert' && <label>Nombre del registro<input placeholder="Ej. Camila" maxLength={24} value={name} onChange={e => { setName(e.target.value); setError(''); }} disabled={!!pending}/></label>}</div>
            {error && <p id="record-error" className="field-error" role="alert">{error}</p>}
            <button className="button secondary full" disabled={!!pending} type="submit">{operation === 'insert' ? <Plus size={16}/> : operation === 'search' ? <Search size={16}/> : <Trash2 size={16}/>} {pending ? 'Aplicando al terminar…' : operation === 'insert' ? 'Insertar registro' : operation === 'search' ? 'Buscar en el árbol' : 'Eliminar registro'}</button>
          </form>
          {selected !== undefined && records.some(n => n.key === selected) && <div className="selected-record"><div><span>Registro seleccionado</span><strong>{selected} <span>·</span> {records.find(n => n.key === selected)?.name}</strong></div><IconButton label="Editar nombre del registro" disabled={!!pending} onClick={() => { setName(records.find(n => n.key === selected)?.name || ''); setEditing(true); }}><Pencil size={15}/></IconButton></div>}
        </div>
        <div className="inspector-section tree-type"><label htmlFor="tree-type">Estructura del árbol</label><select id="tree-type" value={kind} disabled={!!pending} onChange={e => { clearRun(); onKindChange(e.target.value as TreeKind); }}><option value="bst">Binario de búsqueda (BST)</option><option value="avl">Autobalanceado (AVL)</option></select><p>{kind === 'avl' ? 'Se equilibra con rotaciones al insertar y eliminar.' : 'Menores a la izquierda. Mayores a la derecha.'}</p></div>
      </aside>
    </div>

    {showRecords && <Modal title="Tu pequeña base de datos" onClose={() => setShowRecords(false)} wide><p className="modal-intro">{records.length} registros ordenados por clave. Selecciona uno para trabajar con él en el árbol.</p>{records.length ? <div className="table-scroll"><table><thead><tr><th>Clave</th><th>Nombre</th><th>Hijo izquierdo</th><th>Hijo derecho</th><th/></tr></thead><tbody>{records.map(n => <tr key={n.key}><td><b>{n.key}</b></td><td>{n.name}</td><td>{n.left?.key ?? '—'}</td><td>{n.right?.key ?? '—'}</td><td><button className="text-button" onClick={() => { selectNode(n.key); setShowRecords(false); }}>Seleccionar</button></td></tr>)}</tbody></table></div> : <p>Todavía no hay registros. Inserta uno para comenzar.</p>}</Modal>}
    {editing && <Modal title={`Editar registro ${selected}`} onClose={() => setEditing(false)}><form onSubmit={e => {e.preventDefault();rename();}}><label>Nombre<input value={name} maxLength={24} required autoFocus onChange={e => setName(e.target.value)}/></label><p className="muted">La clave y la posición del registro se conservan.</p><button className="button primary full" disabled={!name.trim()}>Guardar nombre</button></form></Modal>}
  </>;
}
