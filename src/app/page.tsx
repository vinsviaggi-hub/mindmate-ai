"use client";

import { useEffect, useRef, useState } from "react";

type Msg = { sender: "ai" | "user"; text: string };

export default function Home() {
  // Stato chat
  const [messages, setMessages] = useState<Msg[]>([
    { sender: "ai", text: "Ciao 👋 sono MindMate, il tuo coach motivazionale. Come ti senti oggi?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  // Auto–scroll all’ultimo messaggio
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Invia messaggio
  async function sendMessage(e?: React.FormEvent<HTMLFormElement>) {
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
      const reply = (data?.reply as string) || "Posso aiutarti in altro modo? 💡";

      setMessages((prev) => [...prev, { sender: "ai", text: reply }]);
    } catch (_) {
      setMessages((prev) => [...prev, { sender: "ai", text: "Errore di connessione 😅 Riprova tra poco." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page">
      {/* Decorazioni ai lati */}
      <div className="orb orb-left" aria-hidden />
      <div className="orb orb-right" aria-hidden />

      {/* Card chat */}
      <section className="card" role="region" aria-label="MindMate AI chat">
        <header className="card__head">
          <div className="logo">💭</div>
          <div className="titles">
            <h1>MindMate AI</h1>
            <p>Il tuo coach motivazionale personale</p>
          </div>
        </header>

        <div className="chat" role="log" aria-live="polite">
          {messages.map((m, i) => (
            <div key={i} className={`row ${m.sender}`}>
              <div className="avatar" aria-hidden>
                {m.sender === "ai" ? "✨" : "🙂"}
              </div>
              <div className="bubble">{m.text}</div>
            </div>
          ))}

          {loading && (
            <div className="row ai">
              <div className="avatar" aria-hidden>✨</div>
              <div className="bubble typing">
                <span className="dot" />
                <span className="dot" />
                <span className="dot" />
              </div>
            </div>
          )}

          <div ref={endRef} />
        </div>

        <form className="form" onSubmit={sendMessage}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Scrivi qui…"
            aria-label="Scrivi il tuo messaggio"
            disabled={loading}
          />
          <button type="submit" disabled={loading}>
            {loading ? "Invio…" : "Invia"}
          </button>
        </form>

        <a
          className="coffee"
          href="https://www.buymeacoffee.com/coachvins"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Sostieni il progetto su Buy Me a Coffee"
        >
          ☕ Buy me a coffee
        </a>

        <footer className="foot">
          Creato da <strong>Coach Vins</strong> · MindMate AI
        </footer>
      </section>

      {/* STILI */}
      <style jsx global>{`
        :root {
          --bg1: #a78bfa; /* viola */
          --bg2: #60a5fa; /* azzurro */
          --card: #ffffffee;
          --border: #e8e8ef;
          --text: #0f172a;
          --muted: #6b7280;
          --ai: #eef2ff;
          --user: #ecfeff;
          --btn: #2563eb;
          --btnText: #fff;
          --shadow: 0 20px 60px rgba(15, 23, 42, 0.18);
        }

        html, body, .page {
          height: 100%;
        }

        body {
          margin: 0;
          color: var(--text);
          font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue",
            Arial, "Apple Color Emoji", "Segoe UI Emoji";
          background: radial-gradient(1200px 700px at 50% -10%, rgba(255,255,255,0.45), transparent 60%),
                      linear-gradient(120deg, var(--bg1), var(--bg2));
          animation: bgmove 18s ease-in-out infinite alternate;
          background-attachment: fixed;
        }

        @keyframes bgmove {
          0%   { background-position: 0% 0%, 0% 0%; }
          100% { background-position: 30% 10%, 100% 100%; }
        }

        .page {
          display: grid;
          place-items: center;
          padding: 24px;
          position: relative;
          overflow: hidden;
        }

        /* Orbs decorativi */
        .orb {
          position: absolute;
          width: 38vmax;
          height: 38vmax;
          border-radius: 50%;
          filter: blur(60px) saturate(120%);
          opacity: 0.45;
          pointer-events: none;
        }
        .orb-left {
          left: -12vmax;
          top: 8vmax;
          background: radial-gradient(circle at 30% 30%, #8b5cf6, transparent 60%),
                      radial-gradient(circle at 70% 70%, #22d3ee, transparent 60%);
          animation: floatL 22s ease-in-out infinite;
        }
        .orb-right {
          right: -12vmax;
          bottom: -6vmax;
          background: radial-gradient(circle at 40% 40%, #60a5fa, transparent 55%),
                      radial-gradient(circle at 70% 70%, #34d399, transparent 60%);
          animation: floatR 26s ease-in-out infinite;
        }
        @keyframes floatL { 50% { transform: translateY(-20px) translateX(10px); } }
        @keyframes floatR { 50% { transform: translateY(24px) translateX(-8px); } }

        /* Card */
        .card {
          width: 100%;
          max-width: 720px;
          background: var(--card);
          backdrop-filter: blur(8px);
          box-shadow: var(--shadow);
          border: 1px solid var(--border);
          border-radius: 22px;
          padding: 18px 18px 12px;
        }

        .card__head {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 6px 6px 10px;
          border-bottom: 1px solid var(--border);
        }
        .logo {
          width: 34px; height: 34px;
          display: grid; place-items: center;
          border-radius: 10px;
          background: linear-gradient(135deg, #fef3c7, #fde68a);
          border: 1px solid #facc15;
        }
        .titles h1 {
          margin: 0; font-size: 18px; line-height: 1.2;
        }
        .titles p {
          margin: 2px 0 0 0; font-size: 13px; color: var(--muted);
        }

        /* Chat */
        .chat {
          height: min(54vh, 460px);
          overflow: auto;
          padding: 12px 6px 8px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .row {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          max-width: 85%;
        }
        .row.user { margin-left: auto; justify-content: flex-end; }
        .row.user .bubble { background: var(--user); border-color: #cffafe; }
        .row.ai .bubble { background: var(--ai); border-color: #ddd6fe; }

        .avatar {
          width: 28px; height: 28px;
          border-radius: 50%;
          display: grid; place-items: center;
          background: #ffffff;
          border: 1px solid var(--border);
          flex: 0 0 28px;
        }

        .bubble {
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 10px 12px;
          line-height: 1.45;
          word-break: break-word;
          box-shadow: 0 2px 0 rgba(0,0,0,0.03);
        }

        /* Indicatori di digitazione */
        .typing {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #9ca3af;
          animation: blink 1.2s infinite;
        }
        .dot:nth-child(2){ animation-delay: .15s; }
        .dot:nth-child(3){ animation-delay: .3s; }
        @keyframes blink {
          0%, 80%, 100% { opacity: .2; transform: translateY(0); }
          40% { opacity: 1; transform: translateY(-2px); }
        }

        /* Form */
        .form {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 10px;
          padding: 8px 4px 10px;
        }
        .form input {
          height: 42px;
          border-radius: 10px;
          border: 1px solid var(--border);
          padding: 0 12px;
          outline: none;
        }
        .form input:focus { box-shadow: 0 0 0 3px rgba(37,99,235,.15); }
        .form button {
          height: 42px;
          min-width: 86px;
          border: 0;
          border-radius: 10px;
          background: var(--btn);
          color: var(--btnText);
          font-weight: 600;
          cursor: pointer;
        }
        .form button[disabled] { opacity: .7; cursor: default; }

        /* Coffee */
        .coffee {
          display: inline-block;
          margin: 4px auto 2px;
          padding: 10px 14px;
          border-radius: 10px;
          border: 1px solid #facc15;
          background: linear-gradient(180deg, #fde68a, #fbbf24);
          color: #3b2f0b;
          font-weight: 700;
          text-decoration: none;
          text-align: center;
          box-shadow: 0 6px 0 #d97706;
        }
        .coffee:active { transform: translateY(1px); box-shadow: 0 5px 0 #d97706; }

        .foot {
          text-align: center;
          color: var(--muted);
          font-size: 12px;
          padding-top: 8px;
        }

        /* Mobile */
        @media (max-width: 600px) {
          .card { padding: 14px 14px 10px; border-radius: 18px; }
          .chat { height: 48vh; }
          .row { max-width: 100%; }
          .orb-left, .orb-right { display: none; }
        }
      `}</style>
    </main>
  );
}
