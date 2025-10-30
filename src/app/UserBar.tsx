"use client";
import { useEffect, useState } from "react";
import supabase from "@/lib/supabase";
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
    supabase.auth.getUser().then(async ({ data }) => {
      setUser(data.user);
      if (data.user) {
        // assicurati che profilo e stats esistano
        await supabase.from("profiles").insert({ id: data.user.id }).select().maybeSingle();
        await supabase.from("user_stats").insert({ user_id: data.user.id }).select().maybeSingle();
        // carica stats
        const { data: st } = await supabase
          .from("user_stats")
          .select("*")
          .eq("user_id", data.user.id)
          .maybeSingle();
        if (st) {
          setStats({
            current_streak: st.current_streak,
            longest_streak: st.longest_streak,
            coins: st.coins,
            last_checkin: st.last_checkin,
          });
        }
      }
    });
  }, []);

  const doCheckin = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("perform_daily_checkin", { reward_coins: 1 });
    setLoading(false);
    if (error) {
      alert(error.message);
      return;
    }
    setStats({
      current_streak: data?.current_streak ?? 0,
      longest_streak: data?.longest_streak ?? 0,
      coins: data?.coins ?? 0,
      last_checkin: data?.last_checkin ?? null,
    });
  };

  const signOut = async () => { await supabase.auth.signOut(); location.reload(); };

  if (!user) {
    return <a href="/login" style={{ padding:"8px 12px", border:"1px solid #ccc", borderRadius:8 }}>Accedi</a>;
  }

  return (
    <div style={{ display:"flex", gap:12, alignItems:"center", padding:"8px 0", flexWrap:"wrap" }}>
      <span>• {user.email}</span>
      <button onClick={doCheckin} disabled={loading} style={{ padding:"6px 10px" }}>
        {loading ? "..." : "Check-in quotidiano"}
      </button>
      <span>
        • Streak: {stats?.current_streak ?? 0}
        {"  "}• Max: {stats?.longest_streak ?? 0}
        {"  "}• Coins: {stats?.coins ?? 0}
      </span>
      <button onClick={signOut} style={{ padding:"6px 10px" }}>Esci</button>
    </div>
  );
}
