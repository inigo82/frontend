import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactFlow, { Background, Controls } from "reactflow";
import "reactflow/dist/style.css";
import ComponentNode from "../components/ComponentNode";

const nodeTypes = {
  component: ComponentNode,
};

export default function ViewCircuit() {
  const API_URL = process.env.REACT_APP_API_URL;
  const { id } = useParams();
  const navigate = useNavigate();

  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCircuit = async () => {
      try {
        const res = await fetch(`${API_URL}/circuits/${id}`);
        const data = await res.json();
        const parsed = data.data;

        const nodesWithResult = parsed.nodes.map((n: any) => ({
          ...n,
          data: {
            ...n.data,
            solverResult: data.result,
          },
        }));

        setNodes(nodesWithResult);
        setEdges(parsed.edges);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCircuit();
  }, [id]);

  return (
    <div className="h-screen flex flex-col">

      {/* TOPBAR */}
      <div className="h-14 bg-white border-b flex items-center px-4">
        <button
          onClick={() => navigate("/profesor")}
          className="bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300"
        >
           Volver
        </button>
        <h2 className="ml-4 font-semibold text-gray-700">Visor de Circuito</h2>
      </div>

      {/* MAIN LAYOUT */}
      <div className="flex flex-1">


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
            panOnDrag={true}
            zoomOnScroll={true}
            fitView
          >
            <Background gap={16} size={1} color="#e5e7eb" />
            <Controls />
          </ReactFlow>
        </div>
      </div>
    </div>
  );
}