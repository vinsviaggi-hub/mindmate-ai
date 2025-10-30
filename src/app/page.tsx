"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { getLS, setLS } from "@/lib/utils";
import { supabaseBrowser } from "@/lib/supabase/client";
import UserBar from "./UserBar";
import Link from "next/link";

type Mood = "felice" | "ok" | "stanco" | "triste";
type Msg = { role: "user" | "assistant"; text: string };

function todayKey() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function pickTodayChallenges(seed: string) {
  // sfide esempio — puoi cambiarle a piacere
  return ["5 minuti di respirazione", "Scrivi 3 cose positive", "Fai 10 squat"];
}

export default function Home() {
  const supabase = supabaseBrowser();

  const TABS = ["Chat", "Diario", "Sfide", "Progressi"] as const;
  type Tab = (typeof TABS)[number];
  const [tab, setTab] = useState<Tab>("Chat");

  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", text: "Ciao! Sono MindMate 💬 Come ti senti oggi?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState<string>("");
  const chatRef = useRef<HTMLDivElement>(null);

  const [points, setPoints] = useState<number>(() => getLS("lm_points", 0));
  const [streak, setStreak] = useState<number>(0);
  const [rewardOpen, setRewardOpen] = useState(false);

  const [moodLog, setMoodLog] = useState<Record<string, Mood>>(() =>
    getLS("lm_moodLog", {})
  );
  const [journal, setJournal] = useState<Record<string, string>>(() =>
    getLS("lm_journal", {})
  );

  const today = todayKey();
  const todayChallenges = useMemo(() => pickTodayChallenges(today), [today]);
  const [doneChallenges, setDoneChallenges] = useState<Record<string, number[]>>(
    () => getLS("lm_challengesDone", {})
  );

  /** AUTO SCROLL CHAT **/
  useEffect(() => {
    chatRef.current?.scrollTo({
      top: chatRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  /** LOAD MESSAGES FROM SUPABASE (opzionale) **/
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: true })
        .limit(30);

      if (error) {
        console.error("Errore Supabase:", error);
        return;
      }

      if (data && data.length > 0) {
        setMessages([
          { role: "assistant", text: "Bentornato 💬 Riprendiamo da dove avevamo lasciato!" },
          ...(data.map((m: any) => ({ role: m.role, text: m.text })) as Msg[]),
        ]);
      }
    })();
  }, [supabase]);

  /** DAILY REWARD (solo locale per fallback) **/
  useEffect(() => {
    const now = new Date();
    const todayOnly = now.toISOString().slice(0, 10);
    const lastOpen = localStorage.getItem("lm_lastOpen");
    const lastClaim = localStorage.getItem("lm_lastClaim");
    let s = parseInt(localStorage.getItem("lm_streak") || "0");

    if (!lastOpen) s = 1;
    else {
      const diffDays = Math.round(
        (new Date(todayOnly).getTime() - new Date(lastOpen).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      if (diffDays === 1) s += 1;
      else if (diffDays > 1) s = 1;
    }

    localStorage.setItem("lm_lastOpen", todayOnly);
    localStorage.setItem("lm_streak", String(s));
    setStreak(s);

    const todayStr = new Date().toDateString();
    if (lastClaim !== todayStr) {
      const newPts = (points ?? 0) + 10;
      setPoints(newPts);
      setLS("lm_points", newPts);
      localStorage.setItem("lm_lastClaim", todayStr);
      setRewardOpen(true);
    }
  }, []);

  /** PERSISTENZA **/
  useEffect(() => setLS("lm_points", points), [points]);
  useEffect(() => setLS("lm_moodLog", moodLog), [moodLog]);
  useEffect(() => setLS("lm_journal", journal), [journal]);
  useEffect(() => setLS("lm_challengesDone", doneChallenges), [doneChallenges]);

  /** CHAT SEND **/
  async function sendMessage(e?: React.FormEvent) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      const reply = data.reply as string;
      setOutput(reply);
      setMessages((m) => [...m, { role: "assistant", text: reply }]);
    } catch {
      setOutput("Errore durante la richiesta 😞");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 700, margin: "40px auto", textAlign: "center" }}>
      {/* Link di accesso in alto */}
      <div style={{ textAlign: "right", marginBottom: "1rem" }}>
        <Link
          href="/login"
          style={{
            color: "#0070f3",
            fontWeight: "bold",
            textDecoration: "none",
            padding: "6px 12px",
            border: "1px solid #0070f3",
            borderRadius: "8px",
          }}
        >
          Accedi
        </Link>
      </div>

      {/* Barra utente: login + check-in */}
      <UserBar />

      <h1>💭 MindMate AI</h1>
      <p>Il tuo coach motivazionale. Scrivi e ti rispondo!</p>

      {/* Chat log */}
      <div ref={chatRef} style={styles.chatBox}>
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              ...styles.bubble,
              ...(m.role === "assistant" ? styles.bubbleAI : styles.bubbleUser),
              margin: m.role === "assistant" ? "8px 0 8px auto" : "8px auto 8px 0",
            }}
          >
            {m.text}
          </div>
        ))}
        {loading && <div style={{ ...styles.bubble, ...styles.bubbleAI }}>Sto pensando…</div>}
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} style={{ marginTop: 10 }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={3}
          placeholder="Scrivi qui..."
          style={{ width: "100%", padding: 10 }}
        />
        <button
          type="submit"
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
      </form>

      {/* Ultima risposta “in evidenza” */}
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
    </main>
  );
}

/** ─────────────────────── STILI ─────────────────────── */
const styles: Record<string, React.CSSProperties> = {
  chatBox: {
    height: 360,
    overflow: "auto",
    padding: 12,
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    marginBottom: 10,
    background: "#fff",
  },
  bubble: {
    maxWidth: "85%",
    padding: "10px 12px",
    borderRadius: 12,
    lineHeight: 1.45,
  },
  bubbleAI: { background: "#f1f5f9" },
  bubbleUser: { background: "#e0f2fe" },
};
