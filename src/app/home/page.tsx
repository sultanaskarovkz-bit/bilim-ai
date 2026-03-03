"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function HomePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => { loadProfile(); }, []);

  async function loadProfile() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
    if (data) setProfile(data);
  }

  const xp = profile?.total_xp || 0;
  const streak = profile?.current_streak || 0;
  const today = profile?.tasks_today || 0;
  const level = Math.floor(xp / 100) + 1;

  return (
    <div>
      {/* Header */}
      <div className="animate-in" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <p style={{ color: "var(--pale)", fontSize: 13, fontWeight: 600 }}>
            {"\u{1F44B}"} Салем, {profile?.name || "Student"}
          </p>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 28, color: "var(--ink)", fontWeight: 900, marginTop: 2 }}>Дашборд</h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ background: "var(--gold-g)", borderRadius: 12, padding: "6px 12px", display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ fontSize: 13 }}>{"\u{1F3C6}"}</span>
            <span style={{ fontSize: 11, fontWeight: 800, color: "var(--gold-b)" }}>Lv.{level}</span>
          </div>
          <div style={{ width: 44, height: 44, borderRadius: 15, background: "linear-gradient(135deg, var(--jade), var(--royal))", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 900, fontSize: 19, boxShadow: "0 6px 20px rgba(26,122,104,0.5)" }}>
            {(profile?.name || "S")[0]}
          </div>
        </div>
      </div>

      {/* Hero rank card */}
      <div className="hover-lift animate-in" style={{
        background: "linear-gradient(140deg, var(--jade) 0%, var(--jade-d) 35%, var(--royal-d) 75%, var(--royal) 100%)",
        borderRadius: 28, padding: "24px 22px 20px", marginBottom: 16, position: "relative", overflow: "hidden",
        animationDelay: "0.05s",
      }}>
        <div style={{ position: "absolute", top: -25, right: -25, width: 110, height: 110, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
        <div style={{ position: "absolute", bottom: -35, right: 50, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative" }}>
          <div>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 2 }}>Рейтинг</p>
            <p style={{ color: "var(--gold-a)", fontSize: 34, fontWeight: 900, fontFamily: "'Fraunces', serif", marginTop: 2 }}>{xp.toLocaleString()}</p>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, fontWeight: 600, marginTop: 4 }}>Уровень {level}</p>
          </div>
          <div style={{ animation: "bob 3s ease-in-out infinite" }}>
            <div style={{ width: 64, height: 64, borderRadius: 22, background: "linear-gradient(135deg, var(--gold-a), var(--gold-b))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, boxShadow: "0 8px 28px rgba(244,210,74,0.45)" }}>{"\u{1F3C6}"}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 0, marginTop: 18, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          {[
            { v: String(streak), l: "Серия", i: "\u{1F525}" },
            { v: String(today), l: "Сегодня", i: "\u{1F4DD}" },
            { v: `Lv.${level}`, l: "Уровень", i: "\u{2B50}" },
          ].map((s, i) => (
            <div key={i} style={{ flex: 1, textAlign: "center" }}>
              <p style={{ color: "white", fontSize: 17, fontWeight: 900 }}>{s.i} {s.v}</p>
              <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginTop: 3 }}>{s.l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div className="animate-in" style={{ display: "flex", gap: 12, marginBottom: 14, animationDelay: "0.12s" }}>
        <button className="hover-lift" onClick={() => router.push("/home/question?exam=pdd")} style={{
          flex: 1, background: "linear-gradient(145deg, var(--jade), var(--jade-d))",
          borderRadius: 24, padding: "24px 16px", border: "none", textAlign: "left",
          position: "relative", overflow: "hidden", boxShadow: "0 10px 30px rgba(26,122,104,0.3)",
        }}>
          <div style={{ position: "absolute", top: -12, right: -12, width: 60, height: 60, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
          <span style={{ fontSize: 26 }}>{"\u{1F4DD}"}</span>
          <p style={{ color: "white", fontWeight: 800, fontSize: 16, marginTop: 10, fontFamily: "'Outfit', sans-serif" }}>Тренировка</p>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 11, fontWeight: 600, marginTop: 2 }}>Решай задания</p>
        </button>

        <button className="hover-lift" onClick={() => router.push("/home/question?exam=pdd&mode=exam")} style={{
          flex: 1, background: "linear-gradient(145deg, var(--saffron), var(--saffron-d))",
          borderRadius: 24, padding: "24px 16px", border: "none", textAlign: "left",
          position: "relative", overflow: "hidden", boxShadow: "0 10px 30px rgba(212,139,26,0.3)",
        }}>
          <div style={{ position: "absolute", top: -12, right: -12, width: 60, height: 60, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
          <span style={{ fontSize: 26 }}>{"\u2694\uFE0F"}</span>
          <p style={{ color: "white", fontWeight: 800, fontSize: 16, marginTop: 10, fontFamily: "'Outfit', sans-serif" }}>Пробный</p>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 11, fontWeight: 600, marginTop: 2 }}>Полный экзамен</p>
        </button>
      </div>

      {/* Today stats */}
      <div className="animate-in" style={{
        background: "var(--card)", borderRadius: 24, padding: 20,
        border: "1px solid var(--line)", animationDelay: "0.18s",
      }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "var(--pale)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 14 }}>Статистика</p>
        <div style={{ display: "flex", gap: 10 }}>
          {[
            { icon: "\u{1F525}", value: String(streak), label: "Серия", bg: "var(--ruby-g)", color: "var(--ruby)" },
            { icon: "\u26A1", value: String(today), label: "Сегодня", bg: "var(--saffron-g)", color: "var(--saffron)" },
            { icon: "\u{1F3AF}", value: `${xp}`, label: "XP", bg: "var(--jade-g)", color: "var(--jade)" },
          ].map((s, i) => (
            <div key={i} style={{ flex: 1, background: s.bg, borderRadius: 16, padding: "12px 8px", textAlign: "center" }}>
              <span style={{ fontSize: 16 }}>{s.icon}</span>
              <p style={{ fontSize: 18, fontWeight: 900, color: s.color, marginTop: 2 }}>{s.value}</p>
              <p style={{ fontSize: 9, fontWeight: 700, color: "var(--pale)", textTransform: "uppercase", letterSpacing: 0.8 }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
