"use client";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

type Stats = {
  current_streak: number | null;
  longest_streak: number | null;
  coins: number | null;
  last_checkin: string | null;
};

export default function UserBar() {
  const supabase = supabaseBrowser();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      setUser(u.user ?? null);
      if (!u.user) return;

      // crea record minimi se mancano
      await supabase.from("profiles").insert({ id: u.user.id }).select().maybeSingle().catch(() => {});
      await supabase.from("user_stats").insert({ user_id: u.user.id }).select().maybeSingle().catch(() => {});

      // leggi stats
      const { data } = await supabase
        .from("user_stats")
        .select("current_streak,longest_streak,coins,last_checkin")
        .eq("user_id", u.user.id)
        .maybeSingle();

      setStats(data as Stats | null);
    })();
  }, [supabase]);

  const doCheckin = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("perform_daily_checkin", { reward_coins: 1 });
    setLoading(false);
    if (error) {
      alert(error.message || "Errore nel check-in");
      return;
    }
    const row = data && data[0];
    if (row) {
      setStats({
        current_streak: row.current_streak ?? 0,
        longest_streak: row.longest_streak ?? 0,
        coins: row.coins ?? 0,
        last_checkin: row.last_checkin ?? null,
      });
    }
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
      <button onClick={signOut} style={{ padding: "6px 10px" }}>Esci</button>
    </div>
  );
}
