"use client";

import { useState } from "react";

export default function Home() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function askAI() {
    if (!input.trim()) return;
    setLoading(true);
    setOutput(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });

      const data = await res.json();
      setOutput(data.reply);
    } catch {
      setOutput("Errore durante la richiesta 😞");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 700, margin: "40px auto", textAlign: "center" }}>
      <h1>💭 MindMate AI</h1>
      <p>Il tuo coach motivazionale. Scrivi e ti rispondo!</p>

      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        rows={4}
        placeholder="Scrivi qui..."
        style={{ width: "100%", padding: 10 }}
      />

      <button
        onClick={askAI}
        disabled={loading}
        style={{
          marginTop: 10,
          padding: "10px 20px",
          background: "#0070f3",
          color: "#fff",
          border: "none",
          borderRadius: 5,
          cursor: "pointer",
        }}
      >
        {loading ? "Sto pensando..." : "Invia 💬"}
      </button>

      {output && (
        <div
          style={{
            marginTop: 20,
            padding: 10,
            border: "1px solid #ccc",
            borderRadius: 5,
          }}
        >
          <strong>Risposta:</strong>
          <p>{output}</p>
        </div>
      )}
<div style={{ textAlign: "center", marginTop: "30px" }}>
  <a 
    href="https://www.buymeacoffee.com/coachvins" 
    target="_blank" 
    rel="noopener noreferrer"
  >
    <img 
      src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" 
      alt="Offrimi un caffè" 
      style={{ height: "60px", width: "217px" }}
    />
  </a>
</div></main>
  );
}
