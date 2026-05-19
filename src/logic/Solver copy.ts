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
  a: number;
  b: number;
  type: "R" | "V" | "I";
  value: number;
  id: string;
  orientation?: string;
};

// -------------------------
// Helpers
// -------------------------

function handleToTerminal(handle?: string | null) {
  if (!handle) return "A";
  if (handle.includes("left") || handle.includes("top")) return "A";
  return "B";
}

function getPolaritySign(orientation?: string) {
  if (!orientation) return 1;

  // negativo en A → invertimos
  if (orientation === "left" || orientation === "up") {
    return -1;
  }

  return 1;
}

// -------------------------
// Solver
// -------------------------

export function solveCircuit(nodes: RFNode[], edges: RFEdge[]) {
  // --- terminales ---
  const terminals: string[] = [];
  nodes.forEach((n) => {
    terminals.push(`${n.id}_A`);
    terminals.push(`${n.id}_B`);
  });

  // --- Union-Find ---
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

  // conectar cables
  edges.forEach((e) => {
    const t1 = `${e.source}_${handleToTerminal(e.sourceHandle)}`;
    const t2 = `${e.target}_${handleToTerminal(e.targetHandle)}`;
    union(t1, t2);
  });

  // --- mapear nodos eléctricos ---
  const nodeMap: Record<string, number> = {};
  let idx = 0;

  terminals.forEach((t) => {
    const root = find(t);
    if (nodeMap[root] === undefined) nodeMap[root] = idx++;
  });

  function nodeOf(t: string) {
    return nodeMap[find(t)];
  }

  const nNodes = idx;

  // -------------------------
  // GND real
  // -------------------------
  let gndNode: number | null = null;

  nodes.forEach((n) => {
    if (n.data.type === "GND") {
      const a = nodeOf(`${n.id}_A`);
      gndNode = a;
    }
  });

  if (gndNode === null) {
    throw new Error("No GND definido");
  }

  function mapNode(n: number) {
    if (n === gndNode) return -1;
    if (gndNode !== null && n < gndNode) return n;
    return n - 1;
  }

  // -------------------------
  // ramas (SIN GND)
  // -------------------------
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
  const nVSources = vSources.length;

  const size = nNodes - 1 + nVSources;

  const M: number[][] = Array(size)
    .fill(0)
    .map(() => Array(size).fill(0));

  const bVec: number[] = Array(size).fill(0);

  const vMap = new Map<string, number>();
  vSources.forEach((v, i) => {
    vMap.set(v.id, nNodes - 1 + i);
  });

  // -------------------------
  // Resistencias
  // -------------------------
  branches
    .filter((b) => b.type === "R")
    .forEach((r) => {
      const g = 1 / r.value;

      const a = mapNode(r.a);
      const bN = mapNode(r.b);

      if (a >= 0) M[a][a] += g;
      if (bN >= 0) M[bN][bN] += g;

      if (a >= 0 && bN >= 0) {
        M[a][bN] -= g;
        M[bN][a] -= g;
      }
    });

  // -------------------------
  // Fuentes de corriente
  // -------------------------
  branches
    .filter((b) => b.type === "I")
    .forEach((src) => {
      const a = mapNode(src.a);
      const bN = mapNode(src.b);

      const sign = getPolaritySign(src.orientation);
      const I = sign * src.value;

      // KCL
      if (a >= 0) bVec[a] -= I;
      if (bN >= 0) bVec[bN] += I;
    });

  // -------------------------
  // Fuentes de tensión
  // -------------------------
  vSources.forEach((v, i) => {
    const row = nNodes - 1 + i;

    const a = mapNode(v.a);
    const bN = mapNode(v.b);

    if (a >= 0) {
      M[row][a] = 1;
      M[a][row] = 1;
    }

    if (bN >= 0) {
      M[row][bN] = -1;
      M[bN][row] = -1;
    }

    const sign = getPolaritySign(v.orientation);
    bVec[row] = sign * v.value;
  });

  // -------------------------
  // Resolver
  // -------------------------
  const xRaw = lusolve(M, bVec) as number[][];
  const x = xRaw.map((v) => v[0]);

  // -------------------------
  // Voltajes nodales
  // -------------------------
  const nodeVoltages: number[] = Array(nNodes).fill(0);

  let xi = 0;
  for (let i = 0; i < nNodes; i++) {
    if (i === gndNode) {
      nodeVoltages[i] = 0;
    } else {
      nodeVoltages[i] = x[xi++];
    }
  }

  // -------------------------
  // Corrientes y voltajes
  // -------------------------
  const currents: Record<string, number> = {};
  const voltages: Record<string, number> = {};

  branches.forEach((br) => {
    const Va = nodeVoltages[br.a];
    const Vb = nodeVoltages[br.b];

    const sign = getPolaritySign(br.orientation);
    const V = sign * (Va - Vb);
  

    if (br.type === "R") {
      console.log("r: ",sign);
      voltages[br.id] = Math.round(V * 100) / 100;
      currents[br.id] = Math.round((V / br.value) * 100) / 100;
    } else if (br.type === "V") {
      const row = vMap.get(br.id)!;
            console.log("v: ",sign);

      voltages[br.id] = Math.round(V * 100) / 100;
      currents[br.id] = -Math.round(sign * x[row] * 100) / 100;
    } else if (br.type === "I") {  
      voltages[br.id] = Math.round(sign*V * 100) / 100;
      currents[br.id] = Math.round(br.value * 100) / 100;
    }
  });
  return { nodeVoltages, currents, voltages };
}
