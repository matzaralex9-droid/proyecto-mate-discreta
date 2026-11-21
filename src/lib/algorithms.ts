export type RecordItem = { key: number; name: string };
export type TreeNode = RecordItem & { left: TreeNode | null; right: TreeNode | null };
export type Order = 'inorder' | 'preorder' | 'postorder';
export type TreeKind = 'bst' | 'avl';
export type GraphNode = { id: string; label: string; x: number; y: number };
export type Edge = { id: string; from: string; to: string; weight: number };
export type Graph = { nodes: GraphNode[]; edges: Edge[]; directed: boolean };
export type DijkstraStep = { current: string | null; edge: string | null; settled: string[]; distances: Record<string, number>; previous: Record<string, string | null>; title: string; message: string; path: string[]; pathEdges: string[]; done: boolean };
export const orderInfo = {
  inorder: { label: 'Inorden', english: 'In-order', rule: ['Izquierda', 'Raíz', 'Derecha'], short: 'Los datos, de menor a mayor.', description: 'Primero el subárbol izquierdo, después la raíz y finalmente el derecho. En un árbol de búsqueda, obtienes los valores ordenados.' },
  preorder: { label: 'Preorden', english: 'Pre-order', rule: ['Raíz', 'Izquierda', 'Derecha'], short: 'La raíz marca el inicio.', description: 'Visita la raíz antes de sus hijos. Es útil para representar o copiar la estructura completa del árbol.' },
  postorder: { label: 'Posorden', english: 'Post-order', rule: ['Izquierda', 'Derecha', 'Raíz'], short: 'Los hijos antes que la raíz.', description: 'Visita ambos subárboles antes de la raíz. Es útil al eliminar estructuras o evaluar expresiones desde las hojas.' },
};
export const orders: Order[] = ['preorder', 'inorder', 'postorder'];
export function height(root: TreeNode | null): number { return root ? 1 + Math.max(height(root.left), height(root.right)) : 0; }
function rotateRight(node: TreeNode): TreeNode { const pivot = node.left!; return { ...pivot, right: { ...node, left: pivot.right } }; }
function rotateLeft(node: TreeNode): TreeNode { const pivot = node.right!; return { ...pivot, left: { ...node, right: pivot.left } }; }
function balance(node: TreeNode): TreeNode {
  const factor = height(node.left) - height(node.right);
  if (factor > 1) { if (height(node.left!.left) < height(node.left!.right)) node = { ...node, left: rotateLeft(node.left!) }; return rotateRight(node); }
  if (factor < -1) { if (height(node.right!.right) < height(node.right!.left)) node = { ...node, right: rotateRight(node.right!) }; return rotateLeft(node); }
  return node;
}
export function insert(root: TreeNode | null, record: RecordItem, kind: TreeKind = 'bst'): TreeNode {
  if (!root) return { ...record, left: null, right: null };
  if (record.key === root.key) return root;
  const node = record.key < root.key ? { ...root, left: insert(root.left, record, kind) } : { ...root, right: insert(root.right, record, kind) };
  return kind === 'avl' ? balance(node) : node;
}
export function remove(root: TreeNode | null, key: number, kind: TreeKind = 'bst'): TreeNode | null {
  if (!root) return null;
  let node = { ...root };
  if (key < root.key) node.left = remove(root.left, key, kind);
  else if (key > root.key) node.right = remove(root.right, key, kind);
  else {
    if (!root.left) return root.right;
    if (!root.right) return root.left;
    let successor = root.right;
    while (successor.left) successor = successor.left;
    node = { ...root, key: successor.key, name: successor.name, right: remove(root.right, successor.key, kind) };
  }
  return kind === 'avl' ? balance(node) : node;
}
export function traverse(root: TreeNode | null, order: Order): TreeNode[] {
  if (!root) return [];
  const left = traverse(root.left, order), right = traverse(root.right, order);
  return order === 'preorder' ? [root, ...left, ...right] : order === 'postorder' ? [...left, ...right, root] : [...left, root, ...right];
}
export function searchPath(root: TreeNode | null, key: number): TreeNode[] {
  const path: TreeNode[] = []; let current = root;
  while (current) { path.push(current); if (current.key === key) break; current = key < current.key ? current.left : current.right; }
  return path;
}
export function buildTree(records: RecordItem[], kind: TreeKind = 'bst'): TreeNode | null { return records.reduce<TreeNode | null>((root, record) => insert(root, record, kind), null); }
export function leafCount(root: TreeNode | null): number { return !root ? 0 : !root.left && !root.right ? 1 : leafCount(root.left) + leafCount(root.right); }
export function treeLayout(root: TreeNode | null) {
  const nodes: (TreeNode & { x: number; y: number; depth: number })[] = [];
  const edges: { from: number; to: number; x1: number; y1: number; x2: number; y2: number }[] = [];
  const count = traverse(root, 'inorder').length;
  const width = Math.max(660, count * 65 + 90), canvasHeight = Math.max(450, height(root) * 105 + 80);
  let index = 0;
  function walk(n: TreeNode | null, depth: number) {
    if (!n) return;
    walk(n.left, depth + 1);
    nodes.push({ ...n, x: 65 + index++ * (width - 130) / Math.max(1, count - 1), y: 75 + depth * 105, depth });
    walk(n.right, depth + 1);
  }
  walk(root, 0);
  if (count === 1) nodes[0].x = width / 2;
  nodes.forEach(n => [n.left, n.right].forEach(child => {
    if (child) { const c = nodes.find(v => v.key === child.key)!; edges.push({ from: n.key, to: c.key, x1: n.x, y1: n.y, x2: c.x, y2: c.y }); }
  }));
  return { nodes, edges, width, height: canvasHeight };
}
export function dijkstra(graph: Graph, start: string, end: string): DijkstraStep[] {
  if (!graph.nodes.some(n => n.id === start) || !graph.nodes.some(n => n.id === end)) throw new Error('Selecciona un origen y un destino válidos.');
  if (graph.edges.some(e => !Number.isFinite(e.weight) || e.weight < 0)) throw new Error('Dijkstra necesita pesos mayores o iguales a cero.');
  const distances: Record<string, number> = Object.fromEntries(graph.nodes.map(n => [n.id, Infinity]));
  const previous: Record<string, string | null> = Object.fromEntries(graph.nodes.map(n => [n.id, null]));
  const previousEdge: Record<string, string> = {};
  const settled: string[] = [], steps: DijkstraStep[] = [];
  const name = (id: string) => graph.nodes.find(n => n.id === id)!.label;
  const snapshot = (current: string | null, edge: string | null, title: string, message: string, done = false, path: string[] = [], pathEdges: string[] = []) => steps.push({ current, edge, title, message, settled: [...settled], distances: { ...distances }, previous: { ...previous }, done, path, pathEdges });
  distances[start] = 0;
  snapshot(start, null, 'Todo comienza en ' + name(start), 'La distancia al origen es 0. Las demás distancias empiezan en infinito: todavía no conocemos un camino.');
  while (settled.length < graph.nodes.length) {
    const candidate = graph.nodes.filter(n => !settled.includes(n.id)).sort((a, b) => distances[a.id] - distances[b.id])[0];
    if (!candidate || distances[candidate.id] === Infinity) break;
    const current = candidate.id; settled.push(current);
    snapshot(current, null, name(current) + ' tiene la menor distancia', `Fijamos su distancia en ${formatDistance(distances[current])}. Ningún camino pendiente puede mejorarla.`);
    if (current === end) break;
    graph.edges.filter(e => e.from === current || (!graph.directed && e.to === current)).forEach(edge => {
      const neighbor = edge.from === current ? edge.to : edge.from;
      if (settled.includes(neighbor)) return;
      const alternative = distances[current] + edge.weight, old = distances[neighbor];
      if (alternative < old) { distances[neighbor] = alternative; previous[neighbor] = current; previousEdge[neighbor] = edge.id; }
      snapshot(current, edge.id, alternative < old ? 'Encontramos un camino mejor' : 'Conservamos el camino actual', `${name(current)} → ${name(neighbor)}: ${formatDistance(distances[current])} + ${formatDistance(edge.weight)} = ${formatDistance(alternative)}. ${alternative < old ? `Actualizamos ${name(neighbor)} de ${formatDistance(old)} a ${formatDistance(alternative)}.` : `La distancia conocida (${formatDistance(old)}) es igual o menor.`}`);
    });
  }
  const path: string[] = [], pathEdges: string[] = [];
  if (distances[end] !== Infinity) {
    let cursor: string | null = end;
    while (cursor) { path.unshift(cursor); if (previousEdge[cursor]) pathEdges.unshift(previousEdge[cursor]); cursor = previous[cursor]; }
  }
  snapshot(null, null, path.length ? '¡Encontramos la mejor ruta!' : 'No hay una ruta disponible', path.length ? `${path.map(name).join(' → ')}. Peso total: ${formatDistance(distances[end])}.` : `${name(end)} no es alcanzable desde ${name(start)}. Añade una conexión o revisa la dirección de las aristas.`, true, path, pathEdges);
  return steps;
}
export const formatDistance = (n: number) => n === Infinity ? '∞' : Number(n.toFixed(3)).toString();
export const exampleRecords: RecordItem[] = [
  {key:50,name:'Sofía'}, {key:30,name:'Diego'}, {key:70,name:'Valeria'}, {key:20,name:'Ana'}, {key:40,name:'Mateo'}, {key:60,name:'Lucía'}, {key:80,name:'Gabriel'}, {key:10,name:'Leo'}, {key:25,name:'Emma'},
];
export const exampleGraph: Graph = {
  directed: false,
  nodes: [{id:'a',label:'Campus',x:115,y:235},{id:'b',label:'Biblioteca',x:290,y:100},{id:'c',label:'Cafetería',x:295,y:360},{id:'d',label:'Parque',x:510,y:110},{id:'e',label:'Museo',x:505,y:350},{id:'f',label:'Estación',x:700,y:230}],
  edges: [{id:'ab',from:'a',to:'b',weight:4},{id:'ac',from:'a',to:'c',weight:2},{id:'bc',from:'b',to:'c',weight:1},{id:'bd',from:'b',to:'d',weight:5},{id:'ce',from:'c',to:'e',weight:7},{id:'de',from:'d',to:'e',weight:2},{id:'df',from:'d',to:'f',weight:6},{id:'ef',from:'e',to:'f',weight:3}],
};
export const socialGraph: Graph = { ...exampleGraph, nodes: exampleGraph.nodes.map((n, i) => ({ ...n, label: ['Juan', 'María', 'Pedro', 'Ana', 'Luis', 'Sofía'][i] })), edges: exampleGraph.edges.map(e => ({ ...e, weight: 1 })) };
export const networkGraph: Graph = { ...exampleGraph, nodes: exampleGraph.nodes.map((n, i) => ({ ...n, label: ['Router A', 'Router B', 'Router C', 'Router D', 'Router E', 'Router F'][i] })), edges: exampleGraph.edges.map((e, i) => ({ ...e, weight: [10, 2, 5, 1, 20, 2, 10, 1][i] })) };

export function validateProject(data: unknown): { tree: TreeNode | null; kind: TreeKind; graph: Graph } {
  if (!data || typeof data !== 'object') throw new Error('El archivo no es un proyecto de Nodo.');
  const d = data as Record<string, unknown>;
  if (d.version !== 1 || !['bst', 'avl'].includes(d.kind as string) || !d.graph || !('tree' in d)) throw new Error('El archivo no tiene el formato de Nodo (versión 1).');
  const seen = new Set<number>();
  function checkTree(t: unknown, min = -Infinity, max = Infinity, depth = 0): TreeNode | null {
    if (t === null) return null;
    if (!t || typeof t !== 'object' || depth > 31 || seen.size >= 31) throw new Error('El árbol admite hasta 31 registros.');
    const n = t as TreeNode;
    if (!Number.isInteger(n.key) || n.key < 0 || n.key > 999 || n.key <= min || n.key >= max || seen.has(n.key) || typeof n.name !== 'string' || n.name.length > 24 || !n.name.trim()) throw new Error('El árbol contiene registros inválidos o claves duplicadas.');
    seen.add(n.key);
    const node = { key: n.key, name: n.name.trim(), left: checkTree(n.left, min, n.key, depth + 1), right: checkTree(n.right, n.key, max, depth + 1) };
    if (d.kind === 'avl' && Math.abs(height(node.left) - height(node.right)) > 1) throw new Error('El árbol AVL del archivo no está balanceado.');
    return node;
  }
  const tree = checkTree(d.tree), g = d.graph as Graph;
  if (!Array.isArray(g.nodes) || !Array.isArray(g.edges) || g.nodes.length > 20 || g.edges.length > 190 || typeof g.directed !== 'boolean') throw new Error('El grafo admite hasta 20 nodos y 190 conexiones.');
  const ids = new Set<string>(), edgeIds = new Set<string>(), pairs = new Set<string>();
  const nodes = g.nodes.map(n => {
    if (typeof n.id !== 'string' || !/^[a-zA-Z0-9_-]{1,50}$/.test(n.id) || ['__proto__','constructor','prototype'].includes(n.id) || ids.has(n.id) || typeof n.label !== 'string' || !n.label.trim() || n.label.length > 24 || !Number.isFinite(n.x) || !Number.isFinite(n.y)) throw new Error('Hay un nodo de grafo inválido.');
    ids.add(n.id); return { id: n.id, label: n.label.trim(), x: Math.max(50, Math.min(750, n.x)), y: Math.max(55, Math.min(425, n.y)) };
  });
  const edges = g.edges.map(e => {
    const pair = g.directed ? `${e.from}|${e.to}` : [e.from, e.to].sort().join('|');
    if (typeof e.id !== 'string' || edgeIds.has(e.id) || !ids.has(e.from) || !ids.has(e.to) || e.from === e.to || !Number.isFinite(e.weight) || e.weight < 0 || e.weight > 9999 || pairs.has(pair)) throw new Error('Hay una conexión inválida: revisa nodos, duplicados y pesos (0–9999).');
    pairs.add(pair); edgeIds.add(e.id); return { id: e.id, from: e.from, to: e.to, weight: e.weight };
  });
  return { tree, kind: d.kind as TreeKind, graph: { nodes, edges, directed: g.directed } };
}
