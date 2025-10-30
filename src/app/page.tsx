"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { getLS, setLS } from "@/lib/utils";
import { supabaseBrowser } from "@/lib/supabase/client";
import UserBar from "./UserBar";

/* ───────────── Types ───────────── */
type Mood = "felice" | "ok" | "stanco" | "triste";
type Msg = { role: "user" | "assistant"; text: string };

/* ───────────── Helpers ───────────── */
function todayKey() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}
function pickTodayChallenges(_seed: string) {
  // puoi sostituire con logica random/seeded
  return ["5 minuti di respirazione", "Scrivi 3 cose positive", "Fai 10 squat"];
}

/* ───────────── Page ───────────── */
export default function Home() {
  const supabase = supabaseBrowser();

  /* Tabs */
  const TABS = ["Chat", "Diario", "Sfide", "Progressi"] as const;
  type Tab = (typeof TABS)[number];
  const [tab, setTab] = useState<Tab>("Chat");

  /* Chat */
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", text: "Ciao! Sono MindMate 💬 Come ti senti oggi?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState<string>("");
  const chatRef = useRef<HTMLDivElement>(null);

  /* Punti / streak (fallback locale) */
  const [points, setPoints] = useState<number>(() => getLS("lm_points", 0));
  const [streak, setStreak] = useState<number>(0);
  const [rewardOpen, setRewardOpen] = useState(false);

  /* Diario, umore, sfide (persistenza locale) */
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

  /* ── Effetti ── */

  // Autoscroll chat
  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  // Carica messaggi di esempio da Supabase (opzionale)
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: true })
        .limit(30);

      if (error) {
        console.warn("Supabase messages error:", error.message);
        return;
      }
      if (data?.length) {
        setMessages([
          { role: "assistant", text: "Bentornato 💬 Riprendiamo da dove eravamo!" },
          ...(data.map((m: any) => ({ role: m.role, text: m.text })) as Msg[]),
        ]);
      }
    })();
  }, [supabase]);

  // Ricompensa giornaliera + streak (fallback solo localStorage)
  useEffect(() => {
    const now = new Date();
    const todayOnly = now.toISOString().slice(0, 10);
    const lastOpen = localStorage.getItem("lm_lastOpen");
    const lastClaim = localStorage.getItem("lm_lastClaim");
    let s = parseInt(localStorage.getItem("lm_streak") || "0");

    if (!lastOpen) s = 1;
    else {
      const diffDays = Math.round(
        (new Date(todayOnly).getTime() - new Date(lastOpen).getTime()) / (1000 * 60 * 60 * 24)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persistenza locale
  useEffect(() => setLS("lm_points", points), [points]);
  useEffect(() => setLS("lm_moodLog", moodLog), [moodLog]);
  useEffect(() => setLS("lm_journal", journal), [journal]);
  useEffect(() => setLS("lm_challengesDone", doneChallenges), [doneChallenges]);

  /* ── Actions ── */

  // Chat
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
      const { reply } = await res.json();
      setOutput(reply);
      setMessages((m) => [...m, { role: "assistant", text: reply }]);
    } catch {
      setOutput("Errore durante la richiesta 😞");
    } finally {
      setLoading(false);
    }
  }

  // Mood
  function setTodayMood(m: Mood) {
    setMoodLog((prev) => ({ ...prev, [today]: m }));
    setPoints((p) => p + 3);
  }

  // Diario
  function saveTodayNote(text: string) {
    setJournal((j) => ({ ...j, [today]: text }));
    setPoints((p) => p + 2);
  }

  // Sfide
  function toggleChallenge(i: number) {
    const todayDone = new Set(doneChallenges[today] || []);
    let delta = 0;
    if (todayDone.has(i)) {
      todayDone.delete(i);
      delta = -5;
    } else {
      todayDone.add(i);
      delta = +5;
    }
    setDoneChallenges((prev) => ({ ...prev, [today]: Array.from(todayDone) }));
    setPoints((p) => Math.max(0, p + delta));
  }

  /* ── Badge ── */
  const badgeWeek = streak >= 7;
  const badgePoints = points >= 100;
  const badgeConsistency = (doneChallenges[today] || []).length >= 3;

  /* ───────────── UI ───────────── */
  return (
    <main style={styles.page}>
      {/* Login rapido sempre visibile */}
      <div style={{ textAlign: "right", width: "100%", maxWidth: 760, margin: "0 auto 8px" }}>
        <Link
          href="/login"
          style={{
            color: "#2563eb",
            padding: "6px 12px",
            border: "1px solid #93c5fd",
            borderRadius: 8,
            textDecoration: "none",
            fontWeight: 700,
          }}
        >
          Accedi
        </Link>
      </div>

      {/* Barra utente con Check-in (si mostra email se loggato) */}
      <div style={{ width: "100%", maxWidth: 760, margin: "0 auto 10px" }}>
        <UserBar />
      </div>

      {/* Card principale */}
      <section style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.logoBox}>💭</div>
          <div>
            <h1 style={styles.h1}>MindMate AI</h1>
            <p style={styles.tag}>Coach personale: chat, diario, sfide, progressi</p>
            <p style={styles.meta}>
              Streak: <b>{streak}</b> giorni • Punti: <b>{points}</b>
            </p>
          </div>
        </div>

        {/* Tabs */}
        <nav style={styles.nav}>
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                ...styles.tabBtn,
                ...(tab === t ? styles.tabActive : {}),
              }}
            >
              {t}
            </button>
          ))}
        </nav>

        {/* CHI CONTENT */}
        {tab === "Chat" && (
          <div>
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

            <form onSubmit={sendMessage} style={{ marginTop: 10 }}>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={3}
                placeholder="Scrivi qui..."
                style={styles.textarea}
              />
              <div style={{ textAlign: "right", marginTop: 8 }}>
                <button type="submit" disabled={loading} style={styles.primaryBtn}>
                  {loading ? "Sto pensando..." : "Invia 💬"}
                </button>
              </div>
            </form>

            {output && (
              <div style={{ marginTop: 20, padding: 10, border: "1px solid #e5e7eb", borderRadius: 12 }}>
                <strong>Risposta:</strong>
                <p>{output}</p>
              </div>
            )}
          </div>
        )}

        {/* DIARIO */}
        {tab === "Diario" && (
          <div>
            <h3>Come ti senti oggi?</h3>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 12 }}>
              {(["felice", "ok", "stanco", "triste"] as Mood[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setTodayMood(m)}
                  style={styles.secondaryBtn}
                  title="Aggiungi umore"
                >
                  {m === "felice" && "😊"}{m === "ok" && "🙂"}{m === "stanco" && "😮‍💨"}{m === "triste" && "😔"} {m}
                </button>
              ))}
            </div>

            <textarea
              value={journal[today] || ""}
              onChange={(e) => saveTodayNote(e.target.value)}
              rows={6}
              placeholder="Scrivi il tuo pensiero del giorno…"
              style={styles.textarea}
            />
            <p style={{ color: "#475569", fontSize: 13, marginTop: 8 }}>
              Ogni voce salvata ti dà <b>+2 punti</b>. Impostare l’umore ti dà <b>+3 punti</b>.
            </p>
          </div>
        )}

        {/* SFIDE */}
        {tab === "Sfide" && (
          <div>
            <h3>Sfide del giorno</h3>
            <div style={{ display: "grid", gap: 10 }}>
              {todayChallenges.map((c, i) => {
                const done = (doneChallenges[today] || []).includes(i);
                return (
                  <div
                    key={i}
                    style={{ ...styles.challenge, ...(done ? styles.challengeDone : {}) }}
                  >
                    <input
                      type="checkbox"
                      checked={done}
                      onChange={() => toggleChallenge(i)}
                      style={{ width: 18, height: 18 }}
                    />
                    <span style={{ textAlign: "left" }}>{c}</span>
                    <span style={{ marginLeft: "auto", fontSize: 12, color: "#475569" }}>
                      {done ? "+0 pt" : "+5 pt"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* PROGRESSI */}
        {tab === "Progressi" && (
          <div>
            <h3>Badge</h3>
            <ul style={{ textAlign: "left", lineHeight: 1.8 }}>
              <li>🔥 Settimana costante: {badgeWeek ? "✅" : "❌"} (streak ≥ 7)</li>
              <li>💎 Punti 100: {badgePoints ? "✅" : "❌"} (points ≥ 100)</li>
              <li>✅ 3 sfide oggi: {badgeConsistency ? "✅" : "❌"}</li>
            </ul>

            <h3 style={{ marginTop: 16 }}>Riepilogo</h3>
            <p style={{ margin: 0 }}>Streak attuale: <b>{streak}</b> giorni</p>
            <p style={{ margin: 0 }}>Punti totali: <b>{points}</b></p>
            <p style={{ margin: 0 }}>
              Sfide completate oggi: <b>{(doneChallenges[today] || []).length}/{todayChallenges.length}</b>
            </p>
          </div>
        )}
      </section>

      {/* Reward modal semplice */}
      {rewardOpen && (
        <div style={styles.modal} onClick={() => setRewardOpen(false)}>
          <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <h3>🎁 Ricompensa Giornaliera</h3>
            <p>Hai ottenuto <b>+10 punti</b> tornando oggi! Continua così 💪</p>
            <button style={styles.primaryBtn} onClick={() => setRewardOpen(false)}>
              Grande! 💛
            </button>
          </div>
        </div>
      )}

      {/* Buy me a coffee */}
      <div style={{ marginTop: 18 }}>
        <a href="https://www.buymeacoffee.com" target="_blank" rel="noreferrer" style={styles.coffee}>
          ☕ Buy me a coffee
        </a>
      </div>
    </main>
  );
}

/* ───────────── Styles ───────────── */
const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "radial-gradient(60% 60% at 50% 0%, #e9eaff 0%, #f8fafc 60%, #ffffff 100%)",
    display: "grid",
    placeItems: "center",
    padding: 16,
  },
  card: {
    width: "100%",
    maxWidth: 760,
    background: "white",
    borderRadius: 18,
    border: "1px solid #e5e7eb",
    padding: 20,
    boxShadow: "0 8px 20px rgba(0,0,0,0.05)",
  },
  header: { display: "flex", alignItems: "center", gap: 10, marginBottom: 8 },
  logoBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    display: "grid",
    placeItems: "center",
    background: "#ffe08a",
    border: "1px solid #f6d76b",
  },
  h1: { margin: 0, fontSize: 18, fontWeight: 800 },
  tag: { fontSize: 12, margin: 0, color: "#475569" },
  meta: { fontSize: 12, color: "#334155", margin: "4px 0 0" },
  nav: { display: "flex", gap: 8, margin: "10px 0 14px" },
  tabBtn: {
    padding: "8px 12px",
    borderRadius: 999,
    border: "1px solid #e5e7eb",
    background: "#fff",
    cursor: "pointer",
  },
  tabActive: { background: "#2563eb", color: "#fff" },
  chatBox: {
    height: 360,
    overflow: "auto",
    padding: 12,
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    marginBottom: 10,
    background: "#fff",
  },
  bubble: { maxWidth: "85%", padding: "10px 12px", borderRadius: 12, lineHeight: 1.45 },
  bubbleAI: { background: "#f1f5f9" },
  bubbleUser: { background: "#e0f2fe" },
  textarea: { width: "100%", borderRadius: 12, border: "1px solid #d9e1f2", padding: 12 },
  primaryBtn: {
    padding: "10px 14px",
    borderRadius: 10,
    border: "none",
    background: "#2563eb",
    color: "#fff",
    cursor: "pointer",
  },
  secondaryBtn: {
    padding: "8px 12px",
    borderRadius: 10,
    border: "1px solid #c7d2fe",
    background: "#eef2ff",
    cursor: "pointer",
  },
  challenge: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    background: "#ffffff",
  },
  challengeDone: { background: "#ecfeff", borderColor: "#bae6fd" },
  coffee: {
    display: "inline-block",
    textDecoration: "none",
    background: "#ffd143",
    border: "1px solid #f2bf2c",
    color: "#1f2937",
    fontWeight: 800,
    padding: "10px 14px",
    borderRadius: 10,
  },
  modal: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,.55)",
    display: "grid",
    placeItems: "center",
  },
  modalCard: {
    width: "min(90vw, 360px)",
    background: "#fff",
    borderRadius: 14,
    padding: 18,
    textAlign: "center",
  },
};
