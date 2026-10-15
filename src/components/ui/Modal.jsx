import { X } from "lucide-react";

const Modal = ({ title, onClose, children, width = "max-w-md" }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in"
    onClick={onClose}
  >
    <div
      role="dialog"
      aria-modal="true"
      className={`card w-full ${width} max-h-[90vh] overflow-y-auto p-6 animate-dialog-in`}
      style={{ boxShadow: "var(--shadow-lg)" }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-base font-semibold" style={{ color: "var(--text)" }}>
          {title}
        </h2>
        <button
          onClick={onClose}
          aria-label="Close"
          className="icon-btn"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      {children}
    </div>
  </div>
);

export default Modal;
