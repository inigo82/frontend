import { lusolve } from "mathjs";

export type RFNode = {
  id: string;
  data: {
    label: string;
    value?: string;
    type: "R" | "V" | "I" | "GND";
    orientation?: string;
  };
};

export type RFEdge = {
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
};

export type Branch = {
  a: number; // Índice del nodo conectado al handle "A" (left/top)
  b: number; // Índice del nodo conectado al handle "B" (right/bottom)
  type: "R" | "V" | "I";
  value: number;
  id: string;
  orientation?: string;
};

// -------------------------
// Helpers de Orientación
// -------------------------

function handleToTerminal(handle?: string | null) {
  if (!handle) return "A";
  if (handle.includes("left") || handle.includes("top")) return "A";
  return "B";
}

/**
 * Devuelve qué índice de nodo es el positivo y cuál el negativo
 * basándose en tu regla de orientación.
 */
function getTerminalsByOrientation(br: Branch) {
  // Regla: si orientation es "left" o "up", el NEGATIVO está en A.
  // Por tanto, el POSITIVO está en B.
  const negIsA = br.orientation === "left" || br.orientation === "up";
  return {
    pos: negIsA ? br.b : br.a,
    neg: negIsA ? br.a : br.b,
  };
}

// -------------------------
// Solver
// -------------------------

export function solveCircuit(nodes: RFNode[], edges: RFEdge[]) {
  // --- 1. Mapeo de Terminales ---
  const terminals: string[] = [];
  nodes.forEach((n) => {
    terminals.push(`${n.id}_A`);
    terminals.push(`${n.id}_B`);
  });

  // --- 2. Union-Find para agrupar cables ---
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

  // --- 3. Mapear nodos eléctricos a índices ---
  const nodeMap: Record<string, number> = {};
  let idx = 0;
  terminals.forEach((t) => {
    const root = find(t);
    if (nodeMap[root] === undefined) nodeMap[root] = idx++;
  });

  const nNodes = idx;
  const nodeOf = (t: string) => nodeMap[find(t)];

  // --- 4. Identificar GND ---
  let gndNode: number | null = null;
  nodes.forEach((n) => {
    if (n.data.type === "GND") gndNode = nodeOf(`${n.id}_A`);
  });

  if (gndNode === null) throw new Error("No GND definido");

  // Función para omitir la fila/columna del GND en la matriz
  function mapNode(n: number) {
    if (n === gndNode) return -1;
    return n < gndNode! ? n : n - 1;
  }

  // --- 5. Definir Ramas ---
  const branches: Branch[] = nodes
    .filter((n) => n.data.type !== "GND")
    .map((n) => ({
      a: nodeOf(`${n.id}_A`),
      b: nodeOf(`${n.id}_B`),
      type: n.data.type as "R" | "V" | "I",
      value: parseFloat(n.data.value || "0"),
      id: n.id,
      orientation: n.data.orientation,
    }));

  const vSources = branches.filter((b) => b.type === "V");
  const size = nNodes - 1 + vSources.length;

  const M: number[][] = Array(size).fill(0).map(() => Array(size).fill(0));
  const bVec: number[] = Array(size).fill(0);

  // Mapa para encontrar la variable de corriente de cada fuente V
  const vIdxMap = new Map<string, number>();
  vSources.forEach((v, i) => vIdxMap.set(v.id, nNodes - 1 + i));

  // --- 6. Ensamblaje MNA ---

  branches.forEach((br) => {
    const { pos, neg } = getTerminalsByOrientation(br);
    const pN = mapNode(pos);
    const nN = mapNode(neg);

    if (br.type === "R") {
      const g = 1 / br.value;
      if (pN >= 0) M[pN][pN] += g;
      if (nN >= 0) M[nN][nN] += g;
      if (pN >= 0 && nN >= 0) {
        M[pN][nN] -= g;
        M[nN][pN] -= g;
      }
    } 
    else if (br.type === "I") {
      // Positivo si fluye de Negativo a Positivo (dentro de la fuente)
      // Significa que la corriente "sale" por el nodo Positivo.
      if (pN >= 0) bVec[pN] += br.value;
      if (nN >= 0) bVec[nN] -= br.value;
    } 
    else if (br.type === "V") {
      const row = vIdxMap.get(br.id)!;
      const { pos, neg } = getTerminalsByOrientation(br);
      const pN = mapNode(pos);
      const nN = mapNode(neg);

      // Ecuación de tensión: Vpos - Vneg = Value
      if (pN >= 0) {
        M[row][pN] = 1;
        M[pN][row] = -1; // Corriente entrando al positivo
      }
      if (nN >= 0) {
        M[row][nN] = -1;
        M[nN][row] = 1;  // Corriente saliendo del negativo
      }
      bVec[row] = br.value;
    }
  });

  // --- 7. Resolver Sistema ---
  const xRaw = lusolve(M, bVec) as number[][];
  const x = xRaw.map((v) => v[0]);

  // --- 8. Reconstruir Voltajes de Nodos ---
  const nodeVoltages: number[] = Array(nNodes).fill(0);
  let xi = 0;
  for (let i = 0; i < nNodes; i++) {
    if (i === gndNode) {
      nodeVoltages[i] = 0;
    } else {
      nodeVoltages[i] = x[xi++];
    }
  }

  // --- 9. Calcular Corrientes y Voltajes por Componente ---
  const currents: Record<string, number> = {};
  const voltages: Record<string, number> = {};

  branches.forEach((br) => {
    const { pos, neg } = getTerminalsByOrientation(br);
    const Vpos = nodeVoltages[pos];
    const Vneg = nodeVoltages[neg];
    
    // Voltaje del componente (Vpos - Vneg)
    const V_diff = Vpos - Vneg;

    if (br.type === "R") {
      voltages[br.id] = Number(V_diff.toFixed(2));
      currents[br.id] = Number((V_diff / br.value).toFixed(2));
    } 
    else if (br.type === "V") {
      const row = vIdxMap.get(br.id)!;
      voltages[br.id] = Number(V_diff.toFixed(2));
      // x[row] representa la corriente que va de NEGATIVO a POSITIVO
      // por dentro de la fuente. 
      currents[br.id] = Number(x[row].toFixed(2));
    }
    else if (br.type === "I") {
      voltages[br.id] = Number(V_diff.toFixed(2));
      currents[br.id] = Number(br.value.toFixed(2));
    }
  });

  return { nodeVoltages, currents, voltages };
}