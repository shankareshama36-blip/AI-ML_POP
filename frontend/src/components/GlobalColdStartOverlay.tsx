import { useEffect, useState } from "react";
import { subscribeSlowLoading } from "../api";
import { Logo } from "./Logo";

export function GlobalColdStartOverlay() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    return subscribeSlowLoading((isSlow) => {
      setVisible(isSlow);
    });
  }, []);

  if (!visible) return null;

  return (
    <div className="coldstart-overlay animate-fade" role="status" aria-live="polite">
      <div className="coldstart-modal animate-scale">
        <div className="coldstart-header">
          <Logo showDot={true} />
        </div>
        <div className="coldstart-spinner-wrap">
          <div className="coldstart-spinner" />
        </div>
        <h3 className="coldstart-title">Waking up secure server</h3>
        <p className="coldstart-desc">
          This may take up to 60 seconds on first load as free-tier instances spin up from standby...
        </p>
        <div className="coldstart-progress-track">
          <div className="coldstart-progress-bar" />
        </div>
        <span className="coldstart-badge">Enterprise Cloud Defense</span>
      </div>
    </div>
  );
}
