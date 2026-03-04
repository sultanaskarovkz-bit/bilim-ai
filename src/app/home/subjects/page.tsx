"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function SubjectsPage() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [topicStats, setTopicStats] = useState<Record<string, { correct: number; total: number }>>({});

  useEffect(() => { loadSubjects(); loadStats(); }, []);

  async function loadSubjects() {
    const { data } = await supabase.from("subjects").select("*, topics(id, name_ru)").eq("is_active", true).order("sort_order");
    if (data) { setSubjects(data); if (data.length > 0) setSelected(data[0].exam); }
  }

  async function loadStats() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data } = await supabase.from("user_answers").select("is_correct, questions(topic_id)").eq("user_id", session.user.id);
    if (data) {
      const stats: Record<string, { correct: number; total: number }> = {};
      data.forEach((a: any) => {
        const tid = a.questions?.topic_id;
        if (!tid) return;
        if (!stats[tid]) stats[tid] = { correct: 0, total: 0 };
        stats[tid].total++;
        if (a.is_correct) stats[tid].correct++;
      });
      setTopicStats(stats);
    }
  }

  const colors = ["var(--jade)", "var(--saffron)", "var(--royal)", "var(--ruby)"];

  return (
    <div>
      <h1 className="animate-in" style={{ fontFamily: "'Fraunces', serif", fontSize: 28, color: "var(--ink)", fontWeight: 900, marginBottom: 20 }}>Предметы</h1>

      <div className="animate-in" style={{ display: "flex", gap: 8, marginBottom: 20, overflowX: "auto", paddingBottom: 4, animationDelay: "0.04s" }}>
        {subjects.map((s, i) => (
          <button key={s.id} className="hover-lift" onClick={() => setSelected(s.exam)} style={{
            background: selected === s.exam ? "linear-gradient(135deg, var(--jade), var(--royal))" : "var(--card)",
            color: selected === s.exam ? "white" : "var(--mid)",
            border: selected === s.exam ? "none" : "1px solid var(--line)",
            borderRadius: 14, padding: "10px 22px", fontSize: 13, fontWeight: 800,
            fontFamily: "'Outfit', sans-serif", whiteSpace: "nowrap",
            boxShadow: selected === s.exam ? "0 4px 16px rgba(26,122,104,0.3)" : "none",
          }}>
            {s.icon || "\u{1F4DA}"} {s.name_ru}
          </button>
        ))}
      </div>

      {subjects.filter(s => s.exam === selected).map(s => (
        <div key={s.id}>
          {(s.topics || []).map((t: any, i: number) => {
            const pct = topicStats[t.id] ? Math.round(100 * topicStats[t.id].correct / Math.max(topicStats[t.id].total, 1)) : 0;
            return (
              <div key={t.id} className="hover-lift animate-in" style={{
                background: "var(--card)", borderRadius: 22, padding: "16px 18px", marginBottom: 10,
                border: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 14,
                animationDelay: `${0.06 + i * 0.04}s`,
              }}>
                <div style={{
                  width: 50, height: 50, borderRadius: 17,
                  background: `${colors[i % colors.length]}12`,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
                }}>
                  {["\u{1F6B8}", "\u{1F4CB}", "\u{1F500}", "\u26A1", "\u{1F6E3}\uFE0F", "\u{1F6A6}", "\u{1F6E1}\uFE0F", "\u{1F4B0}"][i] || "\u{1F4DA}"}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 800, color: "var(--ink)" }}>{t.name_ru}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 5 }}>
                    <div style={{ flex: 1, height: 5, background: "var(--dim)", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, borderRadius: 3, background: colors[i % colors.length], transition: "width 0.5s" }} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "var(--pale)" }}>{pct}%</span>
                  </div>
                </div>
              </div>
            );
          })}

          <button className="hover-lift" onClick={() => router.push("/home/question?exam=" + s.exam)} style={{
            width: "100%", padding: 16, borderRadius: 18, border: "none", marginTop: 6,
            background: "linear-gradient(135deg, var(--jade), var(--royal))",
            color: "white", fontWeight: 800, fontSize: 15, fontFamily: "'Outfit', sans-serif",
            boxShadow: "0 8px 24px rgba(26,122,104,0.35)", cursor: "pointer",
          }}>Начать тренировку</button>
        </div>
      ))}

      {subjects.length === 0 && <p style={{ textAlign: "center", color: "var(--pale)", marginTop: 40 }}>Загрузка...</p>}
    </div>
  );
}
