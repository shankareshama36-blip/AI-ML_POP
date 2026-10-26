import { useState, useEffect, createContext, useContext, useCallback, type ReactNode } from "react";
import { IconCheck, IconX, IconAlert } from "./Icons";

export type ToastType = "error" | "success" | "info" | "warning";

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let globalShowToast: ((message: string, type?: ToastType) => void) | null = null;

export function triggerToast(message: string, type: ToastType = "error") {
  if (globalShowToast) {
    globalShowToast(message, type);
  } else {
    console.warn("Toast triggered before ToastProvider mounted:", message);
  }
}

export function formatUserFriendlyError(err: unknown): string {
  if (!err) return "An unexpected error occurred.";

  // Check if it's already a clean string
  if (typeof err === "string") {
    return cleanErrorString(err);
  }

  // Handle ApiError or standard Error
  if (typeof err === "object" && err !== null) {
    const errorObj = err as { status?: number; message?: string; detail?: unknown };
    if (errorObj.status === 401) {
      return "Session expired. Please log in again.";
    }
    if (errorObj.status === 429) {
      return "Too many sign-in attempts. Please wait a moment before trying again.";
    }
    if (errorObj.status === 403 || errorObj.status === 400) {
      const msg = (errorObj.message || "").toLowerCase();
      if (msg.includes("approval chain") || msg.includes("evaluate") || msg.includes("not in")) {
        return "Action not allowed: You must run AI evaluation first.";
      }
    }
    if (errorObj.message) {
      return cleanErrorString(errorObj.message);
    }
    if (typeof errorObj.detail === "string") {
      return cleanErrorString(errorObj.detail);
    }
  }

  return "An unexpected error occurred. Please try again.";
}

function cleanErrorString(raw: string): string {
  // If it's JSON encoded, unwrap it
  try {
    const parsed = JSON.parse(raw) as { detail?: unknown; message?: string };
    if (typeof parsed.detail === "string") {
      return cleanErrorString(parsed.detail);
    }
    if (parsed.detail && typeof parsed.detail === "object" && "message" in parsed.detail) {
      return cleanErrorString(String(parsed.detail.message));
    }
    if (typeof parsed.message === "string") {
      return cleanErrorString(parsed.message);
    }
  } catch {
    // Not valid JSON
  }

  const lower = raw.toLowerCase();
  if (lower.includes("not in the approval chain") || lower.includes("not in approval chain")) {
    return "Action not allowed: You must run AI evaluation first.";
  }
  if (lower.includes("invalid email or password") || lower.includes("invalid credentials")) {
    return "Invalid email or password. Please verify your credentials.";
  }
  if (lower.includes("failed to fetch") || lower.includes("networkerror")) {
    return "Unable to reach server. Please check your network connection.";
  }
  if (lower.includes("timed out") || lower.includes("cold start")) {
    return "Server request timed out during cold start. Please retry.";
  }

  return raw;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = "error") => {
    const cleanMsg = cleanErrorString(message);
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev.slice(-3), { id, message: cleanMsg, type }]);
  }, []);

  useEffect(() => {
    globalShowToast = showToast;
    return () => {
      globalShowToast = null;
    };
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      <div className="toast-portal" aria-live="polite" role="region" aria-label="Notifications">
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 4500);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className={`toast-card toast-${toast.type} animate-toast-slide`} role="alert">
      <div className="toast-icon">
        {toast.type === "success" && <IconCheck size={16} />}
        {toast.type === "error" && <IconAlert size={16} />}
        {toast.type === "warning" && <IconAlert size={16} />}
        {toast.type === "info" && <IconCheck size={16} />}
      </div>
      <div className="toast-content">{toast.message}</div>
      <button
        type="button"
        className="toast-close-btn"
        onClick={onDismiss}
        aria-label="Dismiss notification"
      >
        <IconX size={14} />
      </button>
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      showToast: triggerToast,
      removeToast: () => {},
    };
  }
  return ctx;
}
