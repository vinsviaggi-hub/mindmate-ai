"use client";

import { getLS } from "@/lib/utils";
import { useState, useRef } from "react";
type Msg = {
  role: "user" | "assistant";
  text: string;
};export default function Home() {  const TABS = ["Chat", "Diario", "Sfide", "Progressi"] as const;
  type Tab = typeof TABS[number];
  const [tab, setTab] = useState<Tab>("Chat");

  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", text: "Ciao! Sono MindMate 💬 Come ti senti oggi?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
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
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  /** LOAD MESSAGES FROM SUPABASE **/
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
          ...data.map((m: any) => ({ role: m.role, text: m.text })),
        ]);
      }
    })();
  }, []);

  /** DAILY REWARD + STREAK **/
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
      const newPts = points + 10;
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
      setOutput(data.reply);
    } catch {
      setOutput("Errore durante la richiesta 😞");
    } finally {
      setLoading(false);
    }
  }

  /** MOOD TRACKER **/
  function setTodayMood(m: Mood) {
    setMoodLog((prev) => ({ ...prev, [today]: m }));
    setPoints((p) => p + 3);
  }

  /** DIARIO **/
  function saveTodayNote(text: string) {
    setJournal((j) => ({ ...j, [today]: text }));
    setPoints((p) => p + 2);
  }

  /** SFIDE **/
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

  const badgeWeek = streak >= 7;
  const badgePoints = points >= 100;
  const badgeConsistency = (doneChallenges[today] || []).length >= 3;

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
    </main>
  );
}

/** ─────────────────────── STILI ─────────────────────── */
const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "radial-gradient(60% 60% at 50% 0%, #e9eaff 0%, #f8fafc 60%, #ffffff 100%)",
    display: "grid",
    placeItems: "center",
    padding: 16,
  },
  nav: { display: "flex", gap: 8, marginBottom: 10 },
  tabBtn: { padding: "8px 12px", borderRadius: 999, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer" },
  tabActive: { background: "#2563eb", color: "#fff" },
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
  inputRow: { display: "grid", gridTemplateColumns: "1fr auto", gap: 8 },
  input: { height: 42, borderRadius: 10, border: "1px solid #d9e1f2", padding: "0 12px" },
  primaryBtn: { height: 42, padding: "0 14px", borderRadius: 10, border: "none", background: "#2563eb", color: "#fff" },
  secondaryBtn: { height: 40, borderRadius: 10, border: "1px solid #c7d2fe", background: "#eef2ff" },
  textarea: { width: "100%", borderRadius: 12, border: "1px solid #d9e1f2", padding: 12 },
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
