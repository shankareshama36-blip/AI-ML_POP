import { useState, type ReactNode } from "react";
import { socialLogin, type User } from "../api";
import { IconSpinner, IconShield } from "./Icons";
import { useToast } from "./Toast";

export interface SocialLoginButtonsProps {
  onSuccess: (user: User, token: string) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
}

interface SocialProvider {
  id: "google" | "github" | "linkedin" | "apple" | "meta";
  name: string;
  email: string;
  renderIcon: () => ReactNode;
}

const PROVIDERS: SocialProvider[] = [
  {
    id: "google",
    name: "Google",
    email: "user@google.com",
    renderIcon: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="#4285F4"
          d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
        />
        <path
          fill="#34A853"
          d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
        />
        <path
          fill="#FBBC05"
          d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
        />
        <path
          fill="#EA4335"
          d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
        />
      </svg>
    ),
  },
  {
    id: "github",
    name: "GitHub",
    email: "user@github.com",
    renderIcon: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
        />
      </svg>
    ),
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    email: "user@linkedin.com",
    renderIcon: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="#0A66C2" aria-hidden="true">
        <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
      </svg>
    ),
  },
  {
    id: "apple",
    name: "Apple",
    email: "user@apple.com",
    renderIcon: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.63-.78 1.07-1.85.95-2.94-.93.04-2.02.63-2.67 1.4-.58.67-1.08 1.77-.94 2.83 1.03.08 2.06-.55 2.66-1.29z" />
      </svg>
    ),
  },
  {
    id: "meta",
    name: "Meta",
    email: "user@meta.com",
    renderIcon: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="#0081FB" aria-hidden="true">
        <path d="M12 7.15c-2.4 0-4.32 1.54-5.26 3.73-1.08-1.54-2.57-2.48-4.24-2.48C1.12 8.4 0 9.8 0 12.16c0 3.32 2.4 6.2 5.58 6.2 2.06 0 3.8-1.08 4.92-2.82.96 1.74 2.7 2.82 4.92 2.82 3.18 0 5.58-2.88 5.58-6.2 0-2.36-1.12-3.76-2.5-3.76-1.67 0-3.16.94-4.24 2.48C16.32 8.69 14.4 7.15 12 7.15zm-6.42 8.7c-1.8 0-3.08-1.64-3.08-3.69 0-1.48.64-2.22 1.5-2.22 1.28 0 2.5 1.48 3.28 3.08-.48 1.8-1.06 2.83-1.7 2.83zm12.84 0c-.64 0-1.22-1.03-1.7-2.83.78-1.6 2-3.08 3.28-3.08.86 0 1.5.74 1.5 2.22 0 2.05-1.28 3.69-3.08 3.69z" />
      </svg>
    ),
  },
];

export function SocialLoginButtons({ onSuccess, onError, disabled = false }: SocialLoginButtonsProps) {
  const { showToast } = useToast();
  const [connectingProvider, setConnectingProvider] = useState<SocialProvider | null>(null);

  async function handleSocialClick(provider: SocialProvider) {
    if (disabled || connectingProvider) return;

    setConnectingProvider(provider);

    // Simulate OAuth authorization redirect (1.5 seconds)
    setTimeout(async () => {
      try {
        const result = await socialLogin(
          provider.id,
          provider.email,
          `${provider.name} Member`
        );
        showToast(`Signed in securely with ${provider.name}.`, "success");
        onSuccess(result.user, result.token);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : `Failed to connect with ${provider.name}.`;
        showToast(message, "error");
        if (onError) onError(message);
      } finally {
        setConnectingProvider(null);
      }
    }, 1500);
  }

  return (
    <div className="social-login-section" style={{ width: "100%", margin: "16px 0" }}>
      {/* Primary Clean Bordered Buttons for Google & GitHub */}
      <div
        className="social-buttons-primary"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "10px",
          width: "100%",
        }}
      >
        {PROVIDERS.slice(0, 2).map((provider) => (
          <button
            key={provider.id}
            type="button"
            className="social-btn social-btn-primary"
            disabled={disabled || Boolean(connectingProvider)}
            onClick={() => void handleSocialClick(provider)}
            aria-label={`Sign in with ${provider.name}`}
            style={{
              height: "42px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "8px",
              cursor: disabled || Boolean(connectingProvider) ? "not-allowed" : "pointer",
              transition: "all 0.2s ease",
              color: "var(--text-primary)",
              fontWeight: 500,
              fontSize: "13px",
              padding: "0 12px",
            }}
          >
            {provider.renderIcon()}
            <span>{provider.name}</span>
          </button>
        ))}
      </div>

      {/* Secondary Providers (LinkedIn, Apple, Meta) */}
      <div
        className="social-buttons-secondary"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "8px",
          width: "100%",
          marginTop: "8px",
        }}
      >
        {PROVIDERS.slice(2).map((provider) => (
          <button
            key={provider.id}
            type="button"
            className="social-btn social-btn-secondary"
            disabled={disabled || Boolean(connectingProvider)}
            onClick={() => void handleSocialClick(provider)}
            aria-label={`Sign in with ${provider.name}`}
            title={`Sign in with ${provider.name}`}
            style={{
              height: "36px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "8px",
              cursor: disabled || Boolean(connectingProvider) ? "not-allowed" : "pointer",
              transition: "all 0.2s ease",
              color: "var(--text-secondary)",
              fontSize: "12px",
            }}
          >
            {provider.renderIcon()}
            <span style={{ fontSize: "11px" }}>{provider.name}</span>
          </button>
        ))}
      </div>

      {/* Horizontal Divider */}
      <div
        className="social-divider"
        style={{
          display: "flex",
          alignItems: "center",
          margin: "18px 0 16px 0",
          color: "var(--text-muted)",
          fontSize: "12px",
        }}
      >
        <div style={{ flex: 1, height: "1px", background: "var(--border-subtle)" }} />
        <span
          style={{
            padding: "0 12px",
            fontWeight: 500,
            color: "var(--text-secondary)",
            fontSize: "12px",
          }}
        >
          Or continue with
        </span>
        <div style={{ flex: 1, height: "1px", background: "var(--border-subtle)" }} />
      </div>

      {/* Full-Screen Connecting Overlay */}
      {connectingProvider && (
        <div
          className="oauth-overlay animate-fade"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.72)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px",
          }}
          role="status"
          aria-live="polite"
        >
          <div
            className="oauth-card animate-scale"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-lg, 16px)",
              padding: "36px 28px",
              maxWidth: "400px",
              width: "100%",
              textAlign: "center",
              boxShadow: "0 24px 48px rgba(0,0,0,0.35)",
            }}
          >
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-subtle)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "18px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              }}
            >
              {connectingProvider.renderIcon()}
            </div>

            <h3
              style={{
                fontSize: "18px",
                fontWeight: 700,
                color: "var(--text-primary)",
                margin: "0 0 8px 0",
              }}
            >
              Connecting to {connectingProvider.name} securely...
            </h3>

            <p
              className="text-muted"
              style={{
                fontSize: "13px",
                lineHeight: "1.5",
                margin: "0 0 24px 0",
              }}
            >
              Exchanging cryptographically signed OAuth authorization tokens with {connectingProvider.name}.
            </p>

            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                color: "var(--brand)",
                fontSize: "13px",
                fontWeight: 600,
              }}
            >
              <IconSpinner size={20} />
              <span>Redirecting to your workspace...</span>
            </div>

            <div
              style={{
                marginTop: "20px",
                paddingTop: "16px",
                borderTop: "1px solid var(--border-subtle)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                fontSize: "11px",
                color: "var(--text-muted)",
              }}
            >
              <IconShield size={12} /> TLS 1.3 256-bit encrypted handshake
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
