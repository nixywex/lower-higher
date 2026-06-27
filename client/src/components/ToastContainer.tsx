import type { Toast } from '../hooks/useToast';
import './ToastContainer.css';

interface Props {
  toasts: Toast[];
  onRemove: (id: number) => void;
}

export function ToastContainer({ toasts, onRemove }: Props) {
  if (toasts.length === 0) return null;
  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className="toast">
          <span className="toast-icon">⚠</span>
          <span className="toast-message">{toast.message}</span>
          <button className="toast-close" onClick={() => onRemove(toast.id)}>
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
