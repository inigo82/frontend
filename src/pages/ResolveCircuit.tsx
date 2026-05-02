import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactFlow, { Background, Controls } from "reactflow";
import "reactflow/dist/style.css";
import ComponentNode from "../components/ComponentNode";
import { ConfirmModal } from "../components/ui/ConfirmModal";

const nodeTypes = {
  component: ComponentNode,
};

type Answer = {
  current?: number;
  voltage?: number;
};

export default function ResolveCircuit() {
  const API_URL = process.env.REACT_APP_API_URL;

  const { id } = useParams();
  const navigate = useNavigate();

  const [nodes, setNodes] = useState<any[]>([]);
  const [edges, setEdges] = useState([]);
  const [loading, setLoading] = useState(true);

  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => {
    const fetchCircuit = async () => {
      try {
        const res = await fetch(`${API_URL}/circuits/${id}`);
        const data = await res.json();
        const parsed = data.data;

        // Marcar showSolverResult=false para que no se vean resultados
        const nodesForStudent = parsed.nodes.map((n: any) => ({
          ...n,
          data: {
            ...n.data,
            showSolverResult: false,
          },
        }));

        setNodes(nodesForStudent);
        setEdges(parsed.edges);

        // Inicializar respuestas vacías
        const initialAnswers: Record<string, Answer> = {};
        parsed.nodes.forEach((n: any) => {
          initialAnswers[n.id] = { current: undefined, voltage: undefined };
        });
        setAnswers(initialAnswers);

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCircuit();
  }, [id]);

  const updateAnswer = (nodeId: string, field: keyof Answer, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [nodeId]: {
        ...prev[nodeId],
        [field]: value === "" ? undefined : Number(value),
      },
    }));
  };

const handleSubmit = async () => {
  try {
    setSubmitting(true);

    const res = await fetch(`${API_URL}/circuits/${id}`);
    const data = await res.json();
    const correctResults = data.result;

    let totalChecks = 0;
    let correctChecks = 0;

    Object.keys(answers).forEach((nodeId) => {
      const student = answers[nodeId];

      const correctCurrent = correctResults.currents?.[nodeId];
      const correctVoltage = correctResults.voltages?.[nodeId];

      if (correctCurrent !== undefined) {
        totalChecks++;
        if (
          student.current !== undefined &&
          Math.abs(student.current - correctCurrent) <= 0.02
        ) {
          correctChecks++;
        }
      }

      if (correctVoltage !== undefined) {
        totalChecks++;
        if (
          student.voltage !== undefined &&
          Math.abs(student.voltage - correctVoltage) <= 0.02
        ) {
          correctChecks++;
        }
      }
    });

    const finalGrade = totalChecks > 0 ? (correctChecks / totalChecks) * 10 : 0;

    const studentId = localStorage.getItem("userId");

    await fetch(`${API_URL}/submissions/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        student_id: studentId,
        circuit_id: id,
        solution: answers,
        grade: finalGrade,
      }),
    });

    
  } catch (err) {
    console.error(err);
  } finally {
    setSubmitting(false);
    navigate("/alumno");
  }
};

  return (
    <div className="h-screen flex flex-col">
      {/* TOPBAR */}
      <div className="h-14 bg-white border-b flex items-center px-4 justify-between">
        <div className="flex items-center">
          <button
            onClick={() => navigate("/alumno")}
            className="bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300"
          >
            Volver
          </button>
          <h2 className="ml-4 font-semibold text-gray-700">Resolver Circuito</h2>
        </div>

        <button
          onClick={() => setConfirmModalOpen(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          Entregar
        </button>
      </div>

      {/* MAIN */}
      <div className="flex flex-1">

        {/* PANEL RESPUESTAS */}
        <div className="w-80 bg-white border-r p-4 overflow-y-auto">
          <h3 className="font-semibold text-gray-700 mb-4">Introduce los valores</h3>

          {nodes.filter((n) => n.data.type !== "GND").map((n) => (
            <div key={n.id} className="mb-4 p-3 border rounded-lg">
              <div className="font-medium text-gray-700 mb-2">
                {n.data?.label || `Componente ${n.id}`}
              </div>

              <input
                type="number"
                placeholder="Corriente (A)"
                className="w-full mb-2 px-2 py-1 border rounded"
                onChange={(e) => updateAnswer(n.id, "current", e.target.value)}
              />

              <input
                type="number"
                placeholder="Voltaje (V)"
                className="w-full px-2 py-1 border rounded"
                onChange={(e) => updateAnswer(n.id, "voltage", e.target.value)}
              />
            </div>
          ))}
        </div>

        {/* CANVAS */}
        <div className="flex-1 relative">
          {loading && (
            <div className="absolute inset-0 bg-gray-50 flex items-center justify-center z-10">
              <div className="text-gray-500 text-lg">Cargando circuito...</div>
            </div>
          )}

          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={false}
            fitView
          >
            <Background gap={16} size={1} color="#e5e7eb" />
            <Controls />
          </ReactFlow>
           {/* MODAL CONFIRMAR RESOLUCION*/}
                <ConfirmModal
                  open={confirmModalOpen}
                  onClose={() => !submitting && setConfirmModalOpen(false)}
                  onConfirm={() => {
                    handleSubmit();
                  }}
                  title="Confirmar entrega"
                  message="¿Seguro que quieres entregar el ejercicio?"
                  confirmText={submitting ? "Enviando..." : "Entregar"}
                />
        </div>
      </div>
    </div>
  );
}
