import { Modal } from "./Modal";

type SaveModalProps = {
  open: boolean;
  circuitName: string;
  setCircuitName: (name: string) => void;
  onClose: () => void;
  onSave: () => void;
};

export function SaveModal({ open, circuitName, setCircuitName, onClose, onSave }: SaveModalProps) {
  return (
    <Modal open={open} title="Nombre del ejercicio" onClose={onClose}>
      <div className="flex flex-col gap-3">
        <input
          type="text"
          value={circuitName}
          onChange={(e) => setCircuitName(e.target.value)}
          placeholder="Ej: Circuito serie-paralelo 1"
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <div className="flex justify-end gap-2 mt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Cancelar
          </button>

          <button
            onClick={onSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            disabled={circuitName.trim() === ""}
          >
            Guardar
          </button>
        </div>
      </div>
    </Modal>
  );
}