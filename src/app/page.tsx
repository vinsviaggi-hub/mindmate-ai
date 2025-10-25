"use client";

import { useEffect, useState } from "react";

type Msg = { sender: "ai" | "user"; text: string };

export default function Home() {
  const [messages, setMessages] = useState<Msg[]>([
    { sender: "ai", text: "Ciao 👋 sono MindMate, il tuo coach motivazionale. Come ti senti oggi?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [introVisible, setIntroVisible] = useState(true);

  // effetto intro breve
  useEffect(() => {
    const t = setTimeout(() => setIntroVisible(false), 500);
    return () => clearTimeout(t);
  }, []);

  async function sendMessage(e?: React.FormEvent) {
    e?.preventDefault();
    if (!input.trim() || loading) return;
    const userMsg: Msg = { sender: "user", text: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg.text }),
      });
      const data = await res.json();
      const reply: Msg = { sender: "ai", text: data.reply || "Posso aiutarti in altro modo? 💬" };
      setMessages((prev) => [...prev, reply]);
    } catch {
      setMessages((prev) => [...prev, { sender: "ai", text: "Errore di connessione 😅 Riprova tra poco." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        margin: 0,
        padding: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        // sfondo gradiente + alone verticale al centro
        background:
          "radial-gradient(1200px 400px at 50% 20%, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 60%), linear-gradient(120deg, #a78bfa 0%, #60a5fa 50%, #22d3ee 100%)",
      }}
    >
      {/* “pannelli” laterali decorativi molto soft */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(600px 400px at 10% 80%, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 70%), radial-gradient(600px 400px at 90% 20%, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0) 70%)",
        }}
      />

      <main
        style={{
          width: "min(760px, 92vw)",
          padding: "28px",
          borderRadius: 18,
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          background: "rgba(255,255,255,0.28)",
          boxShadow: "0 12px 40px rgba(0,0,0,0.18)",
          border: "1px solid rgba(255,255,255,0.45)",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 18 }}>
          <div
            style={{
              width: 40,
              height: 40,
              margin: "0 auto 8px",
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              background: "linear-gradient(135deg,#ffffff,#dbeafe)",
              border: "1px solid rgba(0,0,0,0.06)",
            }}
          >
            <span role="img" aria-label="cloud">
              ☁️
            </span>
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: 24,
              lineHeight: 1.2,
              letterSpacing: 0.3,
              color: "#0b1220",
              fontWeight: 700,
            }}
          >
            MindMate AI
          </h1>
          <p style={{ margin: "6px 0 0", color: "#1f2a44", opacity: 0.9 }}>
            Il tuo coach motivazionale personale
          </p>
        </div>

        {/* Chat box */}
        <div
          style={{
            background: "rgba(255,255,255,0.65)",
            border: "1px solid rgba(0,0,0,0.06)",
            borderRadius: 14,
            height: 360,
            overflowY: "auto",
            padding: 14,
            boxShadow: "inset 0 1px 8px rgba(0,0,0,0.04)",
          }}
        >
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 10 }}>
            {messages.map((m, i) => (
              <li
                key={i}
                style={{
                  display: "flex",
                  justifyContent: m.sender === "user" ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    maxWidth: "80%",
                    padding: "10px 12px",
                    borderRadius: 12,
                    lineHeight: 1.4,
                    fontSize: 15,
                    color: m.sender === "user" ? "#0b1220" : "#0b1220",
                    background:
                      m.sender === "user"
                        ? "linear-gradient(135deg,#dbeafe,#bfdbfe)"
                        : "linear-gradient(135deg,#f8fafc,#ffffff)",
                    border: "1px solid rgba(0,0,0,0.06)",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
                    wordBreak: "break-word",
                  }}
                >
                  {m.text}
                </div>
              </li>
            ))}
            {loading && (
              <li>
                <div
                  style={{
                    width: 56,
                    height: 26,
                    borderRadius: 12,
                    background: "linear-gradient(135deg,#f8fafc,#ffffff)",
                    border: "1px solid rgba(0,0,0,0.06)",
                    display: "grid",
                    placeItems: "center",
                    color: "#64748b",
                    fontSize: 12,
                  }}
                >
                  …
                </div>
              </li>
            )}
          </ul>
        </div>

        {/* Input + invio */}
        <form onSubmit={sendMessage} style={{ display: "flex", gap: 10, marginTop: 12 }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Scrivi qui…"
            aria-label="Scrivi qui"
            style={{
              flex: 1,
              padding: "12px 14px",
              borderRadius: 12,
              border: "1px solid rgba(0,0,0,0.08)",
              background: "rgba(255,255,255,0.92)",
              outline: "none",
              fontSize: 15,
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "12px 18px",
              borderRadius: 12,
              border: "none",
              background: loading
                ? "linear-gradient(135deg,#a5b4fc,#93c5fd)"
                : "linear-gradient(135deg,#6366f1,#06b6d4)",
              color: "#fff",
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "transform .08s ease",
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.98)")}
            onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            {loading ? "Sto pensando..." : "Invia"}
          </button>
        </form>

        {/* CTA Buy Me a Coffee */}
        <div style={{ textAlign: "center", marginTop: 14 }}>
          <a
            href="https://www.buymeacoffee.com/coachvins"
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "inline-block" }}
          >
            <img
              src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png"
              alt="Buy me a coffee"
              style={{ height: "42px", width: "152px" }}
            />
          </a>
        </div>

        {/* Footer piccolo */}
        <p
          style={{
            textAlign: "center",
            marginTop: 8,
            fontSize: 12,
            color: "#0b1220",
            opacity: 0.7,
          }}
        >
          Creato da Coach Vins • MindMate AI
        </p>
      </main>

      {/* effetto fade in al primo caricamento */}
      {introVisible && (
        <div
          aria-hidden
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(255,255,255,0.4)",
            backdropFilter: "blur(2px)",
            WebkitBackdropFilter: "blur(2px)",
            transition: "opacity .4s ease",
          }}
        />
      )}
    </div>
  );
}
