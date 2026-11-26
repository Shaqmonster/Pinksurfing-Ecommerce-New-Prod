import React from "react";
import { Link } from "react-router-dom";

/**
 * Catches client throws on deals routes so shoppers get a recovery path
 * instead of a blank screen.
 */
export default class DealsErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("Deals route error:", error, info?.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          style={{
            minHeight: "60vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            padding: 24,
            textAlign: "center",
            color: "var(--ps-color-text, #fff)",
            background: "var(--ps-color-bg, #0B0010)",
            fontFamily: "var(--ps-font-sans, system-ui, sans-serif)",
          }}
        >
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
            Something went wrong on this deal
          </h1>
          <p
            style={{
              maxWidth: 320,
              fontSize: 14,
              color: "var(--ps-color-text-meta, #a3a3a3)",
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            It&apos;s not you. Head back to deals and try again.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
            <button
              type="button"
              onClick={() => this.setState({ hasError: false })}
              style={{
                minHeight: 44,
                padding: "0 20px",
                borderRadius: 8,
                border: "none",
                background: "var(--ps-primary, #ec4899)",
                color: "#fff",
                fontWeight: 700,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              Try again
            </button>
            <Link
              to="/deals"
              onClick={() => this.setState({ hasError: false })}
              style={{
                minHeight: 44,
                padding: "0 20px",
                borderRadius: 8,
                border: "1px solid var(--ps-color-border, #333)",
                background: "var(--ps-color-surface, #1a1a1a)",
                color: "var(--ps-color-text, #fff)",
                fontWeight: 700,
                fontSize: 14,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              Back to Deals
            </Link>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
