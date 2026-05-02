import { Modal } from "./Modal";

type ConfirmModalProps = {
  open: boolean;
  title?: string;
  message?: string;
  confirmText?: string;
  onClose: () => void;
  onConfirm: () => void;
};

export function ConfirmModal({
  open,
  title = "Confirmar",
  message = "¿Estás seguro?",
  confirmText = "Aceptar",
  onClose,
  onConfirm,
}: ConfirmModalProps) {
  return (
    <Modal open={open} title={title} onClose={onClose}>
      <div className="flex flex-col gap-3">
        
        <p className="text-gray-600">{message}</p>

        <div className="flex justify-end gap-2 mt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Cancelar
          </button>

          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}