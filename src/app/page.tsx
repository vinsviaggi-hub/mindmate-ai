"use client";

import { useEffect, useState, useRef } from "react";

type Msg = { sender: "ai" | "user"; text: string };

const BMC_URL = "https://www.buymeacoffee.com/coachvins"; // <-- il tuo link

export default function Home() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      sender: "ai",
      text:
        "Ciao 👋 sono MindMate, il tuo coach motivazionale personale. Dimmi come ti senti e partiamo da lì! 💪",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [cardVisible, setCardVisible] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setCardVisible(true), 120);
    return () => clearTimeout(t);
  }, []);

  async function sendMessage(e?: React.FormEvent) {
    if (e) e.preventDefault();
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
      const aiMsg: Msg = { sender: "ai", text: data.reply || "Posso aiutarti in altro modo? 😊" };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: "Ops! Si è verificato un errore di connessione 😅" },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  // Piccolo componente Logo che usa file locale se presente, altrimenti emoji
  function Logo() {
    const [exists, setExists] = useState(false);
    useEffect(() => {
      // Tentativo veloce di verificare se esiste /logo.svg o /logo.png
      Promise.any([
        fetch("/logo.svg", { method: "HEAD" }),
        fetch("/logo.png", { method: "HEAD" }),
      ])
        .then((r) => setExists(r.ok))
        .catch(() => setExists(false));
    }, []);

    if (!exists) {
      return (
        <div aria-label="MindMate logo" style={{ fontSize: 28, lineHeight: 1 }}>
          ☁️
        </div>
      );
    }
    // Preferisci SVG se c’è
    return (
      <img
        src="/logo.svg"
        onError={(e) => ((e.currentTarget.src = "/logo.png"))}
        alt="MindMate logo"
        width={28}
        height={28}
        style={{ display: "block" }}
      />
    );
  }

  return (
    <main
      style={{
        minHeight: "100svh",
        display: "grid",
        placeItems: "center",
        padding: 16,
        background:
          "radial-gradient(1200px 600px at 50% -10%, #7fb3ff55 0%, transparent 60%), radial-gradient(900px 500px at 50% 110%, #76e6c655 0%, transparent 55%), linear-gradient(180deg, #edeaff 0%, #e9f4ff 60%, #eefaf4 100%)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 560,
          background: "linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)",
          borderRadius: 16,
          boxShadow:
            "0 1px 2px rgba(0,0,0,.05), 0 8px 20px rgba(64,112,214,.15), inset 0 0 0 1px rgba(14, 30, 64, .04)",
          padding: 18,
          opacity: cardVisible ? 1 : 0,
          transform: cardVisible ? "translateY(0)" : "translateY(10px)",
          transition: "opacity .5s ease, transform .5s ease",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 8,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              display: "grid",
              placeItems: "center",
              background:
                "linear-gradient(135deg, #ffe082 0%, #ffc400 60%, #ffb300 100%)",
              boxShadow: "inset 0 0 0 1px rgba(0,0,0,.04)",
            }}
          >
            <Logo />
          </div>

          <div style={{ display: "grid", gap: 2 }}>
            <div
              style={{
                fontWeight: 700,
                letterSpacing: 0.2,
                color: "#1d2b4d",
              }}
            >
              MindMate AI
            </div>
            <div
              style={{
                fontSize: 12,
                color: "#5a6a85",
              }}
            >
              Il tuo coach motivazionale personale
            </div>
          </div>
        </div>

        {/* Chat area */}
        <div
          style={{
            height: 300,
            overflowY: "auto",
            borderRadius: 10,
            border: "1px solid #e6eefb",
            background: "#fff",
            padding: 12,
            marginTop: 10,
            boxShadow: "inset 0 1px 0 #f6f9ff",
          }}
        >
          {messages.map((m, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: m.sender === "user" ? "flex-end" : "flex-start",
                margin: "8px 0",
              }}
            >
              <div
                style={{
                  maxWidth: "85%",
                  background:
                    m.sender === "user" ? "#1a73e8" : "#f4f7ff",
                  color: m.sender === "user" ? "#fff" : "#1d2b4d",
                  border: m.sender === "user" ? "none" : "1px solid #e6eefb",
                  padding: "8px 10px",
                  borderRadius:
                    m.sender === "user"
                      ? "12px 12px 4px 12px"
                      : "12px 12px 12px 4px",
                  fontSize: 14,
                  lineHeight: 1.4,
                  boxShadow:
                    m.sender === "user"
                      ? "0 1px 0 rgba(0,0,0,.06)"
                      : "0 1px 0 rgba(0,0,0,.02)",
                }}
              >
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ color: "#6b7a90", fontSize: 13, padding: "6px 2px" }}>
              Sto pensando…
            </div>
          )}
        </div>

        {/* Input + send */}
        <form
          onSubmit={sendMessage}
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: 8,
            marginTop: 10,
          }}
        >
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Scrivi qui…"
            aria-label="Scrivi il messaggio"
            style={{
              width: "100%",
              height: 38,
              borderRadius: 10,
              padding: "0 12px",
              border: "1px solid #dbe7ff",
              outline: "none",
              fontSize: 14,
              background: "#ffffff",
              boxShadow:
                "0 0 0 0 rgba(26,115,232,0), inset 0 1px 0 #f6f9ff",
            }}
            onFocus={(e) => {
              e.currentTarget.style.boxShadow =
                "0 0 0 3px rgba(26,115,232,.15), inset 0 1px 0 #f6f9ff";
              e.currentTarget.style.borderColor = "#b9d3ff";
            }}
            onBlur={(e) => {
              e.currentTarget.style.boxShadow =
                "0 0 0 0 rgba(26,115,232,0), inset 0 1px 0 #f6f9ff";
              e.currentTarget.style.borderColor = "#dbe7ff";
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              height: 38,
              padding: "0 14px",
              borderRadius: 10,
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              background:
                "linear-gradient(180deg, #1a73e8 0%, #1967d2 100%)",
              color: "#fff",
              fontWeight: 600,
              boxShadow: "0 1px 0 rgba(0,0,0,.06)",
            }}
          >
            {loading ? "…" : "invia"}
          </button>
        </form>

        {/* CTA + credit */}
        <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
          <a
            href={BMC_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              justifyContent: "center",
              height: 40,
              borderRadius: 10,
              background:
                "linear-gradient(135deg, #ffe082 0%, #ffc400 60%, #ffb300 100%)",
              color: "#1d2b4d",
              textDecoration: "none",
              fontWeight: 700,
              border: "1px solid #f7c948",
              boxShadow: "0 2px 0 #e2b100, 0 4px 12px rgba(255,193,7,.25)",
            }}
          >
            ☕ Buy me a coffee
          </a>

          <div
            style={{
              textAlign: "center",
              fontSize: 12,
              color: "#6b7a90",
              paddingTop: 2,
            }}
          >
            Creato da Coach Vins · MindMate AI
          </div>
        </div>
      </div>
    </main>
  );
}
