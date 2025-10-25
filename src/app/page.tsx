"use client";
import { useState, useEffect } from "react";

export default function Home() {
  const [messages, setMessages] = useState([
    { sender: "ai", text: "Ciao 👋 sono MindMate, il tuo coach motivazionale. Come ti senti oggi?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [introVisible, setIntroVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setIntroVisible(true), 300);
  }, []);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMessage = { sender: "user", text: input };
    setMessages([...messages, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });
      const data = await res.json();
      const aiMessage = { sender: "ai", text: data.reply || "Posso aiutarti in altro modo?" };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      setMessages((prev) => [...prev, { sender: "ai", text: "Errore di connessione 💭" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        background: "white",
        maxWidth: "440px",
        width: "100%",
        borderRadius: "20px",
        boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        minHeight: "520px",
        opacity: introVisible ? 1 : 0,
        transform: introVisible ? "translateY(0)" : "translateY(20px)",
        transition: "all 0.8s ease",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <img src="/globo.svg" alt="MindMate Logo" style={{ width: "60px", marginBottom: "10px" }} />
        <h2 style={{ color: "#4a67ff", marginBottom: "5px" }}>MindMate AI</h2>
        <p style={{ color: "#777", fontSize: "14px", marginTop: 0 }}>
          Il tuo coach motivazionale personale 💬
        </p>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          border: "1px solid #ddd",
          borderRadius: "10px",
          padding: "10px",
          background: "#f9f9f9",
        }}
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              textAlign: msg.sender === "user" ? "right" : "left",
              margin: "8px 0",
            }}
          >
            <span
              style={{
                display: "inline-block",
                background: msg.sender === "user" ? "#b7c8ff" : "#e8e8e8",
                color: "#333",
                padding: "8px 12px",
                borderRadius: "14px",
                maxWidth: "80%",
              }}
            >
              {msg.text}
            </span>
          </div>
        ))}
        {loading && (
          <div style={{ textAlign: "left", color: "#777", fontStyle: "italic" }}>
            MindMate sta scrivendo...
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: "10px" }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Scrivi qui..."
          style={{
            flex: 1,
            padding: "10px",
            borderRadius: "10px",
            border: "1px solid #ccc",
          }}
        />
        <button
          onClick={sendMessage}
          style={{
            background: "#4a67ff",
            color: "white",
            border: "none",
            borderRadius: "10px",
            padding: "10px 16px",
            cursor: "pointer",
          }}
        >
          Invia
        </button>
      </div>
    </div>
  );
}
