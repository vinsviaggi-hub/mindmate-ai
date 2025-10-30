"use client";

import { useState } from "react";
import supabase from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const signInMagic = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    setLoading(false);
    if (error) alert(error.message);
    else setSent(true);
  };

  return (
    <main style={{ maxWidth: 420, margin: "80px auto", padding: 20 }}>
      <h1>Accedi a MindMate AI</h1>
      {sent ? (
        <p>Controlla la tua email per il link 🔗</p>
      ) : (
        <form onSubmit={signInMagic}>
          <input
            type="email"
            required
            placeholder="tua@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%", padding: 10, marginBottom: 10 }}
          />
          <button
            disabled={loading}
            type="submit"
            style={{
              width: "100%",
              padding: 10,
              background: "#2563eb",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            {loading ? "Invio..." : "Entra con Magic Link ✨"}
          </button>
        </form>
      )}
    </main>
  );
}
