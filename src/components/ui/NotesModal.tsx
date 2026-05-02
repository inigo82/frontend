import { useEffect, useState } from "react";
import { Modal } from "./Modal";

type NotesModalProps = {
  open: boolean;
  onClose: () => void;
  circuitId: number | null;
  username?: string; 
};

export function NotesModal({ open, onClose, circuitId, username }: NotesModalProps) {
  const API_URL = process.env.REACT_APP_API_URL;
  const [notesData, setNotesData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!circuitId) return;
    setLoading(true);
    fetch(`${API_URL}/circuits/${circuitId}/submissions`)
      .then((res) => res.json())
      .then((data) => setNotesData(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [circuitId]);

  if (!open) return null;

  const nodeMap: Record<string, string> = {};
  console.log(notesData);
  notesData?.nodes?.forEach((n: any) => {
    nodeMap[n.id] = n.data?.label || n.id.slice(0, 4);
  });
  const studentSubmissions = notesData?.submissions?.filter(
  (s: any) => !username || s.usuario === username
) || [];
  const correctCurrents = notesData?.correct?.currents || {};
  const correctVoltages = notesData?.correct?.voltages || {};
return (
  <Modal
    open={open}
    title="Notas de los alumnos"
    onClose={onClose}
    fullScreen
  >
    <div className="w-[95vw] h-[90vh] flex flex-col">

      {/* CONTENIDO */}
      <div className="flex-1 overflow-auto">

        {loading ? (
          <p>Cargando...</p>
        ) : !notesData || !notesData.correct ? (
          <p>No hay datos disponibles.</p>
        ) : (
          <div className="w-full h-full overflow-auto">

            <table className="w-full min-w-[900px] text-sm border-collapse border border-gray-300">
              
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 border"></th>

                  {Object.keys(correctCurrents).map((id) => (
                    <th key={id} className="px-4 py-3 border">
                      {nodeMap[id]}
                    </th>
                  ))}

                  <th className="px-4 py-3 border">Nota</th>
                </tr>
              </thead>

             <tbody>
  {/* RESULTADO CORRECTO */}
  <tr className="bg-gray-100 font-semibold">
    <td className="px-4 py-2 border">Resultado correcto</td>
    {Object.keys(notesData?.correct?.currents || {}).map((id) => (
      <td key={id} className="px-4 py-2 border text-center">
        {notesData?.correct?.currents[id]} A / {notesData?.correct?.voltages[id]} V
      </td>
    ))}
    <td className="px-4 py-2 border text-center">—</td>
  </tr>

  {/* SUBMISSIONS */}
  {studentSubmissions.length === 0 ? (
    <tr>
      <td colSpan={(notesData?.correct ? Object.keys(notesData.correct.currents).length : 0) + 2} className="text-center py-4 text-gray-400">
        No hay resultados de alumnos
      </td>
    </tr>
  ) : (
    studentSubmissions.map((s: any, idx: number) => (
      <tr key={idx} className="hover:bg-gray-50">
        <td className="px-4 py-2 border font-medium">
          {!username ? s.usuario : "Tu resultado"}
        </td>
        {Object.keys(notesData?.correct?.currents || {}).map((id) => {
          const studentCurrent = s.solution?.[id]?.current;
          const studentVoltage = s.solution?.[id]?.voltage;
          const correctCurrent = notesData?.correct?.currents[id];
          const correctVoltage = notesData?.correct?.voltages[id];
          const isCurrentCorrect = Math.abs(studentCurrent -correctCurrent) <= 0.02;
          const isVoltageCorrect = Math.abs(studentVoltage -correctVoltage) <= 0.02;

          return (
            <td key={id} className="px-2 py-1 border text-center">
              <span className={`px-2 py-1 rounded ${isCurrentCorrect ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800"}`}>
                {studentCurrent ?? "-"} A
              </span>{" "}
              /{" "}
              <span className={`px-2 py-1 rounded ${isVoltageCorrect ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800"}`}>
                {studentVoltage ?? "-"} V
              </span>
            </td>
          );
        })}
        <td className="px-4 py-2 border text-center font-semibold"> {s.grade != null ? Number(s.grade).toFixed(2) : "-"}</td>
      </tr>
    ))
  )}
</tbody>
            </table>

          </div>
        )}
      </div>

      {/* FOOTER FIJO */}
      <div className="flex justify-end pt-4 border-t mt-2">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
        >
          Cerrar
        </button>
      </div>
    </div>
  </Modal>
);
}