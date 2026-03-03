"use client";
import { useEffect, useState, useRef, Suspense } from "react";
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
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const aiRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchQuestion();
    const iv = setInterval(() => setTimer(t => t + 1), 1000);
    return () => clearInterval(iv);
  }, []);

  // Smooth scroll to AI when it appears
  useEffect(() => {
    if (aiExplanation && aiRef.current) {
      setTimeout(() => {
        aiRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    }
  }, [aiExplanation]);

  async function fetchQuestion() {
    setLoading(true); setAnswer(null); setCorrect(null); setTimer(0);
    setAiExplanation(null); setAiLoading(false);
    // Scroll to top on new question
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
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

  function cleanAIText(text: string): string {
    return text
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      .replace(/#{1,3}\s/g, "")
      .replace(/`/g, "")
      .trim();
  }

  async function askAI() {
    if (aiLoading || aiExplanation) return;
    setAiLoading(true);

    const opts = typeof question.options === "string" ? JSON.parse(question.options) : question.options || [];

    try {
      const res = await fetch("/api/ai-explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: question.text_ru,
          userAnswer: opts[answer!],
          correctAnswer: opts[question.correct_index],
          topic: question.topics?.name_ru || "PDD",
          explanation: question.explanation_ru || "",
        })
      });
      const data = await res.json();
      setAiExplanation(cleanAIText(data.text));
    } catch (e) {
      setAiExplanation("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u044F \u043A AI. \u041F\u043E\u043F\u0440\u043E\u0431\u0443\u0439 \u043F\u043E\u0437\u0436\u0435.");
    }
    setAiLoading(false);
  }

  if (loading && !question) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "80vh" }}><div style={{ fontSize: 48, animation: "bob 1.5s ease-in-out infinite" }}>{"\u{1F9E0}"}</div></div>;
  if (!question) return <div style={{ textAlign: "center", marginTop: 80 }}><p style={{ fontSize: 20, fontWeight: 800, color: "var(--ink)" }}>{"\u041D\u0435\u0442 \u0432\u043E\u043F\u0440\u043E\u0441\u043E\u0432"}</p><button onClick={() => router.back()} style={{ marginTop: 16, color: "var(--jade)", fontWeight: 700, background: "none", border: "none", fontSize: 16 }}>{"\u041D\u0430\u0437\u0430\u0434"}</button></div>;

  const options = typeof question.options === "string" ? JSON.parse(question.options) : question.options || [];
  const total = answered.length;

  return (
    <div ref={scrollRef} style={{ position: "fixed", inset: 0, zIndex: 50, background: "var(--bg)", overflow: "auto", WebkitOverflowScrolling: "touch" }}>
      <div style={{ position: "absolute", top: -60, right: -40, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, var(--jade-g) 0%, transparent 70%)", opacity: 0.5, pointerEvents: "none" }} />

      <div style={{ maxWidth: 430, margin: "0 auto", padding: "20px 20px 140px", position: "relative", zIndex: 1 }}>
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

        {/* Topic */}
        <span style={{ background: "var(--jade-g)", color: "var(--jade)", fontSize: 11, fontWeight: 700, padding: "5px 14px", borderRadius: 10, display: "inline-block", marginBottom: 12 }}>
          {question.topics?.name_ru || "PDD"}
        </span>

        {/* Question */}
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
                {correct ? "\u041F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u043E! \u{1F389}" : "\u041D\u0435\u0432\u0435\u0440\u043D\u043E \u{1F614}"}
              </p>
              {correct && <p style={{ fontSize: 13, fontWeight: 700, color: "var(--forest)", marginTop: 4 }}>+10 XP</p>}
            </div>

            {/* Standard explanation */}
            {question.explanation_ru && (
              <div style={{ background: "var(--royal-g)", borderRadius: 20, padding: 18, marginBottom: 12, border: "1px solid rgba(88,64,198,0.08)" }}>
                <p style={{ fontSize: 12, fontWeight: 800, color: "var(--royal)", marginBottom: 6 }}>{"\u{1F4A1}"} {"\u041E\u0431\u044A\u044F\u0441\u043D\u0435\u043D\u0438\u0435"}</p>
                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--mid)", lineHeight: 1.6 }}>{question.explanation_ru}</p>
              </div>
            )}

            {/* AI button - only on wrong answer */}
            {!correct && !aiExplanation && (
              <button className="hover-lift" onClick={askAI} disabled={aiLoading} style={{
                width: "100%", padding: 16, borderRadius: 18, border: "none", marginBottom: 12,
                background: aiLoading
                  ? "var(--dim)"
                  : "linear-gradient(135deg, var(--royal), #6C3CE0)",
                color: aiLoading ? "var(--mid)" : "white", fontWeight: 800, fontSize: 14,
                fontFamily: "'Outfit', sans-serif", cursor: aiLoading ? "default" : "pointer",
                boxShadow: aiLoading ? "none" : "0 8px 24px rgba(88,64,198,0.35)",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              }}>
                {aiLoading ? (
                  <>
                    <span style={{ animation: "bob 1s ease-in-out infinite", fontSize: 18 }}>{"\u{1F916}"}</span>
                    <span>AI {"\u0434\u0443\u043C\u0430\u0435\u0442"}...</span>
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: 18 }}>{"\u{1F916}"}</span>
                    <span>{"\u041E\u0431\u044A\u044F\u0441\u043D\u0438 \u043F\u043E\u0434\u0440\u043E\u0431\u043D\u0435\u0435 \u0441 AI"}</span>
                  </>
                )}
              </button>
            )}

            {/* AI explanation */}
            {aiExplanation && (
              <div ref={aiRef} className="animate-in" style={{
                background: "var(--card)",
                borderRadius: 22, padding: 20, marginBottom: 12,
                border: "2px solid rgba(88,64,198,0.15)",
                position: "relative", overflow: "hidden",
              }}>
                {/* Decorative accent line */}
                <div style={{ position: "absolute", top: 0, left: 0, width: 4, height: "100%", background: "linear-gradient(180deg, var(--royal), #6C3CE0)", borderRadius: "4px 0 0 4px" }} />

                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, paddingLeft: 8 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 12,
                    background: "linear-gradient(135deg, var(--royal), #6C3CE0)",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
                    boxShadow: "0 4px 12px rgba(88,64,198,0.25)",
                  }}>{"\u{1F916}"}</div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 800, color: "var(--royal)" }}>AI {"\u0422\u044C\u044E\u0442\u043E\u0440"}</p>
                  </div>
                </div>
                <p style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)", lineHeight: 1.75, paddingLeft: 8 }}>
                  {aiExplanation}
                </p>
              </div>
            )}

            {/* Next button */}
            <button className="hover-lift" onClick={fetchQuestion} style={{
              width: "100%", padding: 16, borderRadius: 18, border: "none",
              background: "linear-gradient(135deg, var(--jade), var(--royal))",
              color: "white", fontWeight: 800, fontSize: 15, fontFamily: "'Outfit', sans-serif",
              boxShadow: "0 8px 24px rgba(26,122,104,0.35)", cursor: "pointer",
            }}>{"\u0421\u043B\u0435\u0434\u0443\u044E\u0449\u0438\u0439 \u0432\u043E\u043F\u0440\u043E\u0441"} {"\u2192"}</button>
          </div>
        )}

        <p style={{ textAlign: "center", fontSize: 12, color: "var(--pale)", marginTop: 16, fontWeight: 600 }}>
          {"\u0420\u0435\u0448\u0435\u043D\u043E"}: {total} | {"\u0421\u0435\u0440\u0438\u044F"}: {streak}
        </p>
      </div>
    </div>
  );
}

export default function QuestionPage() {
  return (<Suspense fallback={<div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}><div style={{ fontSize: 48, animation: "bob 1.5s ease-in-out infinite" }}>{"\u{1F9E0}"}</div></div>}><QuestionContent /></Suspense>);
}
