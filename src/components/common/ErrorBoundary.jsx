import React from "react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Unhandled error caught by ErrorBoundary:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleResetAndReload = () => {
    try {
      localStorage.removeItem("portal_auth_user");
      localStorage.removeItem("att_history");
      localStorage.removeItem("vfstr_attendance_sessions_cache");
    } catch (e) {}
    window.location.href = window.location.origin + window.location.pathname;
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#0c0e15",
            color: "#ffffff",
            padding: "24px",
            boxSizing: "border-box",
            fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif"
          }}
        >
          <div
            style={{
              maxWidth: "600px",
              width: "100%",
              background: "#181a20",
              border: "2px solid #ef4444",
              borderRadius: "0px",
              boxShadow: "8px 8px 0px #ef4444",
              padding: "32px",
              boxSizing: "border-box"
            }}
          >
            <div
              style={{
                display: "inline-block",
                padding: "4px 12px",
                background: "#ef4444",
                color: "#ffffff",
                fontWeight: 800,
                fontSize: "0.75rem",
                letterSpacing: "1px",
                textTransform: "uppercase",
                marginBottom: "16px"
              }}
            >
              System Safeguard Triggered
            </div>

            <h1
              style={{
                margin: "0 0 12px 0",
                fontSize: "1.75rem",
                fontWeight: 900,
                color: "#ffffff"
              }}
            >
              Portal Interface Encountered an Issue
            </h1>

            <p
              style={{
                margin: "0 0 24px 0",
                fontSize: "0.95rem",
                color: "#94a3b8",
                lineHeight: 1.5
              }}
            >
              The portal encountered an unexpected runtime error. You can reload the page or reset cached session data to restore standard operation.
            </p>

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "24px" }}>
              <button
                type="button"
                onClick={this.handleReload}
                style={{
                  padding: "12px 20px",
                  background: "#ffffff",
                  color: "#000000",
                  border: "2px solid #ffffff",
                  fontWeight: 800,
                  fontSize: "0.88rem",
                  cursor: "pointer",
                  boxShadow: "3px 3px 0px rgba(255,255,255,0.4)"
                }}
              >
                ↻ Reload Portal
              </button>

              <button
                type="button"
                onClick={this.handleResetAndReload}
                style={{
                  padding: "12px 20px",
                  background: "transparent",
                  color: "#ef4444",
                  border: "2px solid #ef4444",
                  fontWeight: 800,
                  fontSize: "0.88rem",
                  cursor: "pointer",
                  boxShadow: "3px 3px 0px #ef4444"
                }}
              >
                ⚠ Clear Session &amp; Fresh Login
              </button>
            </div>

            {this.state.error && (
              <details
                style={{
                  background: "#0f1117",
                  border: "1px solid #334155",
                  padding: "12px",
                  fontSize: "0.8rem",
                  color: "#cbd5e1"
                }}
              >
                <summary style={{ cursor: "pointer", fontWeight: 700, color: "#f87171" }}>
                  Diagnostic Information
                </summary>
                <pre
                  style={{
                    margin: "12px 0 0 0",
                    overflowX: "auto",
                    color: "#fca5a5",
                    fontSize: "0.75rem",
                    whiteSpace: "pre-wrap"
                  }}
                >
                  {this.state.error?.toString()}
                  {"\n"}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
