"use client";

import { useEffect, useRef, useState } from "react";

type Msg = { sender: "ai" | "user"; text: string };

export default function Home() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      sender: "ai",
      text:
        "Ciao 👋 sono MindMate, il tuo coach motivazionale personale. Dimmi come ti senti e partiamo da lì.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

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
      const reply =
        (data?.reply as string) || "Posso aiutarti in altro modo? 🙂";
      setMessages((prev) => [...prev, { sender: "ai", text: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: "Ops, si è verificato un errore. Riproviamo! ⚙️" },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="wrap">
      <div className="card">
        <header className="header">
          <div className="logo">💬</div>
          <div className="titoli">
            <h1>MindMate AI</h1>
            <p>Il tuo coach motivazionale personale</p>
          </div>
        </header>

        <div className="chat">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`bubble ${m.sender === "ai" ? "ai" : "user"}`}
            >
              {m.text}
            </div>
          ))}

          {loading && <div className="typing">Sto pensando…</div>}

          <div ref={chatEndRef} />
        </div>

        <form className="inputRow" onSubmit={sendMessage}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Scrivi qui…"
            aria-label="Scrivi un messaggio"
          />
          <button type="submit" disabled={loading}>
            {loading ? "…" : "Invia"}
          </button>
        </form>

        <a
          className="coffee"
          href="https://www.buymeacoffee.com/coachvins"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Sostieni il progetto su Buy me a coffee"
        >
          ☕ Buy me a coffee
        </a>

        <footer className="footer">
          Creato da <strong>Coach Vins</strong> · <span>MindMate AI</span>
        </footer>
      </div>

      {/* STILI */}
      <style jsx>{`
        /* Wrapper: sfondo gradiente animato */
        .wrap {
          min-height: 100dvh;
          display: grid;
          place-items: center;
          padding: 32px 16px;
          background: linear-gradient(120deg, #c6d8ff, #e8d7ff, #dff7ff);
          background-size: 200% 200%;
          animation: drift 18s ease-in-out infinite;
        }
        @keyframes drift {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }

        /* Card glass */
        .card {
          width: min(680px, 100%);
          background: rgba(255, 255, 255, 0.6);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.6);
          border-radius: 18px;
          box-shadow: 0 12px 40px rgba(24, 39, 75, 0.18);
          padding: 18px 18px 12px;
        }

        .header {
          display: flex;
          gap: 12px;
          align-items: center;
          padding: 6px 6px 2px;
        }
        .logo {
          width: 36px;
          height: 36px;
          display: grid;
          place-items: center;
          border-radius: 10px;
          background: #ffe28a;
          border: 1px solid #f6d76b;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
        }
        .titoli h1 {
          margin: 0;
          font-size: 18px;
          line-height: 1.1;
        }
        .titoli p {
          margin: 2px 0 0;
          font-size: 12px;
          color: #4b5563;
        }

        /* Area chat */
        .chat {
          margin-top: 12px;
          height: 360px;
          overflow: auto;
          padding: 12px;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.55);
          border: 1px solid rgba(255, 255, 255, 0.7);
        }
        .bubble {
          width: fit-content;
          max-width: 100%;
          padding: 10px 12px;
          margin: 6px 0;
          border-radius: 14px;
          line-height: 1.4;
          word-wrap: break-word;
          white-space: pre-wrap;
        }
        .bubble.ai {
          background: #ffffff;
          border: 1px solid #eef1f6;
          color: #111827;
          box-shadow: 0 2px 10px rgba(17, 24, 39, 0.05);
        }
        .bubble.user {
          margin-left: auto;
          background: #e8f0ff;
          border: 1px solid #d5e3ff;
          color: #0f172a;
        }
        .typing {
          font-size: 13px;
          color: #6b7280;
          padding: 6px 8px;
        }

        /* Input + invio */
        .inputRow {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 8px;
          margin: 12px 6px 8px;
        }
        .inputRow input {
          height: 42px;
          border-radius: 10px;
          border: 1px solid #d9e1f2;
          background: #fff;
          padding: 0 12px;
          outline: none;
          font-size: 14px;
        }
        .inputRow input:focus {
          border-color: #8cb4ff;
          box-shadow: 0 0 0 3px rgba(140, 180, 255, 0.25);
        }
        .inputRow button {
          min-width: 70px;
          padding: 0 12px;
          height: 42px;
          border-radius: 10px;
          border: 0;
          background: #2563eb;
          color: #fff;
          font-weight: 600;
          cursor: pointer;
        }
        .inputRow button:disabled {
          opacity: 0.65;
          cursor: default;
        }

        /* Coffee */
        .coffee {
          display: block;
          text-align: center;
          margin: 6px auto 0;
          width: 210px;
          height: 40px;
          line-height: 40px;
          border-radius: 10px;
          background: #ffd143;
          border: 1px solid #f2bf2c;
          color: #1f2937;
          text-decoration: none;
          font-weight: 700;
          box-shadow: 0 6px 16px rgba(255, 209, 67, 0.35);
        }

        .footer {
          text-align: center;
          font-size: 12px;
          color: #6b7280;
          margin-top: 8px;
          padding-bottom: 6px;
        }

        @media (max-width: 520px) {
          .chat {
            height: 300px;
          }
        }
      `}</style>
    </div>
  );
}
