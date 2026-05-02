import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Modal } from "../components/ui/Modal";
import { NotesModal } from "../components/ui/NotesModal";

type Circuit = {
  id: number;
  name: string;
  status: string;
  created_at: string;
  published_at?: string;
  due_date?: string;
};

export default function ProfesorDashboard() {
  const API_URL = process.env.REACT_APP_API_URL;
  const username = localStorage.getItem("username") || "profesor";
  const [activeTab, setActiveTab] = useState<"borrador" | "publicado" | "cerrado">("borrador");
  const [circuits, setCircuits] = useState<Circuit[]>([]);
  const filteredCircuits = circuits.filter(c => c.status === activeTab);
  const [loading, setLoading] = useState(false);

  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [selectedCircuit, setSelectedCircuit] = useState<number | null>(null);
  const [dueDate, setDueDate] = useState("");
  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [notesCircuitId, setNotesCircuitId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");

  // --- FETCH CIRCUITS ---
  const fetchCircuits = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/circuits/profesor/${userId}`);
      const data = await res.json();
      setCircuits(data);
    } catch {
      setToast({ message: "Error al cargar circuitos", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCircuits();
  }, []);

  // --- LOGOUT ---
  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  // --- ACCIONES ---
  const deleteCircuit = async (id: number) => {
    if (!window.confirm("¿Eliminar este circuito?")) return;
    try {
      await fetch(`${API_URL}/circuits/${id}`, { method: "DELETE" });
      setToast({ message: "Circuito eliminado", type: "success" });
      fetchCircuits();
    } catch {
      setToast({ message: "Error al eliminar", type: "error" });
    }
  };

  const openNotesModal = (id: number) => {
    setNotesCircuitId(id);
    setNotesModalOpen(true);
  };

  const openPublishModal = (id: number) => {
    setSelectedCircuit(id);
    setDueDate("");
    setPublishModalOpen(true);
  };

  const confirmPublish = async () => {
    if (!dueDate || !selectedCircuit) return;
    try {
      await fetch(`${API_URL}/circuits/publish/${selectedCircuit}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ due_date: dueDate }),
      });
      setToast({ message: "Circuito publicado correctamente", type: "success" });
      fetchCircuits();
    } catch {
      setToast({ message: "Error al publicar", type: "error" });
    } finally {
      setPublishModalOpen(false);
    }
  };

  const finishCircuit = async (id: number) => {
    if (!window.confirm("¿Finalizar este circuito? Esta acción no se puede deshacer.")) return;
    try {
      await fetch(`${API_URL}/circuits/finish/${id}`, { method: "PUT" });
      fetchCircuits();
    } catch {
    }
  };

  // --- BADGES ---
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "borrador":
        return "bg-gray-200 text-gray-800";
      case "publicado":
        return "bg-green-100 text-green-700";
      case "cerrado":
        return "bg-gray-100 text-gray-400/70";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 relative">

      {/* HEADER */}
      <div className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-semibold text-gray-800">Bienvenido, <strong>{username}</strong></h1>

        <div className="flex gap-3">
          <button
            onClick={() => navigate("/editor")}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            + Nuevo circuito
          </button>
          <div className="flex items-center gap-4">
            <button
              onClick={handleLogout}
              className="bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* TABLA CIRCUITOS */}
      
      <div className="p-6">
        <div className="bg-white rounded-xl shadow overflow-hidden relative min-h-[200px]">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-50 z-10">
              <div className="loader border-t-4 border-blue-500 w-12 h-12 rounded-full animate-spin"></div>
            </div>
          )}
        <div className="flex border-b mb-4">
          {["borrador", "publicado", "cerrado"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 text-sm font-medium capitalize transition-all
                ${
                  activeTab === tab
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
            >
              {tab} ({circuits.filter(c => c.status === tab).length})
            </button>
          ))}
        </div>
          <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-600 uppercase text-xs sticky top-0 z-10">
                <tr>
                <th className="px-6 py-3">Nombre</th>
                <th className="px-6 py-3">Estado</th>
                <th className="px-6 py-3">Creación</th>
                <th className="px-6 py-3">Publicación</th>
                <th className="px-6 py-3">Fecha límite</th>
                <th className="px-6 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredCircuits.map((c) => (
                <tr
                  key={c.id}
                  className={`${c.status === "cerrado" ? "bg-gray-50 text-gray-400" : "hover:bg-gray-50"} transition-all duration-300`}
                >
                  <td className="px-6 py-4">{c.name}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(c.status)}`}>
                      {c.status}
                    </span>
                  </td> 
                  <td className="px-6 py-4">{c.created_at?.slice(0, 10)}</td>
                  <td className="px-6 py-4">{c.published_at?.slice(0, 10) || "-"}</td>
                  <td className="px-6 py-4">{c.due_date?.slice(0, 10) || "-"}</td>
                  <td className="px-6 py-4 text-right space-x-2 text-blue-600 hover:underline">
                    {(c.status === "publicado" || c.status === "cerrado") && (
                      <button
                        onClick={() => openNotesModal(c.id)}
                        className="text-purple-600 hover:underline font-medium"
                      >
                        Ver notas
                      </button>
                    )}
                    <button onClick={() => navigate(`/circuit/${c.id}`)} className="text-blue-600 hover:underline">Ver</button>
                    {c.status === "borrador" && (
                      <button onClick={() => openPublishModal(c.id)} className="text-green-600 hover:underline">Publicar</button>
                    )}
                    {c.status === "publicado" && (
                      <button onClick={() => finishCircuit(c.id)} className="text-yellow-600 hover:underline">Cerrar</button>
                    )}
                    <button onClick={() => deleteCircuit(c.id)} className="text-red-600 hover:underline">Eliminar</button>
                  </td>
                </tr>
              ))}
              {filteredCircuits.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-400">
                    No hay circuitos en este estado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL PUBLICAR */}
      <Modal open={publishModalOpen} title="Publicar Circuito" onClose={() => setPublishModalOpen(false)}>
        <label className="block text-sm text-gray-600 mb-2">Fecha límite</label>
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={() => setPublishModalOpen(false)}
            className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
          >
            Cancelar
          </button>
          <button
            onClick={confirmPublish}
            className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
          >
            Publicar
          </button>
        </div>
      </Modal>

      {/* MODAL NOTAS */}
      <NotesModal
        open={notesModalOpen}
        circuitId={notesCircuitId}
        onClose={() => setNotesModalOpen(false)}
      />
    </div>
  );
}