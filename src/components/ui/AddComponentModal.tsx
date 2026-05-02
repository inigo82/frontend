import { useState, useEffect } from "react";
import { Modal } from "./Modal";

type Props = {
  open: boolean;
  type: "R" | "V" | "I" | null;
  onClose: () => void;
  onConfirm: (value: string) => void;
};

export function AddComponentModal({ open, type, onClose, onConfirm }: Props) {
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    if (open) setInputValue("");
  }, [open]);

  if (!type) return null;

  const label =
    type === "R"
      ? "Resistencia"
      : type === "V"
      ? "Fuente de tensión"
      : "Fuente de corriente";

  const unit =
    type === "R"
      ? "Ω"
      : type === "V"
      ? "V"
      : "A";

  const handleConfirm = () => {
    if (inputValue.trim() === "") return;
    onConfirm(inputValue);
  };

  return (
    <Modal open={open} title={`Añadir ${label}`} onClose={onClose}>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-600">Valor</label>

        <div className="flex items-center gap-2">
          <input
            type="number"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-gray-600">{unit}</span>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
          >
            Cancelar
          </button>

          <button
            onClick={handleConfirm}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            Añadir
          </button>
        </div>
      </div>
    </Modal>
  );
}