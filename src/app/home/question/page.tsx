"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

function QuestionContent() {
  const params = useSearchParams();
  const router = useRouter();
  const [question, setQuestion] = useState<any>(null);
  const [answer, setAnswer] = useState<number | null>(null);
  const [correct, setCorrect] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [timer, setTimer] = useState(0);
  const [streak, setStreak] = useState(0);
  const [xp, setXp] = useState(0);
  const [answered, setAnswered] = useState<string[]>([]);

  useEffect(() => {
    fetchQuestion();
    const iv = setInterval(() => setTimer(t => t + 1), 1000);
    return () => clearInterval(iv);
  }, []);

  async function fetchQuestion() {
    setLoading(true); setAnswer(null); setCorrect(null); setTimer(0);
    try {
      const { data, error } = await supabase.from("questions").select("*, topics(name_ru)").eq("is_active", true).limit(50);
      if (error) throw error;
      if (data && data.length > 0) {
        const available = data.filter(q => !answered.includes(q.id));
        const pool = available.length > 0 ? available : data;
        setQuestion(pool[Math.floor(Math.random() * pool.length)]);
      } else { setQuestion(null); }
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function submitAnswer(index: number) {
    if (answer !== null) return;
    setAnswer(index);
    const isCorrect = index === question.correct_index;
    setCorrect(isCorrect);
    if (isCorrect) { setStreak(s => s + 1); setXp(x => x + 10); } else { setStreak(0); }
    setAnswered(prev => [...prev, question.id]);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase.from("profiles").select("total_xp, tasks_today").eq("id", session.user.id).single();
        if (profile) {
          await supabase.from("profiles").update({
            total_xp: (profile.total_xp || 0) + (isCorrect ? 10 : 0),
            tasks_today: (profile.tasks_today || 0) + 1,
            last_activity_date: new Date().toISOString().split("T")[0],
          }).eq("id", session.user.id);
        }
      }
    } catch (e) { console.error(e); }
  }

  if (loading && !question) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "80vh" }}><div style={{ fontSize: 48, animation: "bob 1.5s ease-in-out infinite" }}>{"\u{1F9E0}"}</div></div>;
  if (!question) return <div style={{ textAlign: "center", marginTop: 80 }}><p style={{ fontSize: 20, fontWeight: 800, color: "var(--ink)" }}>Нет вопросов</p><button onClick={() => router.back()} style={{ marginTop: 16, color: "var(--jade)", fontWeight: 700, background: "none", border: "none", fontSize: 16 }}>Назад</button></div>;

  const options = typeof question.options === "string" ? JSON.parse(question.options) : question.options || [];
  const total = answered.length;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "var(--bg)", overflow: "auto" }}>
      {/* Ambient */}
      <div style={{ position: "absolute", top: -60, right: -40, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, var(--jade-g) 0%, transparent 70%)", opacity: 0.5, pointerEvents: "none" }} />

      <div style={{ maxWidth: 430, margin: "0 auto", padding: "20px 20px 40px", position: "relative", zIndex: 1 }}>
        {/* Top bar */}
        <div className="animate-in" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <button className="hover-lift" onClick={() => router.back()} style={{
            width: 42, height: 42, borderRadius: 14, background: "var(--card)",
            border: "1px solid var(--line)", fontSize: 16, color: "var(--mid)",
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
          }}>{"\u2715"}</button>
          <div style={{ background: "var(--card)", padding: "7px 16px", borderRadius: 12, fontSize: 14, fontWeight: 800, color: "var(--royal)", border: "1px solid var(--line)" }}>
            {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, "0")}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {streak > 0 && <div style={{ background: "var(--ruby-g)", padding: "6px 10px", borderRadius: 10, fontSize: 12, fontWeight: 800, color: "var(--ruby)" }}>{"\u{1F525}"}{streak}</div>}
            <div style={{ background: "var(--jade-g)", padding: "6px 10px", borderRadius: 10, fontSize: 12, fontWeight: 800, color: "var(--jade)" }}>+{xp}</div>
          </div>
        </div>

        {/* Progress */}
        <div style={{ height: 5, background: "var(--dim)", borderRadius: 3, marginBottom: 22, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${Math.min((total / 50) * 100, 100)}%`, borderRadius: 3, background: "linear-gradient(90deg, var(--jade), var(--royal))", transition: "width 0.8s" }} />
        </div>

        {/* Topic tag */}
        <span style={{ background: "var(--jade-g)", color: "var(--jade)", fontSize: 11, fontWeight: 700, padding: "5px 14px", borderRadius: 10, display: "inline-block", marginBottom: 12 }}>
          {question.topics?.name_ru || "PDD"}
        </span>

        {/* Question card */}
        <div className="animate-in" style={{ background: "var(--card)", borderRadius: 24, padding: 24, marginBottom: 16, border: "1px solid var(--line)" }}>
          <p style={{ fontSize: 17, fontWeight: 800, color: "var(--ink)", lineHeight: 1.55, fontFamily: "'Outfit', sans-serif" }}>{question.text_ru}</p>
        </div>

        {/* Options */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
          {options.map((opt: string, i: number) => {
            let bg = "var(--card)", bd = "var(--line)", tc = "var(--ink)", ib = "var(--dim)", ic = "var(--mid)";
            if (answer !== null) {
              if (i === question.correct_index) { bg = "var(--forest-g)"; bd = "var(--forest)"; tc = "var(--forest)"; ib = "var(--forest)"; ic = "white"; }
              else if (i === answer && !correct) { bg = "var(--ruby-g)"; bd = "var(--ruby)"; tc = "var(--ruby)"; ib = "var(--ruby)"; ic = "white"; }
            }
            return (
              <button key={i} className="hover-lift" onClick={() => submitAnswer(i)} disabled={answer !== null} style={{
                background: bg, border: `2px solid ${bd}`, borderRadius: 18, padding: "14px 16px",
                textAlign: "left", display: "flex", alignItems: "center", gap: 14,
                fontFamily: "'Nunito', sans-serif", cursor: answer !== null ? "default" : "pointer",
              }}>
                <div style={{ width: 34, height: 34, borderRadius: 11, background: ib, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: ic, transition: "all 0.3s" }}>
                  {String.fromCharCode(65 + i)}
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: tc }}>{opt}</span>
              </button>
            );
          })}
        </div>

        {/* Result */}
        {answer !== null && (
          <div className="animate-in">
            <div style={{
              background: correct ? "var(--forest-g)" : "var(--ruby-g)",
              borderRadius: 20, padding: 18, textAlign: "center", marginBottom: 12,
              border: `1px solid ${correct ? "rgba(24,136,94,0.2)" : "rgba(200,62,62,0.2)"}`,
            }}>
              <p style={{ fontSize: 18, fontWeight: 900, color: correct ? "var(--forest)" : "var(--ruby)" }}>
                {correct ? "Правильно! \u{1F389}" : "Неверно \u{1F614}"}
              </p>
              {correct && <p style={{ fontSize: 13, fontWeight: 700, color: "var(--forest)", marginTop: 4 }}>+10 XP</p>}
            </div>

            {question.explanation_ru && (
              <div style={{ background: "var(--royal-g)", borderRadius: 20, padding: 18, marginBottom: 16, border: "1px solid rgba(88,64,198,0.08)" }}>
                <p style={{ fontSize: 12, fontWeight: 800, color: "var(--royal)", marginBottom: 6 }}>{"\u{1F4A1}"} Объяснение</p>
                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--mid)", lineHeight: 1.6 }}>{question.explanation_ru}</p>
              </div>
            )}

            <button className="hover-lift" onClick={fetchQuestion} style={{
              width: "100%", padding: 16, borderRadius: 18, border: "none",
              background: "linear-gradient(135deg, var(--jade), var(--royal))",
              color: "white", fontWeight: 800, fontSize: 15, fontFamily: "'Outfit', sans-serif",
              boxShadow: "0 8px 24px rgba(26,122,104,0.35)", cursor: "pointer",
            }}>Следующий вопрос {"\u2192"}</button>
          </div>
        )}

        <p style={{ textAlign: "center", fontSize: 12, color: "var(--pale)", marginTop: 16, fontWeight: 600 }}>
          Решено: {total} | Серия: {streak}
        </p>
      </div>
    </div>
  );
}

export default function QuestionPage() {
  return (<Suspense fallback={<div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}><div style={{ fontSize: 48, animation: "bob 1.5s ease-in-out infinite" }}>{"\u{1F9E0}"}</div></div>}><QuestionContent /></Suspense>);
}
