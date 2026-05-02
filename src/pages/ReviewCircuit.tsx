import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactFlow, { Background, Controls } from "reactflow";
import "reactflow/dist/style.css";
import ComponentNode from "../components/ComponentNode";

const nodeTypes = {
  component: ComponentNode,
};

export default function ReviewCircuit() {
  const API_URL = process.env.REACT_APP_API_URL;
  const { id } = useParams(); // id del circuito
  const navigate = useNavigate();

  const [nodes, setNodes] = useState<any[]>([]);
  const [edges, setEdges] = useState([]);
  const [loading, setLoading] = useState(true);

  const [answers, setAnswers] = useState<any>({});
  const [correct, setCorrect] = useState<any>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. circuito
        const resCircuit = await fetch(`${API_URL}/circuits/${id}`);
        const circuitData = await resCircuit.json();

        // 2. submission del alumno
        const studentId = localStorage.getItem("userId");
        const resSubmission = await fetch( `${API_URL}/submissions/student/${studentId}/circuit/${id}`);
        const submissionData = await resSubmission.json();

        const parsed = circuitData.data;

        setCorrect(circuitData.result);
        setAnswers(submissionData.solution);

        // Añadir info a nodos
        const nodesWithComparison = parsed.nodes.map((n: any) => ({
          ...n,
          data: {
            ...n.data,
            correctVoltage: circuitData.result.voltages?.[n.id],
            correctCurrent: circuitData.result.currents?.[n.id],
            studentVoltage: submissionData.solution?.[n.id]?.voltage,
            studentCurrent: submissionData.solution?.[n.id]?.current,
          },
        }));

        setNodes(nodesWithComparison);
        setEdges(parsed.edges);

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const isCorrect = (a?: number, b?: number) => {
    if (a === undefined || b === undefined) return false;
    return Math.abs(a -b) <= 0.02;
  };

  return (
    <div className="h-screen flex flex-col">

      {/* TOPBAR */}
      <div className="h-14 bg-white border-b flex items-center px-4">
        <button
          onClick={() => navigate("/alumno")}
          className="bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300"
        >
          Volver
        </button>
        <h2 className="ml-4 font-semibold text-gray-700">
          Resultado del Circuito
        </h2>
      </div>

      <div className="flex flex-1">

        {/* PANEL RESULTADOS */}
        <div className="w-80 bg-white border-r p-4 overflow-y-auto">
          <h3 className="font-semibold mb-4">Resultados</h3>

          {nodes.filter((n) => n.data.type !== "GND").map((n) => {
            const cv = correct.voltages?.[n.id];
            const cc = correct.currents?.[n.id];

            const sv = answers?.[n.id]?.voltage;
            const sc = answers?.[n.id]?.current;

            return (
              <div key={n.id} className="mb-4 p-3 border rounded-lg">
                <div className="font-medium mb-2">{n.data.label}</div>
                <strong>Corriente:</strong><br />
                                <div
                className={`p-2 rounded ${
                    isCorrect(sc, cc)
                    ? "bg-green-100 border border-green-400"
                    : "bg-red-100 border border-red-400"
                }`}
                >
                <div>Tu respuesta: {sc ?? "-"} A</div>
                <div className="text-sm text-gray-600">
                    Correcta: {cc?.toFixed(2)} A
                </div>
                </div>
                 <strong>Voltaje:</strong><br />
                <div
                    className={`p-2 rounded ${
                        isCorrect(sv, cv)
                        ? "bg-green-100 border border-green-400"
                        : "bg-red-100 border border-red-400"
                    }`}
                    >
                    <div>Tu respuesta: {sv ?? "-"} V</div>
                    <div className="text-sm text-gray-600">
                        Correcta: {cv?.toFixed(2)} V
                    </div>
                    </div>
              </div>
            );
          })}
        </div>

        {/* CANVAS */}
        <div className="flex-1 relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              Cargando...
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
            <Background />
            <Controls />
          </ReactFlow>
        </div>
      </div>
    </div>
  );
}