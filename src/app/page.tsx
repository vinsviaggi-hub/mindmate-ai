"use client";

import { useState } from "react";

export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { sender: "ai", text: "Ciao 👋 sono MindMate, il tuo coach motivazionale. Come ti senti oggi?" }
  ]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessage = { sender: "user", text: input };
    setMessages((prev) => [...prev, newMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });

      const data = await response.json();
      setMessages((prev) => [...prev, { sender: "ai", text: data.reply }]);
    } catch (error) {
      setMessages((prev) => [...prev, { sender: "ai", text: "Ops! Qualcosa è andato storto. Riprova tra poco." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(135deg, #a0c4ff, #bdb2ff)",
        fontFamily: "system-ui, sans-serif",
        padding: "20px",
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: "20px",
          padding: "30px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
          width: "100%",
          maxWidth: "600px",
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: "2rem", marginBottom: "10px" }}>💬 MindMate AI</h1>
        <p style={{ color: "#555", marginBottom: "20px" }}>
          Il tuo coach motivazionale personale. Scrivi qualcosa e ti risponderò!
        </p>

        <div
          style={{
            background: "#f5f5f5",
            borderRadius: "10px",
            padding: "15px",
            height: "300px",
            overflowY: "auto",
            marginBottom: "15px",
            textAlign: "left",
          }}
        >
          {messages.map((msg, index) => (
            <div
              key={index}
              style={{
                marginBottom: "10px",
                textAlign: msg.sender === "user" ? "right" : "left",
              }}
            >
              <div
                style={{
                  display: "inline-block",
                  background: msg.sender === "user" ? "#0070f3" : "#e0e0e0",
                  color: msg.sender === "user" ? "white" : "black",
                  padding: "8px 12px",
                  borderRadius: "15px",
                  maxWidth: "80%",
                }}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {loading && <p>MindMate sta scrivendo...</p>}
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Scrivi qui..."
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: "10px",
              border: "1px solid #ccc",
            }}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <button
            onClick={sendMessage}
            style={{
              backgroundColor: "#0070f3",
              color: "white",
              border: "none",
              borderRadius: "10px",
              padding: "10px 20px",
              cursor: "pointer",
            }}
          >
            Invia 🚀
          </button>
        </div>
      </div>

      <a
        href="https://www.buymeacoffee.com/"
        target="_blank"
        style={{
          marginTop: "25px",
          background: "#ffdd00",
          padding: "10px 20px",
          borderRadius: "10px",
          color: "black",
          fontWeight: "bold",
          textDecoration: "none",
          boxShadow: "0 5px 10px rgba(0,0,0,0.1)",
        }}
      >
        ☕ Buy me a coffee
      </a>
    </main>
  );
}
