import { ReactNode } from "react";

type ModalProps = {
  open: boolean;
  title?: string;
  children: ReactNode;
  onClose: () => void;
  fullScreen?: boolean; 
};

export function Modal({ open, title, children, onClose, fullScreen }: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      
      <div
        className={`
          bg-white shadow-lg relative flex flex-col
          
          ${fullScreen
            ? "w-[95vw] h-[90vh] max-w-none rounded-xl"
            : "max-w-md w-full rounded-xl p-6"
          }
        `}
      >
        {/* HEADER */}
        {title && (
          <div className="px-6 py-4 border-b flex justify-between items-center">
            <h2 className="text-lg font-semibold">{title}</h2>
            <button
              className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              onClick={onClose}
            >
              ×
            </button>
          </div>
        )}

        {/* CONTENIDO */}
        <div
          className={`
            ${fullScreen ? "flex-1 overflow-hidden p-4" : ""}
          `}
        >
          {children}
        </div>

      </div>
    </div>
  );
}