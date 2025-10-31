"use client";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function LoginPage() {
  const supabase = supabaseBrowser();
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
    <main style={{ maxWidth: 420, margin: "80px auto", padding: 24 }}>
      <h1>Accedi a MindMate AI</h1>
      {sent ? (
        <p>Controlla la tua email per il link di accesso.</p>
      ) : (
        <form onSubmit={signInMagic}>
          <input
            type="email"
            required
            placeholder="tua@email.it"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%", padding: 10, marginBottom: 8 }}
          />
          <button disabled={loading} type="submit" style={{ padding: "10px 14px", width: "100%" }}>
            {loading ? "Invio..." : "Entra con Magic Link"}
          </button>
        </form>
      )}
    </main>
  );
}
