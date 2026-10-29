import React from "react";

export default function Toast({ toasts, onDismiss }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast toast-${toast.type || "info"}`}
          onClick={() => onDismiss(toast.id)}
          role="alert"
        >
          <span className="toast-icon">
            {toast.type === "success" && "✓"}
            {toast.type === "danger" && "✕"}
            {toast.type === "warning" && "⚠️"}
            {(!toast.type || toast.type === "info") && "ℹ️"}
          </span>
          <span className="toast-message">{toast.message}</span>
          <button
            className="toast-close"
            onClick={(e) => {
              e.stopPropagation();
              onDismiss(toast.id);
            }}
            aria-label="Dismiss notification"
          >
            &times;
          </button>
        </div>
      ))}
    </div>
  );
}
