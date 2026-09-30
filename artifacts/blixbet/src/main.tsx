import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

function logClientError(message: string, stack?: string, context?: Record<string, unknown>) {
  const token = localStorage.getItem("blixbet_token");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  fetch("/api/errors/log", {
    method: "POST",
    headers,
    body: JSON.stringify({
      message,
      stack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      context,
    }),
  }).catch(() => {});
}

window.addEventListener("error", (e) => {
  console.error("[GlobalError]", e.message, e.error);
  logClientError(e.message, e.error?.stack, { filename: e.filename, lineno: e.lineno, colno: e.colno });
});

window.addEventListener("unhandledrejection", (e) => {
  const reason = e.reason;
  if (reason instanceof DOMException && reason.name === "AbortError") { e.preventDefault(); return; }
  if (reason instanceof Error && reason.name === "AbortError") { e.preventDefault(); return; }
  const msg = String(reason?.message ?? reason ?? "Unhandled rejection");
  if (msg.includes("signal is aborted") || msg.includes("AbortError")) { e.preventDefault(); return; }
  const message = reason instanceof Error ? reason.message : String(reason ?? "Unhandled rejection");
  const stack = reason instanceof Error ? reason.stack : undefined;
  console.error("[UnhandledRejection]", message);
  logClientError(message, stack);
  if (!(reason instanceof Error)) {
    e.preventDefault();
  }
});

createRoot(document.getElementById("root")!).render(<App />);
