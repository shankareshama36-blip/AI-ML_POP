import { useEffect, useState, useRef } from "react";
import { pingHealth, subscribeSlowLoading } from "../api";
import { Logo } from "./Logo";
import { IconAlert, IconSpinner } from "./Icons";

export function GlobalColdStartOverlay() {
  const [visible, setVisible] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function startColdStartWatch() {
    setTimedOut(false);

    // Clear existing timers
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (pollingRef.current) clearInterval(pollingRef.current);

    // 75s total timeout
    timeoutRef.current = setTimeout(() => {
      setTimedOut(true);
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    }, 75000);

    // Non-blocking 3s polling
    pollingRef.current = setInterval(async () => {
      try {
        const ok = await pingHealth(3000);
        if (ok) {
          setVisible(false);
          setTimedOut(false);
          if (pollingRef.current) clearInterval(pollingRef.current);
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
        }
      } catch {
        // Continue polling until 75s timeout
      }
    }, 3000);
  }

  function stopColdStartWatch() {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setTimedOut(false);
    setRetrying(false);
  }

  useEffect(() => {
    const unsubscribe = subscribeSlowLoading((isSlow) => {
      setVisible(isSlow);
      if (isSlow) {
        startColdStartWatch();
      } else {
        stopColdStartWatch();
      }
    });

    return () => {
      unsubscribe();
      stopColdStartWatch();
    };
  }, []);

  async function handleRetry() {
    setRetrying(true);
    setTimedOut(false);
    try {
      const ok = await pingHealth(5000);
      if (ok) {
        setVisible(false);
        stopColdStartWatch();
      } else {
        startColdStartWatch();
      }
    } catch {
      startColdStartWatch();
    } finally {
      setRetrying(false);
    }
  }

  function handleDismiss() {
    stopColdStartWatch();
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="coldstart-overlay animate-fade" role="status" aria-live="polite">
      <div className="coldstart-modal animate-scale">
        <div className="coldstart-header">
          <Logo showDot={true} />
        </div>

        {timedOut ? (
          <>
            <div className="coldstart-spinner-wrap" style={{ color: "#ef4444" }}>
              <IconAlert size={36} />
            </div>
            <h3 className="coldstart-title">Server Start Timeout</h3>
            <p className="coldstart-desc">
              Server connect hone mein 75 seconds se zyada samay lag gaya. Kripya &quot;Retry&quot; par click karein ya internet connection check karein.
            </p>
            <div style={{ display: "flex", gap: "10px", width: "100%", marginTop: "16px" }}>
              <button
                type="button"
                className="btn-primary"
                onClick={handleRetry}
                disabled={retrying}
                style={{ flex: 1, justifyContent: "center" }}
              >
                {retrying ? (
                  <>
                    <IconSpinner size={16} /> Connecting…
                  </>
                ) : (
                  "🔄 Retry Connection"
                )}
              </button>
              <button
                type="button"
                className="btn-ghost"
                onClick={handleDismiss}
                style={{ padding: "0 16px" }}
              >
                Dismiss
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="coldstart-spinner-wrap">
              <div className="coldstart-spinner" />
            </div>
            <h3 className="coldstart-title">Server start ho raha hai</h3>
            <p className="coldstart-desc">
              Server start ho raha hai (30-60 sec lag sakte hain). Cloud instance standby se boot ho raha hai.
            </p>
            <div className="coldstart-progress-track">
              <div className="coldstart-progress-bar" />
            </div>
            <span className="coldstart-badge">Praxis Enterprise Cloud</span>
          </>
        )}
      </div>
    </div>
  );
}
