"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => { loadProfile(); }, []);

  async function loadProfile() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
    if (data) setProfile(data);
  }

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  if (!profile) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}><div style={{ fontSize: 48, animation: "bob 1.5s ease-in-out infinite" }}>{"\u{1F9E0}"}</div></div>;

  const xp = profile.total_xp || 0;
  const level = Math.floor(xp / 100) + 1;

  return (
    <div>
      {/* Avatar */}
      <div className="animate-in" style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{
          width: 92, height: 92, borderRadius: 32, margin: "0 auto 14px",
          background: "linear-gradient(135deg, var(--jade), var(--royal))",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "white", fontWeight: 900, fontSize: 38, fontFamily: "'Fraunces', serif",
          boxShadow: "0 12px 40px rgba(26,122,104,0.35)",
          border: "3px solid var(--gold-a)",
        }}>{(profile.name || "S")[0]}</div>
        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 26, color: "var(--ink)", fontWeight: 900 }}>{profile.name}</h1>
        <p style={{ color: "var(--pale)", fontSize: 13, marginTop: 4 }}>{profile.email}</p>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 10, background: "var(--gold-g)", borderRadius: 12, padding: "6px 16px" }}>
          <span style={{ fontSize: 14 }}>{"\u{1F3C6}"}</span>
          <span style={{ fontSize: 13, fontWeight: 800, color: "var(--gold-b)" }}>Уровень {level}</span>
        </div>
      </div>

      {/* Stats grid */}
      <div className="animate-in" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20, animationDelay: "0.08s" }}>
        {[
          { l: "Всего XP", v: xp.toLocaleString(), i: "\u26A1", c: "var(--jade)", bg: "var(--jade-g)" },
          { l: "Уровень", v: `Lv.${level}`, i: "\u{1F3C5}", c: "var(--saffron)", bg: "var(--saffron-g)" },
          { l: "Серия", v: `${profile.current_streak || 0} дней`, i: "\u{1F525}", c: "var(--ruby)", bg: "var(--ruby-g)" },
          { l: "Сегодня", v: String(profile.tasks_today || 0), i: "\u{1F3AF}", c: "var(--royal)", bg: "var(--royal-g)" },
        ].map((s, i) => (
          <div key={i} className="hover-lift" style={{
            background: s.bg, borderRadius: 22, padding: "18px 14px", textAlign: "center",
          }}>
            <span style={{ fontSize: 20 }}>{s.i}</span>
            <p style={{ fontSize: 24, fontWeight: 900, color: s.c, marginTop: 4 }}>{s.v}</p>
            <p style={{ fontSize: 10, fontWeight: 700, color: "var(--pale)", textTransform: "uppercase", letterSpacing: 0.8, marginTop: 2 }}>{s.l}</p>
          </div>
        ))}
      </div>

      {/* Achievements */}
      <div className="animate-in" style={{
        background: "var(--card)", borderRadius: 22, padding: 20,
        border: "1px solid var(--line)", marginBottom: 16, animationDelay: "0.14s",
      }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "var(--pale)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 14 }}>Достижения</p>
        <div style={{ display: "flex", gap: 10, justifyContent: "space-between" }}>
          {[
            { i: "\u{1F525}", l: "Серия", bg: "var(--ruby-g)" },
            { i: "\u26A1", l: "Спринтер", bg: "var(--saffron-g)" },
            { i: "\u{1F3AF}", l: "Снайпер", bg: "var(--jade-g)" },
            { i: "\u{1F3C6}", l: "Топ-3", bg: "var(--royal-g)" },
          ].map((a, i) => (
            <div key={i} style={{ textAlign: "center", flex: 1 }}>
              <div className="hover-lift" style={{
                width: 52, height: 52, borderRadius: 18, background: a.bg,
                margin: "0 auto 6px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24,
              }}>{a.i}</div>
              <p style={{ fontSize: 9, fontWeight: 700, color: "var(--pale)" }}>{a.l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Logout */}
      <button className="hover-lift animate-in" onClick={logout} style={{
        width: "100%", padding: 16, borderRadius: 18,
        background: "var(--ruby-g)", border: "none",
        color: "var(--ruby)", fontWeight: 800, fontSize: 14,
        fontFamily: "'Outfit', sans-serif", cursor: "pointer", animationDelay: "0.18s",
      }}>Выйти</button>
    </div>
  );
}
