import { useState, useEffect, useRef, createContext, useContext, useCallback, type ReactNode } from "react";
import { IconCheck, IconX, IconAlert } from "./Icons";

export type ToastType = "error" | "success" | "info" | "warning";

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  leaving?: boolean;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let globalShowToast: ((message: string, type?: ToastType) => void) | null = null;

// eslint-disable-next-line react-refresh/only-export-components
export function triggerToast(message: string, type: ToastType = "error") {
  if (globalShowToast) {
    globalShowToast(message, type);
  } else {
    console.warn("Toast triggered before ToastProvider mounted:", message);
  }
}

// eslint-disable-next-line react-refresh/only-export-components
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
    if (Array.isArray(parsed.detail) && parsed.detail.length > 0) {
      const first = parsed.detail[0] as { msg?: string };
      if (first && typeof first.msg === "string") {
        return first.msg.replace(/^Value error,\s*/i, "");
      }
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

/** How long a toast stays fully visible before it starts fading out. */
const TOAST_DURATION_MS = 5000;
/** Duration of the fade-out animation (must match `.toast-leaving` in App.css). */
const TOAST_FADE_MS = 300;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  // Timers are owned by the provider (keyed by toast id) so that re-renders of
  // the provider or its children can never reset or clear them prematurely.
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>[]>>(new Map());

  const clearTimers = useCallback((id: string) => {
    const pending = timers.current.get(id);
    if (pending) {
      pending.forEach(clearTimeout);
      timers.current.delete(id);
    }
  }, []);

  const removeToast = useCallback(
    (id: string) => {
      clearTimers(id);
      setToasts((prev) => prev.filter((t) => t.id !== id));
    },
    [clearTimers],
  );

  // Start the fade-out, then unmount once the animation has finished.
  const dismissToast = useCallback(
    (id: string) => {
      clearTimers(id);
      setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
      const removal = setTimeout(() => removeToast(id), TOAST_FADE_MS);
      timers.current.set(id, [removal]);
    },
    [clearTimers, removeToast],
  );

  const showToast = useCallback(
    (message: string, type: ToastType = "error") => {
      const cleanMsg = cleanErrorString(message);
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => {
        const next = [...prev, { id, message: cleanMsg, type }];
        // Drop the oldest toasts beyond the cap (and their timers).
        const overflow = next.slice(0, Math.max(0, next.length - 4));
        overflow.forEach((t) => clearTimers(t.id));
        return next.slice(-4);
      });
      timers.current.set(id, [setTimeout(() => dismissToast(id), TOAST_DURATION_MS)]);
    },
    [clearTimers, dismissToast],
  );

  useEffect(() => {
    globalShowToast = showToast;
    return () => {
      globalShowToast = null;
    };
  }, [showToast]);

  useEffect(() => {
    const map = timers.current;
    return () => {
      map.forEach((list) => list.forEach(clearTimeout));
      map.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      <div className="toast-portal" aria-live="polite" role="region" aria-label="Notifications">
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onDismiss={() => dismissToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  return (
    <div
      className={`toast-card toast-${toast.type} animate-toast-slide${toast.leaving ? " toast-leaving" : ""}`}
      role="alert"
    >
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

// eslint-disable-next-line react-refresh/only-export-components
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
