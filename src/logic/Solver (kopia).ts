import { lusolve } from "mathjs";


export type RFNode = {
 id: string;
 data: { label: string; value: string };
};


export type RFEdge = {
 source: string;
 target: string;
 sourceHandle?: string | null;
 targetHandle?: string | null;
};


export type Branch = {
  a: number;
  b: number;
  type: "R" | "V";
  value: number;
  id: string;
  orientation?: string;
};


/**
* solveCircuit
* Resuelve un circuito de corriente continua serie-paralelo con una o más fuentes de tensión.
* Devuelve:
* - nodeVoltages: voltajes nodales (referencia nodo 0 = tierra)
* - currents: corrientes por rama (resistencias y fuentes)
* - voltages: voltaje entre los extremos de cada resistencia/fuente
*/
export function solveCircuit(nodes: RFNode[], edges: RFEdge[]) {
 // --- Crear terminales ---
 const terminals: string[] = [];
 nodes.forEach((n) => {
   terminals.push(`${n.id}_A`);
   terminals.push(`${n.id}_B`);
 });


 // --- Union-Find para nodos eléctricos ---
 const parent: Record<string, string> = {};
 terminals.forEach((t) => (parent[t] = t));


 function find(x: string): string {
   if (parent[x] !== x) parent[x] = find(parent[x]);
   return parent[x];
 }


 function union(a: string, b: string) {
   const pa = find(a);
   const pb = find(b);
   if (pa !== pb) parent[pb] = pa;
 }


 edges.forEach((e) => {
   const t1 = `${e.source}_${handleToTerminal(e.sourceHandle)}`;
   const t2 = `${e.target}_${handleToTerminal(e.targetHandle)}`;
   union(t1, t2);
 });


 // --- Mapear nodos eléctricos a índices ---
 const nodeMap: Record<string, number> = {};
 
 let idx = 0;
 terminals.forEach((t) => {
   const root = find(t);
   if (nodeMap[root] === undefined) nodeMap[root] = idx++;
 });


 function nodeOf(t: string) {
   return nodeMap[find(t)];
 }


 // --- Crear ramas ---
 const branches: Branch[] = nodes.map((n) => ({
  a: nodeOf(`${n.id}_A`),
  b: nodeOf(`${n.id}_B`),
  type: n.data.label.startsWith("R") ? "R" : "V",
  value: parseFloat(n.data.value),
  id: n.id,
  orientation: (n.data as any).orientation,
}));

function getPolaritySign(orientation?: string) {
  // devuelve +1 si A es positivo, -1 si A es negativo
  if (!orientation) return 1;

  if (orientation === "left" || orientation === "up") {
    // negativo en A → A es negativo → signo invertido
    return -1;
  }

  return 1;
}

 // --- Contar nodos y fuentes ---
 const nNodes = idx;
 const vSources = branches.filter((b) => b.type === "V");
 const nVSources = vSources.length;


 // --- Construir matriz MNA ---
 const size = nNodes - 1 + nVSources; // nodo 0 = tierra
 const M: number[][] = Array(size)
   .fill(0)
   .map(() => Array(size).fill(0));
 const b: number[] = Array(size).fill(0);


 // Mapear fuente de tensión a fila/columna
 const vMap = new Map<string, number>();
 vSources.forEach((v, i) => vMap.set(v.id, nNodes - 1 + i));


 // --- Resistencias ---
 branches
   .filter((b) => b.type === "R")
   .forEach((r) => {
     const g = 1 / r.value;
     const a = r.a - 1; // nodo 0 = tierra
     const bN = r.b - 1;


     if (a >= 0) M[a][a] += g;
     if (bN >= 0) M[bN][bN] += g;
     if (a >= 0 && bN >= 0) {
       M[a][bN] -= g;
       M[bN][a] -= g;
     }
   });


 // --- Fuentes de tensión ---
 vSources.forEach((v, i) => {
   const row = nNodes - 1 + i;
   const a = v.a - 1;
   const bN = v.b - 1;


   if (a >= 0) {
     M[row][a] = 1;
     M[a][row] = 1;
   }
   if (bN >= 0) {
     M[row][bN] = -1;
     M[bN][row] = -1;
   }
   const sign = getPolaritySign(v.orientation);
    b[row] = sign * v.value;
 });


 // --- Resolver ---
 const xRaw = lusolve(M, b) as number[][];
 const x = xRaw.map((v) => v[0]);


 // --- Voltajes nodales ---
 const nodeVoltages = [0, ...x.slice(0, nNodes - 1)]; // nodo 0 = tierra


 // --- Corrientes y voltajes por rama ---
 const currents: Record<string, number> = {};
 const voltages: Record<string, number> = {};


 branches.forEach((br) => {
   const Va = nodeVoltages[br.a];
   const Vb = nodeVoltages[br.b];


   if (br.type === "R") {
const sign = getPolaritySign(br.orientation);

    const V = sign * (Va - Vb);
    voltages[br.id] = Math.round(V * 100) / 100;

    currents[br.id] = Math.round((V / br.value) * 100) / 100;

     currents[br.id] = Math.round((V / br.value) * 100) / 100;
   } else {
     voltages[br.id] = Math.round(br.value * 100) / 100;
     const row = vMap.get(br.id)!;
     currents[br.id] =  Math.round(x[row] * 100) / 100; // corriente de la fuente
   }
 });


 return { nodeVoltages, currents, voltages };
}


// Convierte handle a terminal A/B
function handleToTerminal(handle?: string | null) {
 if (!handle) return "A";
 if (handle.includes("left") || handle.includes("top")) return "A";
 return "B";
}