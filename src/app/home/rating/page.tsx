"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function RatingPage() {
  const [leaders, setLeaders] = useState<any[]>([]);
  const [myId, setMyId] = useState<string | null>(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) setMyId(session.user.id);
    const { data } = await supabase.from("profiles").select("id, name, total_xp, current_streak").order("total_xp", { ascending: false }).limit(20);
    if (data) setLeaders(data);
  }

  const top3 = leaders.slice(0, 3);
  const rest = leaders.slice(3);
  // Reorder for podium: [2nd, 1st, 3rd]
  const podium = top3.length >= 3 ? [top3[1], top3[0], top3[2]] : top3;

  return (
    <div>
      {/* Header */}
      <div className="animate-in" style={{
        background: "linear-gradient(155deg, #6C3CE0 0%, var(--royal-d) 25%, #1A3A6C 50%, var(--jade-d) 75%, var(--jade) 100%)",
        borderRadius: 30, padding: "28px 22px 24px", marginBottom: 20, position: "relative", overflow: "hidden",
      }}>
        {/* Floating orbs */}
        <div style={{ position: "absolute", top: 15, right: 20, width: 80, height: 80, borderRadius: "50%", background: "radial-gradient(circle,rgba(247,210,74,0.2),transparent)", animation: "bob 4s ease-in-out infinite", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: 10, left: 15, width: 50, height: 50, borderRadius: "50%", background: "radial-gradient(circle,rgba(26,122,104,0.25),transparent)", animation: "bob 3s ease-in-out infinite 1s", pointerEvents: "none" }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
            <div>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 2.5 }}>Сезон 1</p>
              <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 30, color: "white", fontWeight: 900, marginTop: 6 }}>Рейтинг</h1>
            </div>
          </div>

          <div style={{
            background: "rgba(255,255,255,0.08)", borderRadius: 22, padding: "16px 20px",
            display: "flex", alignItems: "center", gap: 16,
            border: "1px solid rgba(255,255,255,0.06)",
          }}>
            <div style={{
              width: 54, height: 54, borderRadius: 18,
              background: "linear-gradient(135deg, var(--gold-a), var(--gold-b))",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28,
              boxShadow: "0 6px 20px rgba(244,210,74,0.4)", animation: "bob 3s ease-in-out infinite",
            }}>{"\u{1F3C6}"}</div>
            <div style={{ flex: 1 }}>
              <p style={{ color: "var(--gold-a)", fontSize: 18, fontWeight: 900, fontFamily: "'Fraunces', serif" }}>Лидерборд</p>
              <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, fontWeight: 600, marginTop: 3 }}>Соревнуйся с другими игроками</p>
            </div>
          </div>
        </div>
      </div>

      {/* Podium */}
      {podium.length >= 3 && (
        <div className="animate-in" style={{ display: "flex", gap: 6, marginBottom: 20, alignItems: "flex-end", padding: "0 4px", animationDelay: "0.1s" }}>
          {podium.map((u: any, i: number) => {
            const rank = i === 0 ? 2 : i === 1 ? 1 : 3;
            const isMe = u.id === myId;
            const h = rank === 1 ? 120 : rank === 2 ? 90 : 75;
            const grad = rank === 1 ? "linear-gradient(180deg, var(--gold-a), #B8910E)" : rank === 2 ? "linear-gradient(180deg, #C8C8D0, #9898A8)" : "linear-gradient(180deg, #D4A058, #B88040)";
            const emoji = rank === 1 ? "\u{1F947}" : rank === 2 ? "\u{1F948}" : "\u{1F949}";
            return (
              <div key={u.id} style={{ flex: 1, textAlign: "center" }}>
                <div style={{ position: "relative", display: "inline-block", marginBottom: 8 }}>
                  <div style={{
                    width: rank === 1 ? 56 : 46, height: rank === 1 ? 56 : 46,
                    borderRadius: rank === 1 ? 20 : 16,
                    background: isMe ? "linear-gradient(135deg, var(--jade), var(--royal))" : "var(--dim)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: isMe ? "white" : "var(--mid)", fontWeight: 900, fontSize: rank === 1 ? 22 : 17,
                    border: rank === 1 ? "3px solid var(--gold-a)" : "2px solid var(--line)",
                    boxShadow: isMe ? "0 8px 24px rgba(26,122,104,0.5)" : "none",
                  }}>{(u.name || "?")[0]}</div>
                  {rank === 1 && <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", fontSize: 16, animation: "bob 2s ease-in-out infinite" }}>{"\u{1F451}"}</div>}
                </div>
                <p style={{ fontSize: 12, fontWeight: isMe ? 900 : 700, color: isMe ? "var(--jade)" : "var(--ink)", marginBottom: 8 }}>{u.name || "Student"}</p>
                <div style={{
                  height: h, borderRadius: "20px 20px 8px 8px", background: grad,
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6,
                  boxShadow: rank === 1 ? "0 8px 28px rgba(244,210,74,0.35)" : "none",
                  position: "relative", overflow: "hidden",
                }}>
                  {rank === 1 && <div style={{ position: "absolute", top: 0, width: "30%", height: "100%", background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.25),transparent)", animation: "sweep 2.5s ease-in-out infinite" }} />}
                  <span style={{ fontSize: 30, position: "relative" }}>{emoji}</span>
                  <p style={{ fontWeight: 900, fontSize: 12, color: "rgba(255,255,255,0.95)", position: "relative" }}>{(u.total_xp || 0).toLocaleString()}</p>
                  <p style={{ fontWeight: 700, fontSize: 9, color: "rgba(255,255,255,0.5)", position: "relative" }}>XP</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* My position */}
      {myId && leaders.find(l => l.id === myId) && (() => {
        const idx = leaders.findIndex(l => l.id === myId);
        const me = leaders[idx];
        return (
          <div className="hover-lift animate-in" style={{
            background: "linear-gradient(135deg, rgba(26,122,104,0.07), rgba(88,64,198,0.05))",
            borderRadius: 20, padding: "14px 16px", marginBottom: 14,
            border: "2px solid rgba(26,122,104,0.2)", display: "flex", alignItems: "center", gap: 12,
            animationDelay: "0.15s",
          }}>
            <div style={{ width: 30, height: 30, borderRadius: 10, background: "linear-gradient(135deg, var(--jade), var(--royal))", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 900, fontSize: 13 }}>#{idx + 1}</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 800, color: "var(--ink)" }}>
                {me.name || "Student"}
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--jade)", background: "var(--jade-g)", padding: "1px 8px", borderRadius: 6, marginLeft: 6 }}>Это ты</span>
              </p>
              <p style={{ fontSize: 11, fontWeight: 600, color: "var(--pale)", marginTop: 2 }}>{(me.total_xp || 0).toLocaleString()} XP</p>
            </div>
          </div>
        );
      })()}

      {/* Rest of leaderboard */}
      {rest.map((u: any, i: number) => {
        const isMe = u.id === myId;
        return (
          <div key={u.id} className="hover-lift animate-in" style={{
            background: isMe ? "rgba(26,122,104,0.04)" : "var(--card)",
            borderRadius: 18, padding: "12px 14px", marginBottom: 8,
            display: "flex", alignItems: "center", gap: 10,
            border: `1px solid ${isMe ? "rgba(26,122,104,0.15)" : "var(--line)"}`,
            animationDelay: `${0.18 + i * 0.03}s`,
          }}>
            <span style={{ fontSize: 13, fontWeight: 900, width: 26, textAlign: "center", color: "var(--pale)" }}>#{i + 4}</span>
            <div style={{
              width: 36, height: 36, borderRadius: 12,
              background: isMe ? "linear-gradient(135deg, var(--jade), var(--royal))" : "var(--dim)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 800, color: isMe ? "white" : "var(--mid)", fontSize: 14,
            }}>{(u.name || "?")[0]}</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>{u.name || "Student"}</p>
              <p style={{ fontSize: 11, fontWeight: 600, color: "var(--pale)" }}>{(u.total_xp || 0).toLocaleString()} XP</p>
            </div>
          </div>
        );
      })}

      {leaders.length === 0 && <p style={{ textAlign: "center", color: "var(--pale)", marginTop: 40 }}>Загрузка...</p>}
    </div>
  );
}
