"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/* ─────────────────────── HELPERS ─────────────────────── */
type Msg = { role: "user" | "assistant"; text: string };
type Mood = "😄" | "🙂" | "😐" | "😕" | "😞";

const todayKey = () => new Date().toISOString().slice(0, 10); // YYYY-MM-DD

function getLS<T>(k: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const v = localStorage.getItem(k);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}
function setLS(k: string, v: any) {
  if (typeof window === "undefined") return;
  localStorage.setItem(k, JSON.stringify(v));
}

/* ─────────────────────── CHALLENGES ─────────────────────── */
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

function pickTodayChallenges(seed: string): string[] {
  // shuffle deterministico
  let s = 0;
  for (let i = 0; i < seed.length; i++) s = (s * 31 + seed.charCodeAt(i)) % 997;
  const arr = [...ALL_CHALLENGES];
  for (let i = arr.length - 1; i > 0; i--) {
    s = (s * 31 + i) % 997;
    const j = s % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, 3);
}

/* ─────────────────────── COMPONENTE ─────────────────────── */
export default function Page() {
  /* NAV */
  const TABS = ["Chat", "Diario", "Sfide", "Progressi"] as const;
  type Tab = (typeof TABS)[number];
  const [tab, setTab] = useState<Tab>("Chat");

  /* CHAT */
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", text: "Ciao! Sono MindMate 💬 Come ti senti oggi?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  /* GAMIFICATION */
  const [points, setPoints] = useState<number>(() => getLS("lm_points", 0));
  const [streak, setStreak] = useState<number>(() => parseInt(localStorage.getItem("lm_streak") || "0"));
  const [rewardOpen, setRewardOpen] = useState(false);

  /* MOOD + DIARIO */
  const [moodLog, setMoodLog] = useState<Record<string, Mood>>(() => getLS("lm_moodLog", {} as Record<string, Mood>));
  const [journal, setJournal] = useState<Record<string, string>>(() => getLS("lm_journal", {} as Record<string, string>));

  /* SFIDE */
  const today = todayKey();
  const todayChallenges = useMemo(() => pickTodayChallenges(today), [today]);
  const [doneChallenges, setDoneChallenges] = useState<Record<string, number[]>>(() =>
    getLS("lm_challengesDone", {} as Record<string, number[]>)
  );

  /* AUTOSCROLL */
  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  /* DAILY REWARD + STREAK (mount una sola volta) */
  useEffect(() => {
    const todayStr = todayKey();
    const lastDay = localStorage.getItem("lm_lastDay");
    let s = parseInt(localStorage.getItem("lm_streak") || "0");

    if (!lastDay) s = 1;
    else {
      const diffDays =
        (new Date(todayStr).getTime() - new Date(lastDay).getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays === 1) s++;
      else if (diffDays > 1) s = 1;
    }

    localStorage.setItem("lm_lastDay", todayStr);
    localStorage.setItem("lm_streak", String(s));
    setStreak(s);

    const lastClaim = localStorage.getItem("lm_lastClaim");
    if (lastClaim !== todayStr) {
      const newPts = points + 10;
      setPoints(newPts);
      setLS("lm_points", newPts);
      localStorage.setItem("lm_lastClaim", todayStr);
      setRewardOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* PERSISTENZE */
  useEffect(() => setLS("lm_points", points), [points]);
  useEffect(() => setLS("lm_moodLog", moodLog), [moodLog]);
  useEffect(() => setLS("lm_journal", journal), [journal]);
  useEffect(() => setLS("lm_challengesDone", doneChallenges), [doneChallenges]);

  /* CHAT SEND */
  async function sendMessage(e?: React.FormEvent) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    setLoading(true);

    // micro-bonus per attività (max 20 msg/giorno)
    const counterKey = "lm_msg_" + todayKey();
    const count = Number(localStorage.getItem(counterKey) ?? "0") + 1;
    localStorage.setItem(counterKey, String(count));
    if (count <= 20) setPoints((p) => p + 1);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      setMessages((m) => [
        ...m,
        { role: "assistant", text: data?.reply ?? "Posso aiutarti in altro modo? 🙂" },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", text: "Ops, problema di rete. Riproviamo tra poco." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  /* COFFEE BONUS */
  function handleCoffee() {
    const last = Number(localStorage.getItem("lm_lastCoffeeBonus") || "0");
    const now = Date.now();
    const sixHours = 1000 * 60 * 60 * 6;

    if (now - last < sixHours) {
      setMessages((m) => [
        ...m,
        { role: "assistant", text: "☕ Bonus caffè già preso di recente 😉" },
      ]);
      return;
    }

    const bonus = 5;
    const newPts = points + bonus;
    setPoints(newPts);
    setLS("lm_points", newPts);
    localStorage.setItem("lm_lastCoffeeBonus", String(now));

    setMessages((m) => [
      ...m,
      { role: "assistant", text: `☕ Grazie per il caffè! +${bonus} punti ❤️` },
    ]);

    // opzionale: apri link BMC
    // window.open("https://www.buymeacoffee.com/coachvins", "_blank");
  }

  /* MOOD */
  function setTodayMood(m: Mood) {
    setMoodLog((prev) => ({ ...prev, [today]: m }));
    setPoints((p) => p + 3);
  }

  /* DIARIO */
  function saveTodayNote(text: string) {
    setJournal((j) => ({ ...j, [today]: text }));
    setPoints((p) => p + 2);
  }

  /* SFIDE */
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
    setDoneChallenges((prev) => ({ ...prev, [today]: Array.from(todayDone).sort() }));
    setPoints((p) => Math.max(0, p + delta));
  }

  /* BADGE semplici */
  const badgeWeek = streak >= 7;
  const badgePoints = points >= 100;
  const badgeConsistency = (doneChallenges[today] || []).length >= 3;

  /* RENDER */
  return (
    <main style={S.page}>
      {/* NAV */}
      <nav style={S.tabs}>
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={Object.assign({}, S.tab(tab === t))}
            aria-pressed={tab === t}
          >
            {t}
          </button>
        ))}
      </nav>

      {/* CARD */}
      <section style={S.card} aria-label="LifeMate AI">
        <header style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8 }}>
          <div style={S.logo}>💬</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>LifeMate AI</h1>
            <p style={{ margin: 0, fontSize: 12, color: "#475569" }}>
              Coach personale: chat, diario, sfide, progressi
            </p>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "#334155" }}>
              🔥 Streak: <b>{streak}</b> giorno{streak === 1 ? "" : "i"} · ⭐ Punti: <b>{points}</b>
            </p>
          </div>
        </header>

        {/* CONTENUTI TABS */}
        {tab === "Chat" && (
          <>
            <div ref={chatRef} style={S.chatBox}>
              {messages.map((m, i) => (
                <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", margin: "8px 0" }}>
                  <div style={{ ...S.bubble, ...(m.role === "user" ? S.bubbleUser : S.bubbleAI) }}>
                    {m.text}
                  </div>
                </div>
              ))}
              {loading && <div style={{ color: "#64748b", fontSize: 13 }}>MindMate sta scrivendo…</div>}
            </div>

            <form onSubmit={sendMessage} style={S.row}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Scrivi qui…"
                aria-label="Scrivi un messaggio"
                style={S.input}
              />
              <button type="submit" disabled={loading} style={S.btn}>
                {loading ? "…" : "Invia"}
              </button>
            </form>

            <div style={{ textAlign: "center", marginTop: 12 }}>
              <button onClick={handleCoffee} style={S.coffee}>
                ☕ Buy me a coffee
              </button>
            </div>
          </>
        )}

        {tab === "Diario" && (
          <div style={{ display: "grid", gap: 8 }}>
            <p style={{ margin: 0, color: "#475569" }}>📔 Diario del giorno ({today})</p>
            <textarea
              value={journal[today] || ""}
              onChange={(e) => setJournal((j) => ({ ...j, [today]: e.target.value }))}
              placeholder="Scrivi qui come ti senti…"
              rows={8}
              style={S.textarea}
            />
            <button onClick={() => saveTodayNote(journal[today] || "")} style={S.secondaryBtn}>
              Salva nota (+2⭐)
            </button>

            <div>
              <h4 style={{ margin: "10px 0 6px" }}>😊 Umore di oggi</h4>
              <div style={{ display: "flex", gap: 8 }}>
                {(["😄", "🙂", "😐", "😕", "😞"] as Mood[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setTodayMood(m)}
                    style={{ ...S.moodBtn, ...(moodLog[today] === m ? S.moodBtnOn : {}) }}
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

        {tab === "Sfide" && (
          <div style={{ display: "grid", gap: 10 }}>
            <p style={{ margin: 0, color: "#475569" }}>
              🎯 Sfide di oggi — completa per ottenere punti (+5⭐)
            </p>
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 8 }}>
              {todayChallenges.map((c, i) => {
                const done = (doneChallenges[today] || []).includes(i);
                return (
                  <li
                    key={i}
                    onClick={() => toggleChallenge(i)}
                    style={{ ...S.challenge, ...(done ? S.challengeDone : {}) }}
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

            <div style={S.statsRow}>
              <div style={S.statCard}>
                <div style={S.statVal}>{streak}</div>
                <div style={S.statLabel}>Streak</div>
              </div>
              <div style={S.statCard}>
                <div style={S.statVal}>{points}</div>
                <div style={S.statLabel}>Punti</div>
              </div>
              <div style={S.statCard}>
                <div style={S.statVal}>{Object.keys(journal).length}</div>
                <div style={S.statLabel}>Giorni di Diario</div>
              </div>
            </div>

            <div>
              <h4 style={{ margin: "8px 0 4px" }}>🏅 Badge</h4>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <span style={{ ...S.badge, ...(streak >= 7 ? S.badgeOn : {}) }}>Settimana d’oro (7+)</span>
                <span style={{ ...S.badge, ...(points >= 100 ? S.badgeOn : {}) }}>100+ punti</span>
                <span style={{ ...S.badge, ...(badgeConsistency ? S.badgeOn : {}) }}>3/3 sfide oggi</span>
              </div>
            </div>

            <div>
              <h4 style={{ margin: "8px 0 4px" }}>😊 Umore recente</h4>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {Object.entries(moodLog)
                  .sort((a, b) => (a[0] > b[0] ? -1 : 1))
                  .slice(0, 10)
                  .map(([d, m]) => (
                    <span key={d} style={S.moodPill}>
                      {m} <small style={{ color: "#64748b" }}>{d}</small>
                    </span>
                  ))}
                {Object.keys(moodLog).length === 0 && (
                  <span style={{ fontSize: 13, color: "#64748b" }}>Nessun dato ancora</span>
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* POPUP PREMIO GIORNALIERO */}
      {rewardOpen && (
        <div style={S.modal}>
          <div style={S.modalCard}>
            <h3 style={{ margin: 0 }}>🎁 Premio giornaliero!</h3>
            <p style={{ margin: "8px 0 0", color: "#334155" }}>
              Hai guadagnato <b>+10 punti</b> per la tua costanza 👏
            </p>
            <button onClick={() => setRewardOpen(false)} style={S.btn}>
              Grazie!
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

/* ─────────────────────── STILI ─────────────────────── */
const S = {
  page: {
    minHeight: "100svh",
    background: "radial-gradient(60% 60% at 50% 0%, #e9eaff 0%, #f8fafc 60%, #ffffff 100%)",
    display: "grid",
    placeItems: "center",
    padding: 16,
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial',
    color: "#0f172a",
    width: "100%",
  } as React.CSSProperties,
  tabs: { display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap", justifyContent: "center" } as React.CSSProperties,
  tab: (active: boolean) =>
    ({
      padding: "8px 12px",
      borderRadius: 999,
      border: "1px solid #e5e7eb",
      background: active ? "#2563eb" : "#fff",
      color: active ? "#fff" : "#111827",
      cursor: "pointer",
      fontWeight: 600,
    }) as React.CSSProperties,
  card: {
    width: "100%",
    maxWidth: 760,
    background: "rgba(255,255,255,.9)",
    backdropFilter: "blur(6px)",
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    boxShadow: "0 12px 30px rgba(2,6,23,.08)",
    padding: 18,
  } as React.CSSProperties,
  logo: {
    width: 36,
    height: 36,
    borderRadius: 10,
    display: "grid",
    placeItems: "center",
    background: "#ffe08a",
    border: "1px solid #f6d76b",
  } as React.CSSProperties,
  chatBox: {
    height: 360,
    overflow: "auto",
    padding: 12,
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    background: "#fff",
    marginBottom: 10,
  } as React.CSSProperties,
  bubble: {
    maxWidth: "85%",
    padding: "10px 12px",
    borderRadius: 12,
    lineHeight: 1.45,
    border: "1px solid #e5e7eb",
    wordBreak: "break-word",
    boxShadow: "0 1px 0 rgba(0,0,0,.04)",
  } as React.CSSProperties,
  bubbleAI: { background: "#f1f5f9" } as React.CSSProperties,
  bubbleUser: { background: "#e0f2fe", color: "#0c4a6e", marginLeft: "auto" } as React.CSSProperties,
  row: { display: "grid", gridTemplateColumns: "1fr auto", gap: 8 } as React.CSSProperties,
  input: {
    height: 42,
    borderRadius: 10,
    border: "1px solid #d9e1f2",
    padding: "0 12px",
    outline: "none",
    background: "#fff",
  } as React.CSSProperties,
  btn: {
    height: 42,
    padding: "0 14px",
    borderRadius: 10,
    border: "none",
    background: "#2563eb",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
  } as React.CSSProperties,
  secondaryBtn: {
    height: 40,
    padding: "0 14px",
    borderRadius: 10,
    border: "1px solid #c7d2fe",
    background: "#eef2ff",
    color: "#1e3a8a",
    fontWeight: 700,
    cursor: "pointer",
  } as React.CSSProperties,
  textarea: {
    width: "100%",
    borderRadius: 12,
    border: "1px solid #d9e1f2",
    padding: 12,
    outline: "none",
    fontSize: 14,
    background: "#fff",
    resize: "vertical",
  } as React.CSSProperties,
  challenge: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    background: "#ffffff",
    cursor: "pointer",
  } as React.CSSProperties,
  challengeDone: { background: "#ecfeff", borderColor: "#bae6fd" } as React.CSSProperties,
  statsRow: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 } as React.CSSProperties,
  statCard: {
    border: "1px solid #e5e7eb",
    background: "#ffffff",
    borderRadius: 12,
    padding: 12,
    textAlign: "center",
  } as React.CSSProperties,
  statVal: { fontSize: 20, fontWeight: 800 } as React.CSSProperties,
  statLabel: { color: "#475569", fontSize: 12 } as React.CSSProperties,
  badge: {
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px dashed #e5e7eb",
    fontSize: 12,
    color: "#334155",
    background: "#fff",
  } as React.CSSProperties,
  badgeOn: { borderColor: "#22c55e", background: "#dcfce7", color: "#166534", fontWeight: 700 } as React.CSSProperties,
  moodPill: {
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid #e5e7eb",
    background: "#fff",
    display: "inline-flex",
    gap: 6,
    alignItems: "center",
  } as React.CSSProperties,
  moodBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    background: "#fff",
    cursor: "pointer",
    fontSize: 20,
  } as React.CSSProperties,
  moodBtnOn: { background: "#e0f2fe", borderColor: "#93c5fd" } as React.CSSProperties,
  coffee: {
    display: "inline-block",
    background: "#ffd143",
    border: "1px solid #f2bf2c",
    color: "#1f2937",
    fontWeight: 800,
    padding: "10px 14px",
    borderRadius: 10,
    cursor: "pointer",
    boxShadow: "0 2px 4px rgba(0,0,0,.1)",
    transition: "all .2s",
  } as React.CSSProperties,
  modal: {
    position: "fixed" as const,
    inset: 0,
    background: "rgba(0,0,0,.55)",
    display: "grid",
    placeItems: "center",
    zIndex: 50,
  } as React.CSSProperties,
  modalCard: {
    width: "min(90vw, 360px)",
    background: "#fff",
    borderRadius: 14,
    border: "1px solid #e5e7eb",
    padding: 18,
    textAlign: "center" as const,
    boxShadow: "0 18px 40px rgba(2,6,23,.18)",
    display: "grid",
    gap: 10,
    justifyItems: "center",
  } as React.CSSProperties,
};
