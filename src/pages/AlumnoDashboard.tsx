import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

type Circuit = {
  id: number;
  name: string;
  status: string;
  created_at: string;
  published_at?: string;
  due_date?: string;
  grade?: number;
  submission_id?: number;
};

export default function AlumnoDashboard() {
  const API_URL = process.env.REACT_APP_API_URL;

  const username = localStorage.getItem("username") || "alumno";
  const userId = localStorage.getItem("userId");
  const [activeTab, setActiveTab] = useState<"publicado" | "cerrado">("publicado");
  const [circuits, setCircuits] = useState<Circuit[]>([]);
  const filteredCircuits = circuits.filter(c => c.status === activeTab);
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  // --- FETCH ---
  const fetchCircuits = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/circuits/student/${userId}`)
      const data = await res.json();
      setCircuits(data);
    } catch {
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

  // --- BADGES ---
  const getStatusBadge = (status: string) => {
    switch (status) {
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
        <h1 className="text-xl font-semibold text-gray-800">
          Bienvenido, <strong>{username}</strong>
        </h1>

        <button
          onClick={handleLogout}
          className="bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
        >
          Logout
        </button>
      </div>

      {/* TABLA */}
      <div className="p-6">
        <div className="bg-white rounded-xl shadow overflow-hidden relative min-h-[200px]">

          {/* LOADING */}
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-50 z-10">
              <div className="loader border-t-4 border-blue-500 w-12 h-12 rounded-full animate-spin"></div>
            </div>
          )}
          <div className="flex border-b mb-4">
          {["publicado", "cerrado"].map((tab) => (
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
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-6 py-3">Nombre</th>
                <th className="px-6 py-3">Estado</th>
                <th className="px-6 py-3">Publicación</th>
                <th className="px-6 py-3">Fecha límite</th>
                <th className="px-6 py-3 text-right">Acción</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {filteredCircuits.map((c) => (
                <tr
                  key={c.id}
                  className={`
                    transition-all duration-300
                    ${c.status === "cerrado"
                      ? "bg-gray-50 text-gray-400"
                      : "hover:bg-gray-50"}
                  `}
                >
                  <td className="px-6 py-4">{c.name}</td>

                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(c.status)}`}>
                      {c.status}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    {c.published_at?.slice(0, 10) || "-"}
                  </td>

                  <td className="px-6 py-4">
                    {c.due_date?.slice(0, 10) || "-"}
                  </td>

                  {/* ACCIONES */}
                  <td className="px-6 py-4 text-right space-x-2">

                    {c.submission_id && (
                    <>
                      <span className="text-blue-600 font-medium mr-2">
                        Nota: {c.grade != null ? Number(c.grade).toFixed(2) : "Pendiente"}
                      </span>

                    </>
                  )}

                    {!c.submission_id && c.status === "publicado" ? (
                    <button onClick={() => navigate(`/resolver/${c.id}`)} className="text-green-600 hover:underline">Resolver</button>

                  ) : c.submission_id ? (
                    <button onClick={() => navigate(`/review/${c.id}`)} className="text-green-600 hover:underline">Ver respuesta</button>
                  ) : (
                    <span>No disponible</span>
                  )}

                    {/* NO ENTREGADO Y CERRADO */}
                    {!c.submission_id && c.status === "cerrado" && (
                      <span className="text-gray-400">
                        No entregado
                      </span>
                    )}

                    
                  </td>
                </tr>
              ))}

              {filteredCircuits.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-400">
                    {activeTab === "publicado"
                      ? "No hay ejercicios publicados"
                      : "No hay ejercicios cerrados"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

        </div>
      </div>
    </div>
    
  );
}