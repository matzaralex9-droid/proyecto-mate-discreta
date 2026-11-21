import { describe, it, expect } from 'vitest';
import { buildTree, insert, remove, traverse, searchPath, height, dijkstra, exampleGraph, exampleRecords, validateProject, treeLayout } from './algorithms';
import type { TreeNode, Graph } from './algorithms';
const keys = (r:TreeNode|null)=>traverse(r,'inorder').map(n=>n.key);
function assertAVL(n:TreeNode|null){if(!n)return;expect(Math.abs(height(n.left)-height(n.right))).toBeLessThanOrEqual(1);assertAVL(n.left);assertAVL(n.right);}
describe('Árbol binario y recorridos',()=>{
  const root=buildTree(exampleRecords);
  it('recorre inorden, preorden y posorden correctamente',()=>{expect(keys(root)).toEqual([10,20,25,30,40,50,60,70,80]);expect(traverse(root,'preorder').map(n=>n.key)).toEqual([50,30,20,10,25,40,70,60,80]);expect(traverse(root,'postorder').map(n=>n.key)).toEqual([10,25,20,40,30,60,80,70,50]);});
  it('busca solo por la rama correspondiente',()=>{expect(searchPath(root,25).map(n=>n.key)).toEqual([50,30,20,25]);expect(searchPath(root,35).map(n=>n.key)).toEqual([50,30,40]);});
  it('no permite duplicados ni muta la estructura original',()=>{const next=insert(root,{key:35,name:'Nueva'});expect(keys(root)).not.toContain(35);expect(keys(next)).toContain(35);expect(keys(insert(next,{key:35,name:'Duplicada'}))).toHaveLength(10);});
  it('elimina hoja, raíz con dos hijos y nodo con un hijo',()=>{expect(keys(remove(root,10))).toEqual([20,25,30,40,50,60,70,80]);expect(keys(remove(root,50))).toEqual([10,20,25,30,40,60,70,80]);const chain=buildTree([10,20,30].map(key=>({key,name:String(key)})));expect(keys(remove(chain,20))).toEqual([10,30]);});
  it('soporta raíz única, cero, vacío y eliminación inexistente',()=>{expect(remove(buildTree([{key:0,name:'Cero'}]),0)).toBeNull();expect(traverse(null,'inorder')).toEqual([]);expect(keys(remove(root,999))).toEqual(keys(root));});
  it('posiciona todos los nodos sin superponer centros',()=>{const l=treeLayout(root);expect(new Set(l.nodes.map(n=>n.x))).toHaveLength(9);expect(l.edges).toHaveLength(8);});
});
describe('Balanceo AVL',()=>{
  it.each([[30,20,10],[10,20,30],[30,10,20],[10,30,20]])('realiza las rotaciones necesarias en %j',(...values)=>{const r=buildTree(values.map(key=>({key,name:String(key)})),'avl');expect(r?.key).toBe(20);assertAVL(r);});
  it('mantiene orden y balance en inserciones y borrados sucesivos',()=>{let r:TreeNode|null=null;const values=Array.from({length:31},(_,i)=>(i*17)%31);for(const key of values){r=insert(r,{key,name:String(key)},'avl');assertAVL(r);}expect(keys(r)).toEqual(Array.from({length:31},(_,i)=>i));for(const key of values){r=remove(r,key,'avl');assertAVL(r);expect(keys(r)).not.toContain(key);}expect(r).toBeNull();});
});
describe('Dijkstra y estados de animación',()=>{
  it('encuentra la ruta óptima del campus de peso 12',()=>{const last=dijkstra(exampleGraph,'a','f').at(-1)!;expect(last.path).toEqual(['a','c','e','f']);expect(last.distances.f).toBe(12);expect(last.pathEdges).toHaveLength(3);});
  it('mantiene copias independientes de las distancias por paso',()=>{const steps=dijkstra(exampleGraph,'a','f');expect(steps[0].distances.f).toBe(Infinity);expect(steps.at(-1)!.distances.f).toBe(12);expect(steps[0].settled).toEqual([]);});
  it('respeta dirección y reporta nodos inalcanzables',()=>{const g={...exampleGraph,directed:true};expect(dijkstra(g,'f','a').at(-1)!.path).toEqual([]);expect(dijkstra(g,'f','a').at(-1)!.distances.a).toBe(Infinity);});
  it('resuelve origen igual a destino',()=>{const end=dijkstra(exampleGraph,'b','b').at(-1)!;expect(end.path).toEqual(['b']);expect(end.distances.b).toBe(0);});
  it('acepta pesos cero y decimales, rechaza negativos',()=>{const g={...exampleGraph,edges:exampleGraph.edges.map(e=>({...e,weight:0}))};expect(dijkstra(g,'a','f').at(-1)!.distances.f).toBe(0);g.edges[0].weight=-1;expect(()=>dijkstra(g,'a','f')).toThrow();});
  it('coincide con Floyd-Warshall en grafos dirigidos y no dirigidos',()=>{for(const directed of [false,true]){for(let seed=1;seed<=10;seed++){const nodes=Array.from({length:6},(_,i)=>({id:String(i),label:String(i),x:100,y:100}));const edges=[];for(let i=0;i<6;i++)for(let j=directed?0:i+1;j<6;j++){if(i!==j&&(i*7+j*3+seed)%4!==0)edges.push({id:`${i}-${j}`,from:String(i),to:String(j),weight:((i*11+j*13+seed)%9)/2});}const g:Graph={nodes,edges,directed};const matrix=nodes.map((_,i)=>nodes.map((_,j)=>i===j?0:Infinity));for(const e of edges){matrix[+e.from][+e.to]=e.weight;if(!directed)matrix[+e.to][+e.from]=e.weight;}for(let k=0;k<6;k++)for(let i=0;i<6;i++)for(let j=0;j<6;j++)matrix[i][j]=Math.min(matrix[i][j],matrix[i][k]+matrix[k][j]);for(let i=0;i<6;i++)for(let j=0;j<6;j++)expect(dijkstra(g,String(i),String(j)).at(-1)!.distances[String(j)]).toBe(matrix[i][j]);}}});
});
describe('Archivos de proyecto',()=>{
  const data={version:1,kind:'bst',tree:buildTree(exampleRecords),graph:exampleGraph};
  it('conserva la estructura exacta al exportar e importar',()=>{expect(validateProject(JSON.parse(JSON.stringify(data)))).toEqual({tree:data.tree,kind:'bst',graph:exampleGraph});});
  it('rechaza un árbol que viola el orden',()=>{expect(()=>validateProject({...data,tree:{key:50,name:'X',left:{key:80,name:'Y',left:null,right:null},right:null}})).toThrow();});
  it('rechaza aristas con peso negativo o nodo inexistente',()=>{for(const edge of [{...exampleGraph.edges[0],weight:-1},{...exampleGraph.edges[0],to:'missing'}])expect(()=>validateProject({...data,graph:{...exampleGraph,edges:[edge]}})).toThrow();});
  it('rechaza estructuras mal formadas y claves de prototipo',()=>{expect(()=>validateProject({})).toThrow();expect(()=>validateProject({...data,graph:{nodes:[{id:'__proto__',label:'x',x:10,y:10}],edges:[],directed:false}})).toThrow();});
});
