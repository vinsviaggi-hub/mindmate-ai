"use client";

import { supabase } from "@/lib/supabase";
import { useEffect, useMemo, useRef, useState } from "react";
/** ─────────────────────── HELPERS ─────────────────────── */
const todayKey = () => new Date().toISOString().slice(0, 10); // YYYY-MM-DD
const getLS = <T,>(k: string, fallback: T): T => {
  if (typeof window === "undefined") return fallback;
  try {
    const v = localStorage.getItem(k);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
};
const setLS = (k: string, v: any) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(k, JSON.stringify(v));
};

/** ─────────────────────── CHALLENGES ───────────────────────
 * Lista base di sfide. Ogni giorno ne mostriamo 3, selezionate in modo
 * deterministico usando la data come "seme".
 */
const ALL_CHALLENGES = [
  "3 minuti di respiro profondo",
  "Scrivi 3 cose per cui sei grato",
  "Fai 10 squat/lunges a corpo libero",
  "Bevi un bicchiere d’acqua ora",
  "Manda un messaggio gentile a qualcuno",
  "5 minuti senza social",
  "Sistema una piccola cosa in casa",
  "Fai una passeggiata breve",
  "Metti a fuoco 1 obiettivo per oggi",
  "Ascolta 1 brano rilassante",
];
function pickTodayChallenges(d: string): string[] {
  // hash semplice della data
  let seed = 0;
  for (let i = 0; i < d.length; i++) seed = (seed * 31 + d.charCodeAt(i)) % 997;
  const arr = [...ALL_CHALLENGES];
  // pseudo-shuffle deterministico
  for (let i = 0; i < arr.length; i++) {
    const j = (i + seed) % arr.length;
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, 3);
}

/** ─────────────────────── UI ─────────────────────── */
type Msg = { role: "user" | "assistant"; text: string };
type Mood = "😄" | "🙂" | "😐" | "😕" | "😞";

export default function Home() {
  /** NAV **/
  const TABS = ["Chat", "Diario", "Sfide", "Progressi"] as const;
  type Tab = typeof TABS[number];
  const [tab, setTab] = useState<Tab>("Chat");

  /** CHAT **/
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", text: "Ciao! Sono MindMate 💬 Come ti senti oggi?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  /** GAMIFICATION **/
  const [points, setPoints] = useState<number>(() => getLS<number>("lm_points", 0));
  const [streak, setStreak] = useState<number>(0);
  const [rewardOpen, setRewardOpen] = useState(false);
// ID utente anonimo (salvato nel browser)
const [userId, setUserId] = useState<string | null>(null);

function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0, v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}  /** MOOD + DIARIO **/
  const [moodLog, setMoodLog] = useState<Record<string, Mood>>(() =>
    getLS<Record<string, Mood>>("lm_moodLog", {})
  );
  const [journal, setJournal] = useState<Record<string, string>>(() =>
    getLS<Record<string, string>>("lm_journal", {})
  );

  /** SFIDE **/
  const today = todayKey();
  const todayChallenges = useMemo(() => pickTodayChallenges(today), [today]);
  const [doneChallenges, setDoneChallenges] = useState<Record<string, number[]>>(() =>
    getLS<Record<string, number[]>>("lm_challengesDone", {})
  );

  /** AUTOSCROLL CHAT **/
  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  /** DAILY REWARD + STREAK **/
  useEffect(() => {
    const now = new Date();
    const dayOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const lastOpen = localStorage.getItem("lm_lastOpen");
    const lastClaim = localStorage.getItem("lm_lastClaim");
    let s = parseInt(localStorage.getItem("lm_streak") || "0");

    // streak
    if (!lastOpen) {
      s = 1;
    } else {
      const prev = new Date(lastOpen);
      const diffDays = Math.round(
        (new Date(dayOnly).getTime() - new Date(prev.getFullYear(), prev.getMonth(), prev.getDate()).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      if (diffDays === 1) s = s + 1;
      else if (diffDays > 1) s = 1;
    }
    localStorage.setItem("lm_lastOpen", dayOnly);
    localStorage.setItem("lm_streak", String(s));
    setStreak(s);

    // daily reward
    const todayStr = new Date().toDateString();
    if (lastClaim !== todayStr) {
      const newPts = points + 10;
      setPoints(newPts);
      setLS("lm_points", newPts);
      localStorage.setItem("lm_lastClaim", todayStr);
      setRewardOpen(true);
    }
  }, []); // run on mount only

  /** PERSISTENZE **/
  useEffect(() => setLS("lm_points", points), [points]);
  useEffect(() => setLS("lm_moodLog", moodLog), [moodLog]);
  useEffect(() => setLS("lm_journal", journal), [journal]);
  useEffect(() => setLS("lm_challengesDone", doneChallenges), [doneChallenges]);

  /** CHAT SEND **/
  async function sendMessage(e?: React.FormEvent) {
    e?.preventDefault();
useEffect(() => {
  (async () => {
    try {
      // 1️⃣ Crea o recupera ID utente
      let uid = localStorage.getItem("mm_user_id");
      if (!uid) {
        uid = uuidv4();
        localStorage.setItem("mm_user_id", uid);
        await supabase.from("profiles").insert({ id: uid });
      } else {
        await supabase.from("profiles").upsert({ id: uid });
      }
      setUserId(uid);

      // 2️⃣ Recupera progressi utente
      const { data: prog } = await supabase
        .from("progress")
        .select("*")
        .eq("user_id", uid)
        .maybeSingle();

      if (prog) {
        setStreak(prog.streak ?? 0);
        setPoints?.(prog.coins ?? 0);
      } else {
        await supabase.from("progress").insert({ user_id: uid, streak: 0, coins: 0 });
      }

      // 3️⃣ Recupera ultimi messaggi
      const { data: msgs } = await supabase
        .from("messages")
        .select("role,content")
        .eq("user_id", uid)
        .order("created_at", { ascending: true })
        .limit(30);

      if (msgs && msgs.length) {
        setMessages([
          { role: "assistant", text: "Bentornato 💬 Riprendiamo da dove avevamo lasciato!" },
          ...msgs.map(m => ({ role: m.role as "user" | "assistant", text: m.content }))
        ]);
      }
    } catch (e) {
      console.error("Errore Supabase:", e);
    }
  })();
}, []););
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
      setMessages((m) => [...m, { role: "assistant", text: data?.reply ?? "Posso aiutarti in altro modo? 🙂" }]);
      // piccolo bonus per attività
      setPoints((p) => p + 1);
    } catch {
      setMessages((m) => [...m, { role: "assistant", text: "Ops, problema di rete. Riproviamo tra poco." }]);
    } finally {
      setLoading(false);
    }
  }

  /** MOOD TRACKER **/
  function setTodayMood(m: Mood) {
    setMoodLog((prev) => ({ ...prev, [today]: m }));
    setPoints((p) => p + 3); // bonus
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
      delta = -5; // se togli spunta, togli punti
    } else {
      todayDone.add(i);
      delta = +5; // completa una sfida = +5
    }
    setDoneChallenges((prev) => ({ ...prev, [today]: Array.from(todayDone).sort() }));
    setPoints((p) => Math.max(0, p + delta));
  }

  /** BADGE (semplici) **/
  const badgeWeek = streak >= 7;
  const badgePoints = points >= 100;
  const badgeConsistency = (doneChallenges[today] || []).length >= 3; // tutte e 3 in un giorno

  return (
    <main style={styles.page}>
      {/* NAV BAR */}
      <nav style={styles.nav}>
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{ ...styles.tabBtn, ...(tab === t ? styles.tabActive : {}) }}
          >
            {t}
          </button>
        ))}
      </nav>

      {/* CARD */}
      <section style={styles.card} aria-label="LifeMate AI">
        <header style={styles.header}>
          <div style={styles.logoBox}>💬</div>
          <div>
            <h1 style={styles.h1}>LifeMate AI</h1>
            <p style={styles.tag}>Coach personale: chat, diario, sfide, progressi</p>
            <p style={styles.meta}>
              🔥 Streak: <b>{streak}</b> giorno{streak === 1 ? "" : "i"} · ⭐ Punti: <b>{points}</b>
            </p>
          </div>
        </header>

        {/* TABS CONTENT */}
        {tab === "Chat" && (
          <>
            <div ref={chatRef} style={styles.chatBox}>
              {messages.map((m, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: m.role === "user" ? "flex-end" : "flex-start",
                    margin: "8px 0",
                  }}
                >
                  <div
                    style={{
                      ...styles.bubble,
                      ...(m.role === "user" ? styles.bubbleUser : styles.bubbleAI),
                    }}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              {loading && <div style={{ color: "#64748b", fontSize: 13 }}>MindMate sta scrivendo…</div>}
            </div>

            <form onSubmit={sendMessage} style={styles.inputRow}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Scrivi qui…"
                aria-label="Scrivi un messaggio"
                style={styles.input}
              />
              <button type="submit" disabled={loading} style={styles.primaryBtn}>
                {loading ? "…" : "Invia"}
              </button>
            </form>
          </>
        )}

        {tab === "Diario" && (
          <div style={{ display: "grid", gap: 8 }}>
            <p style={{ margin: 0, color: "#475569" }}>📔 Diario del giorno ({today})</p>
            <textarea
              value={journal[today] || ""}
              onChange={(e) => setJournal((j) => ({ ...j, [today]: e.target.value }))}
              placeholder="Scrivi qui come ti senti, cosa è successo, cosa hai imparato…"
              rows={8}
              style={styles.textarea}
            />
            <button
              onClick={() => saveTodayNote(journal[today] || "")}
              style={styles.secondaryBtn}
            >
              Salva nota (+2⭐)
            </button>
          </div>
        )}

        {tab === "Sfide" && (
          <div style={{ display: "grid", gap: 10 }}>
            <p style={{ margin: 0, color: "#475569" }}>
              🎯 Sfide di oggi ({today}) — completa per ottenere punti (+5⭐)
            </p>
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 8 }}>
              {todayChallenges.map((c, i) => {
                const done = (doneChallenges[today] || []).includes(i);
                return (
                  <li
                    key={i}
                    onClick={() => toggleChallenge(i)}
                    style={{
                      ...styles.challenge,
                      ...(done ? styles.challengeDone : {}),
                    }}
                  >
                    <input type="checkbox" readOnly checked={done} />
                    <span>{c}</span>
                  </li>
                );
              })}
            </ul>
            <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>
              Tip: completa tutte e 3 oggi → badge “Costanza del giorno” 🏅
            </p>
          </div>
        )}

        {tab === "Progressi" && (
          <div style={{ display: "grid", gap: 10 }}>
            <h3 style={{ margin: "4px 0 0" }}>📊 Il tuo percorso</h3>
            <div style={styles.statsRow}>
              <div style={styles.statCard}>
                <div style={styles.statVal}>{streak}</div>
                <div style={styles.statLabel}>Streak</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statVal}>{points}</div>
                <div style={styles.statLabel}>Punti</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statVal}>{Object.keys(journal).length}</div>
                <div style={styles.statLabel}>Giorni di Diario</div>
              </div>
            </div>

            <div>
              <h4 style={{ margin: "8px 0 4px" }}>🏅 Badge</h4>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <span style={{ ...styles.badge, ...(badgeWeek ? styles.badgeOn : {}) }}>
                  Settimana d’oro (7+)
                </span>
                <span style={{ ...styles.badge, ...(badgePoints ? styles.badgeOn : {}) }}>
                  100+ punti
                </span>
                <span style={{ ...styles.badge, ...(badgeConsistency ? styles.badgeOn : {}) }}>
                  3/3 sfide oggi
                </span>
              </div>
            </div>

            <div>
              <h4 style={{ margin: "8px 0 4px" }}>😊 Umore recente</h4>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {Object.entries(moodLog)
                  .sort((a, b) => (a[0] > b[0] ? -1 : 1))
                  .slice(0, 10)
                  .map(([d, m]) => (
                    <span key={d} style={styles.moodPill}>
                      {m} <small style={{ color: "#64748b" }}>{d}</small>
                    </span>
                  ))}
                {Object.keys(moodLog).length === 0 && (
                  <span style={{ fontSize: 13, color: "#64748b" }}>Nessun dato ancora</span>
                )}
              </div>
            </div>

            <div>
              <h4 style={{ margin: "8px 0 4px" }}>Imposta umore oggi</h4>
              <div style={{ display: "flex", gap: 8 }}>
                {(["😄", "🙂", "😐", "😕", "😞"] as Mood[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setTodayMood(m)}
                    style={{
                      ...styles.moodBtn,
                      ...(moodLog[today] === m ? styles.moodBtnOn : {}),
                    }}
                  >
                    {m}
                  </button>
                ))}
              </div>
              {moodLog[today] && (
                <p style={{ fontSize: 12, color: "#475569", marginTop: 6 }}>
                  Umore di oggi: <b>{moodLog[today]}</b> (+3⭐)
                </p>
              )}
            </div>
          </div>
        )}

        {/* CTA */}
        <div style={{ textAlign: "center", marginTop: 12 }}>
          <a
            href="https://www.buymeacoffee.com/coachvins"
            target="_blank"
            rel="noopener noreferrer"
            style={styles.coffee}
          >
            ☕ Buy me a coffee
          </a>
        </div>
      </section>

      {/* DAILY REWARD POPUP */}
      {rewardOpen && (
        <div style={styles.modal}>
          <div style={styles.modalCard}>
            <h3 style={{ margin: 0 }}>🎁 Premio giornaliero!</h3>
            <p style={{ margin: "8px 0 0", color: "#334155" }}>
              Hai guadagnato <b>+10 punti</b> per la tua costanza 👏
            </p>
            <button onClick={() => setRewardOpen(false)} style={styles.primaryBtn}>
              Grazie!
            </button>
          </div>
        </div>
      )}

      {/* STILI DI PAGINA */}
      <style jsx>{`
        @media (max-width: 540px) {
          .hide-sm {
            display: none;
          }
        }
      `}</style>
    </main>
  );
}

/** ─────────────────────── STILI ─────────────────────── */
const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100svh",
    background:
      "radial-gradient(60% 60% at 50% 0%, #e9eaff 0%, #f8fafc 60%, #ffffff 100%)",
    display: "grid",
    placeItems: "center",
    padding: 16,
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial',
    color: "#0f172a",
  },
  nav: {
    display: "flex",
    gap: 8,
    marginBottom: 10,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  tabBtn: {
    padding: "8px 12px",
    borderRadius: 999,
    border: "1px solid #e5e7eb",
    background: "#fff",
    cursor: "pointer",
    fontWeight: 600,
  },
  tabActive: {
    background: "#2563eb",
    borderColor: "#2563eb",
    color: "#fff",
  },
  card: {
    width: "100%",
    maxWidth: 760,
    background: "rgba(255,255,255,.9)",
    backdropFilter: "blur(6px)",
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    boxShadow: "0 12px 30px rgba(2,6,23,.08)",
    padding: 18,
  },
  header: { display: "flex", gap: 10, alignItems: "center", marginBottom: 8 },
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
  tag: { margin: 0, fontSize: 12, color: "#475569" },
  meta: { margin: "4px 0 0", fontSize: 12, color: "#334155" },

  chatBox: {
    height: 360,
    overflow: "auto",
    padding: 12,
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    background: "#fff",
    marginBottom: 10,
  },
  bubble: {
    maxWidth: "85%",
    padding: "10px 12px",
    borderRadius: 12,
    lineHeight: 1.45,
    border: "1px solid #e5e7eb",
    wordBreak: "break-word",
    boxShadow: "0 1px 0 rgba(0,0,0,.04)",
  },
  bubbleAI: { background: "#f1f5f9" },
  bubbleUser: { background: "#e0f2fe", marginLeft: "auto", color: "#0c4a6e" },

  inputRow: { display: "grid", gridTemplateColumns: "1fr auto", gap: 8 },
  input: {
    height: 42,
    borderRadius: 10,
    border: "1px solid #d9e1f2",
    padding: "0 12px",
    outline: "none",
    background: "#fff",
  },
  primaryBtn: {
    height: 42,
    padding: "0 14px",
    borderRadius: 10,
    border: "none",
    background: "#2563eb",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
  },
  secondaryBtn: {
    height: 40,
    padding: "0 14px",
    borderRadius: 10,
    border: "1px solid #c7d2fe",
    background: "#eef2ff",
    color: "#1e3a8a",
    fontWeight: 700,
    cursor: "pointer",
  },
  textarea: {
    width: "100%",
    borderRadius: 12,
    border: "1px solid #d9e1f2",
    padding: 12,
    outline: "none",
    fontSize: 14,
    background: "#fff",
    resize: "vertical",
  },

  challenge: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    background: "#ffffff",
    cursor: "pointer",
  },
  challengeDone: {
    background: "#ecfeff",
    borderColor: "#bae6fd",
  },

  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 10,
  },
  statCard: {
    border: "1px solid #e5e7eb",
    background: "#ffffff",
    borderRadius: 12,
    padding: 12,
    textAlign: "center",
  },
  statVal: { fontSize: 20, fontWeight: 800 },
  statLabel: { color: "#475569", fontSize: 12 },

  badge: {
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px dashed #e5e7eb",
    fontSize: 12,
    color: "#334155",
    background: "#fff",
  },
  badgeOn: {
    borderColor: "#22c55e",
    background: "#dcfce7",
    color: "#166534",
    fontWeight: 700,
  },

  moodPill: {
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid #e5e7eb",
    background: "#fff",
    display: "inline-flex",
    gap: 6,
    alignItems: "center",
  },
  moodBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    background: "#fff",
    cursor: "pointer",
    fontSize: 20,
  },
  moodBtnOn: {
    background: "#e0f2fe",
    borderColor: "#93c5fd",
  },

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
    zIndex: 50,
  },
  modalCard: {
    width: "min(90vw, 360px)",
    background: "#fff",
    borderRadius: 14,
    border: "1px solid #e5e7eb",
    padding: 18,
    textAlign: "center",
    boxShadow: "0 18px 40px rgba(2,6,23,.18)",
    display: "grid",
    gap: 10,
    justifyItems: "center",
  },
};
import { supabase } from "@/lib/supabase";
