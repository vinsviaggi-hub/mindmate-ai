"use client";

import { useEffect, useRef, useState } from "react";

type Msg = { sender: "ai" | "user"; text: string };

export default function Home() {
  const [messages, setMessages] = useState<Msg[]>([
    { sender: "ai", text: "Ciao 👋 sono MindMate, il tuo coach motivazionale. Come ti senti oggi?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [introVisible, setIntroVisible] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // micro fade-in del box
  useEffect(() => {
    const t = setTimeout(() => setIntroVisible(true), 300);
    return () => clearTimeout(t);
  }, []);

  // autoscroll alla fine dei messaggi
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Msg = { sender: "user", text: input.trim() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg.text }),
      });

      const data = await res.json();
      const aiMsg: Msg = { sender: "ai", text: data?.reply || "Posso aiutarti in altro modo? 💡" };
      setMessages((m) => [...m, aiMsg]);
    } catch {
      setMessages((m) => [...m, { sender: "ai", text: "Errore di connessione 😅" }]);
    } finally {
      setLoading(false);
    }
  };

  const handleEnter: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        background: "linear-gradient(135deg, #c6d6ff 0%, #b7b8ff 50%, #b9e3ff 100%)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          opacity: introVisible ? 1 : 0,
          transform: introVisible ? "translateY(0px)" : "translateY(8px)",
          transition: "opacity .35s ease, transform .35s ease",
        }}
      >
        {/* Card */}
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            boxShadow:
              "0 10px 25px rgba(0,0,0,.08), 0 2px 8px rgba(0,0,0,.04)",
            padding: 18,
          }}
        >
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 8 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#eef2ff",
                color: "#4f46e5",
                fontWeight: 700,
                marginBottom: 6,
              }}
              aria-hidden
            >
              💬
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: "#111827" }}>
              MindMate AI
            </h1>
            <p style={{ margin: "6px 0 0", color: "#6b7280", fontSize: 13 }}>
              Il tuo coach motivazionale personale
            </p>
          </div>

          {/* Chat area */}
          <div
            ref={scrollRef}
            style={{
              height: 240,
              overflow: "auto",
              background: "#f9fafb",
              border: "1px solid #eef2f7",
              borderRadius: 10,
              padding: 10,
            }}
          >
            {messages.map((m, i) => (
              <div key={i} style={{ margin: "8px 0", display: "flex", justifyContent: m.sender === "user" ? "flex-end" : "flex-start" }}>
                <div
                  style={{
                    maxWidth: "85%",
                    padding: "8px 11px",
                    borderRadius: 12,
                    fontSize: 14,
                    lineHeight: 1.35,
                    whiteSpace: "pre-wrap",
                    background: m.sender === "user" ? "#e0e7ff" : "#fff",
                    border: "1px solid #e5e7eb",
                    color: "#111827",
                  }}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ color: "#6b7280", fontSize: 13, padding: "6px 2px" }}>
                MindMate sta scrivendo…
              </div>
            )}
          </div>

          {/* Input row */}
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleEnter}
              placeholder="Scrivi qui…"
              style={{
                flex: 1,
                height: 40,
                borderRadius: 10,
                border: "1px solid #e5e7eb",
                padding: "0 12px",
                outline: "none",
                fontSize: 14,
              }}
            />
            <button
              onClick={sendMessage}
              disabled={loading}
              style={{
                height: 40,
                padding: "0 16px",
                borderRadius: 10,
                border: "none",
                background: loading ? "#a5b4fc" : "#4f46e5",
                color: "#fff",
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
              }}
              aria-label="Invia"
            >
              {loading ? "…" : "Invia"}
            </button>
          </div>
        </div>

        {/* Buy me a coffee */}
        <div style={{ display: "flex", justifyContent: "center", marginTop: 14 }}>
          <a
            href="https://www.buymeacoffee.com/coachvins"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 16px",
              borderRadius: 999,
              border: "1px solid #facc15",
              background: "#fef08a",
              textDecoration: "none",
              fontWeight: 800,
              color: "#1f2937",
              boxShadow: "0 6px 14px rgba(250, 204, 21, .35)",
            }}
          >
            <span aria-hidden>☕</span>
            <span>Buy me a coffee</span>
          </a>
        </div>

        {/* Footer mini */}
        <p style={{ textAlign: "center", color: "#6b7280", fontSize: 12, marginTop: 8 }}>
          Creato da <strong>Coach Vins</strong> • MindMate AI
        </p>
      </div>
    </div>
  );
}
