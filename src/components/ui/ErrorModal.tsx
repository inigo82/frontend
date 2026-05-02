import { Modal } from "./Modal";

type ErrorModalProps = {
  open: boolean;
  message: string;
  onClose: () => void;
};

export function ErrorModal({ open, message, onClose }: ErrorModalProps) {
  return (
    <Modal open={open} title="Error" onClose={onClose}>
      <div className="flex flex-col gap-3 items-center">
        <p className="text-red-600 font-medium text-center">{message}</p>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Cerrar
        </button>
      </div>
    </Modal>
  );
}