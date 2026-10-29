import React, { Component, type ReactNode } from "react";
import { IconAlert } from "./Icons";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="card animate-fade"
          style={{
            margin: "40px auto",
            maxWidth: "540px",
            padding: "28px",
            background: "var(--bg-surface)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            borderRadius: "var(--radius-lg)",
            boxShadow: "var(--shadow-md)",
          }}
          role="alert"
          aria-live="assertive"
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              color: "var(--danger, #ef4444)",
              marginBottom: "12px",
            }}
          >
            <IconAlert size={24} />
            <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 600 }}>
              {this.props.fallbackTitle || "Something went wrong in this section"}
            </h3>
          </div>
          <p
            style={{
              color: "var(--text-secondary, #94a3b8)",
              fontSize: "14px",
              lineHeight: 1.6,
              marginBottom: "20px",
            }}
          >
            {this.state.error?.message ? `Error: ${this.state.error.message}` : "Error: An unknown rendering error occurred."}
          </p>
          <button
            type="button"
            className="btn-primary"
            onClick={this.handleReset}
            style={{ padding: "8px 20px" }}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
