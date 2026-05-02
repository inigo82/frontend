import React, { useState, useCallback, useEffect } from "react";
import ReactFlow, {
  addEdge,
  Controls,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  Connection,
} from "reactflow";
import { useNavigate } from "react-router-dom";
import "reactflow/dist/style.css";
import { solveCircuit } from "../logic/Solver";
import ComponentNode from "../components/ComponentNode";
import { AddComponentModal } from "../components/ui/AddComponentModal";
import { SaveModal } from "../components/ui/SaveModal";
import { ErrorModal } from "../components/ui/ErrorModal";

const nodeTypes = {
  component: ComponentNode,
};

type Orientation = "right" | "down" | "left" | "up";

export default function App() {
  const API_URL = process.env.REACT_APP_API_URL;
  const [canSave, setCanSave] = useState(false);
  const [errorModal, setErrorModal] = useState<string | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"R" | "V" | "I" | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [solverResult, setSolverResult] = useState<any>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [circuitName, setCircuitName] = useState("");
  const [resistorCount, setResistorCount] = useState(1);
  const [sourceCount, setSourceCount] = useState(1);
  const [currentSourceCount, setCurrentSourceCount] = useState(1);
  const [isConnecting, setIsConnecting] = useState(false);

  const navigate = useNavigate();

  // ------------------ CONEXIONES ------------------
  const onConnect = useCallback((params: Connection | Edge) => {
    setEdges((eds) => addEdge({ ...params, type: "smoothstep" }, eds));
    setCanSave(false);
  }, []);

  // ------------------ ROTAR ------------------
  const rotateNode = (nodeId: string) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id !== nodeId) return node;
        const order: Orientation[] = ["right", "down", "left", "up"];
        const index = order.indexOf(node.data.orientation);
        return {
          ...node,
          data: { ...node.data, orientation: order[(index + 1) % 4] },
        };
      })
    );
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT") return;

      if (e.key.toLowerCase() === "r") {
        const selected = nodes.find((n) => n.selected);
        if (selected) rotateNode(selected.id);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [nodes]);

  // ------------------ AÑADIR COMPONENTES ------------------
  const handleAddResistor = () => {
    setModalType("R");
    setModalOpen(true);
  };

  const handleAddSource = () => {
    setModalType("V");
    setModalOpen(true);
  };

  const handleAddGround = () => {
    const exists = nodes.some((n) => n.data.type === "GND");

    if (exists) {
      setErrorModal("Solo puede haber un nodo tierra.");
      return;
    }

    const newNode: Node = {
      id: crypto.randomUUID(),
      type: "component",
      position: { x: 100, y: 100 },
      data: {
        label: "GND",
        type: "GND",
        orientation: "down",
      },
    };

    setNodes((nds) => [...nds, newNode]);
  };

  // ------------------ RESOLVER ------------------
  const handleSolve = () => {
    try {
      console.log("aqui");
      if (nodes.length === 0) {
        throw new Error("Circuito vacío");
      }

      const hasGround = nodes.some((n) => n.data.type === "GND");
      if (!hasGround) {
        setErrorModal("Debe añadir un nodo tierra (GND).");
        return;
      }

      console.log("NODES BEFORE SOLVER", nodes);
      const result = solveCircuit(nodes as any, edges);

      setSolverResult(result);
      setCanSave(true);

      setNodes((nds) =>
        nds.map((n) => ({
          ...n,
          data: {
            ...n.data,
            voltage: result.voltages[n.id] ?? 0,
            current: result.currents[n.id] ?? 0,
          },
        }))
      );
    } catch (err) {
      console.error(err);
      setErrorModal("El circuito no es resoluble.");
    }
  };

  // ------------------ GUARDAR ------------------
  const handleSave = async () => {
    try {
      setSaveStatus("loading");

      const token = localStorage.getItem("token");
      const profesorId = localStorage.getItem("userId");

      const nodesToSave = nodes.map((n) => ({
        id: n.id,
        type: n.type,
        position: n.position,
        data: n.data,
      }));

      const res = await fetch(`${API_URL}/circuits`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: circuitName,
          profesor_id: Number(profesorId),
          nodes: nodesToSave,
          edges,
          result: solverResult,
        }),
      });

      if (!res.ok) throw new Error();

      setSaveStatus("success");
      setSaveModalOpen(false);
      navigate("/profesor");
    } catch (err) {
      setSaveStatus("error");
    }
  };

  // ------------------ UI ------------------
  return (
    <>
      <div className="h-screen flex flex-col">

        {/* TOP BAR */}
        <div className="h-14 bg-white border-b flex items-center justify-between px-4">
          <div className="font-semibold">Editor de Circuitos</div>

          <div className="flex gap-2">
            <button onClick={handleSolve} className="bg-green-600 text-white px-4 py-2 rounded">
              Resolver
            </button>

            <button
              onClick={() => setSaveModalOpen(true)}
              disabled={!canSave}
              className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              Guardar
            </button>

            <button onClick={() => navigate("/profesor")} className="bg-gray-200 px-4 py-2 rounded">
              Volver
            </button>
          </div>
        </div>

        {/* SIDEBAR */}
        <div className="flex flex-1">
          <div className="w-20 bg-white border-r p-2 flex flex-col items-center gap-3">

            <button onClick={handleAddResistor}>
              <img src="images/resistencia.png" width={30} />
            </button>

            <button onClick={handleAddSource}>
              <img src="images/fuente.png" width={30} />
            </button>
          <button onClick={() => {
            setModalType("I");
            setModalOpen(true);
          }}>
            
            <img src="images/fuenteCorriente.png" width={30} />
          </button>
            <button onClick={handleAddGround}>
              <img src="images/ground.png" width={30} />
            </button>

          </div>

          {/* CANVAS */}
          <div className="flex-1">
            <ReactFlow
              nodes={nodes.map(n => ({
                ...n,
                data: { ...n.data, isConnecting }
              }))}
              edges={edges}
              nodeTypes={nodeTypes}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onConnectStart={() => setIsConnecting(true)}
              onConnectEnd={() => setIsConnecting(false)}
              fitView
            >
              <Controls />
            </ReactFlow>
          </div>
        </div>
      </div>

      {/* MODALES */}
      <ErrorModal
        open={!!errorModal}
        message={errorModal || ""}
        onClose={() => setErrorModal(null)}
      />

      <SaveModal
        open={saveModalOpen}
        circuitName={circuitName}
        setCircuitName={setCircuitName}
        onClose={() => setSaveModalOpen(false)}
        onSave={handleSave}
      />

      <AddComponentModal
        open={modalOpen}
        type={modalType}
        onClose={() => setModalOpen(false)}
        onConfirm={(value: string) => {
          if (!modalType) return;

          const newNode: Node = {
            id: crypto.randomUUID(),
            type: "component",
            position: { x: 100, y: 100 },
            data: {
              label:
              modalType === "R"
                ? `R${resistorCount} (${value}Ω)`
                : modalType === "V"
                ? `V${sourceCount} (${value}V)`
                : `I${currentSourceCount} (${value}A)`,
              type: modalType,
              value,
              orientation: "right",
            },
          };

          if (modalType === "R") {
            setResistorCount(resistorCount + 1);
          } else if (modalType === "V") {
            setSourceCount(sourceCount + 1);
          } else if (modalType === "I") {
            setCurrentSourceCount(currentSourceCount + 1);
          }

          setNodes((nds) => [...nds, newNode]);
          setModalOpen(false);
        }}
      />
    </>
  );
}