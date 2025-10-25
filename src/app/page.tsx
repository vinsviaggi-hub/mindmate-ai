"use client";

import { useEffect, useRef, useState } from "react";

/** ─── CONFIG ─────────────────────────────────────────────────────────── */
const BMC_URL = "https://www.buymeacoffee.com/coachvins"; // ← il tuo link
const BRAND = "MindMate AI";
const TAGLINE = "Il tuo coach motivazionale personale";
/** ────────────────────────────────────────────────────────────────────── */

type Msg = { sender: "ai" | "user"; text: string };

export default function Home() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      sender: "ai",
      text:
        "Ciao 👋 sono MindMate, il tuo coach motivazionale personale. Dimmi come ti senti e partiamo da lì!",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // autoscroll all’ultimo messaggio
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function sendMessage(e?: React.FormEvent) {
    e?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMsg: Msg = { sender: "user", text: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });

      const data = await res.json();
      const aiText = (data?.reply as string) || "Posso aiutarti in altro modo? 🙂";
      setMessages((prev) => [...prev, { sender: "ai", text: aiText }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: "Ops, c’è stato un problema di connessione 🛠️ Riproviamo!" },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={styles.page}>
      {/* sfondo décor */}
      <div style={styles.bgLayer} aria-hidden />

      {/* contenitore card */}
      <section style={styles.card} aria-label={`${BRAND} – ${TAGLINE}`}>
        {/* header brand */}
        <header style={styles.header}>
          <div style={styles.logoWrap} aria-hidden>
            <div style={styles.logoDot} />
            <div style={styles.logoShine} />
          </div>
          <div>
            <h1 style={styles.brand}>{BRAND}</h1>
            <p style={styles.tagline}>{TAGLINE}</p>
          </div>
        </header>

        {/* chat */}
        <div ref={listRef} style={styles.chatArea} role="log" aria-live="polite">
          {messages.map((m, i) => (
            <div
              key={i}
              style={{
                ...styles.bubble,
                ...(m.sender === "user" ? styles.userBubble : styles.aiBubble),
              }}
            >
              {m.text}
            </div>
          ))}

          {loading && (
            <div style={{ ...styles.bubble, ...styles.aiBubble, opacity: 0.8 }}>
              <span style={styles.dot} /> <span style={styles.dot} /> <span style={styles.dot} />
            </div>
          )}
        </div>

        {/* input */}
        <form onSubmit={sendMessage} style={styles.inputRow} aria-label="Invia un messaggio">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Scrivi qui…"
            aria-label="Scrivi qui"
            style={styles.input}
          />
          <button type="submit" style={styles.primaryBtn} disabled={loading}>
            {loading ? "Sto pensando…" : "Invia"}
          </button>
        </form>

        {/* CTA monetizzazione */}
        <a
          href={BMC_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={styles.bmcBtn}
          aria-label="Sostieni il progetto su Buy me a coffee"
        >
          <span role="img" aria-hidden>
            ☕
          </span>{" "}
          Buy me a coffee
        </a>

        <footer style={styles.footer}>Creato da Coach Vins • MindMate AI</footer>
      </section>
    </main>
  );
}

/* ───────────────────────── STILI INLINE ───────────────────────── */
const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100svh",
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial',
    color: "#0f172a",
    position: "relative",
    background:
      "radial-gradient(60% 60% at 50% 0%, #e9eaff 0%, #eef2ff 30%, #f8fafc 60%, #ffffff 100%)",
    display: "grid",
    placeItems: "center",
    padding: "24px",
  },
  bgLayer: {
    position: "absolute",
    inset: 0,
    background:
      "radial-gradient(800px 400px at 50% 20%, rgba(59,130,246,.12), transparent 60%), radial-gradient(600px 300px at 80% 90%, rgba(99,102,241,.12), transparent 60%)",
    pointerEvents: "none",
  },
  card: {
    position: "relative",
    width: "100%",
    maxWidth: 720,
    background: "rgba(255,255,255,.9)",
    backdropFilter: "saturate(1.2) blur(6px)",
    borderRadius: 20,
    boxShadow:
      "0 10px 25px rgba(2,6,23,.06), 0 3px 10px rgba(2,6,23,.06), inset 0 1px 0 rgba(255,255,255,.6)",
    padding: 20,
  },
  header: {
    display: "flex",
    gap: 12,
    alignItems: "center",
    marginBottom: 10,
  },
  logoWrap: {
    position: "relative",
    width: 40,
    height: 40,
    borderRadius: "50%",
    background: "linear-gradient(180deg,#ffe08a,#ffcc4d)",
    boxShadow: "0 4px 10px rgba(0,0,0,.08) inset, 0 2px 6px rgba(0,0,0,.08)",
  },
  logoDot: {
    position: "absolute",
    top: 11,
    left: 18,
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "#fff",
    opacity: 0.9,
  },
  logoShine: {
    position: "absolute",
    inset: 0,
    borderRadius: "50%",
    background:
      "radial-gradient(40% 40% at 25% 25%, rgba(255,255,255,.8), rgba(255,255,255,0) 60%)",
  },
  brand: {
    fontSize: 18,
    fontWeight: 800,
    letterSpacing: 0.2,
    margin: 0,
  },
  tagline: { margin: 0, fontSize: 12, color: "#475569" },

  chatArea: {
    marginTop: 8,
    background: "#ffffff",
    borderRadius: 14,
    border: "1px solid #e5e7eb",
    height: 360,
    padding: 12,
    overflow: "auto",
  },
  bubble: {
    maxWidth: "82%",
    padding: "10px 12px",
    borderRadius: 12,
    fontSize: 14.5,
    lineHeight: 1.5,
    margin: "6px 0",
    wordBreak: "break-word",
    boxShadow: "0 1px 0 rgba(0,0,0,.04)",
  },
  aiBubble: {
    background: "#f1f5f9",
    color: "#0f172a",
    borderTopLeftRadius: 6,
  },
  userBubble: {
    background: "#e0f2fe",
    color: "#0c4a6e",
    marginLeft: "auto",
    borderTopRightRadius: 6,
  },
  dot: {
    display: "inline-block",
    width: 6,
    height: 6,
    marginRight: 6,
    borderRadius: "50%",
    background: "#94a3b8",
    animation: "blink 1.1s infinite ease-in-out",
  },

  inputRow: {
    display: "grid",
    gridTemplateColumns: "1fr auto",
    gap: 10,
    marginTop: 12,
  },
  input: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    outline: "none",
    fontSize: 14.5,
    background: "#fff",
  },
  primaryBtn: {
    padding: "12px 16px",
    border: "none",
    borderRadius: 12,
    background: "#2563eb",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
  },

  bmcBtn: {
    marginTop: 10,
    display: "inline-block",
    width: "100%",
    textAlign: "center",
    textDecoration: "none",
    background: "#ffc107",
    color: "#111827",
    fontWeight: 800,
    padding: "12px 16px",
    borderRadius: 12,
    boxShadow: "0 2px 0 rgba(0,0,0,.06) inset",
  },

  footer: {
    textAlign: "center",
    fontSize: 12,
    color: "#64748b",
    marginTop: 8,
  },
};
