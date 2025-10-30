"use client";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function UserBar() {
  const supabase = supabaseBrowser();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    fetch("/api/me").then((r) => r.json()).then(setStats).catch(() => {});
  }, [supabase]);

  const doCheckin = async () => {
    setLoading(true);
    const res = await fetch("/api/checkin", { method: "POST" });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      alert(json.error || "Errore");
      return;
    }
    setStats({
      current_streak: json.current_streak,
      longest_streak: json.longest_streak,
      coins: json.coins,
      last_checkin: json.last_checkin,
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    location.reload();
  };

  if (!user)
    return (
      <a href="/login" style={{ padding: "8px 12px", border: "1px solid #ccc", borderRadius: 8 }}>
        Accedi
      </a>
    );

  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center", padding: "8px 0" }}>
      <span>■ {user.email}</span>
      <button onClick={doCheckin} disabled={loading} style={{ padding: "6px 10px" }}>
        {loading ? "..." : "Check-in quotidiano"}
      </button>
      <span>
        ■ {stats?.current_streak ?? 0} • ■ {stats?.longest_streak ?? 0} • ■ {stats?.coins ?? 0}
      </span>
      <button onClick={signOut} style={{ padding: "6px 10px" }}>
        Esci
      </button>
    </div>
  );
}
