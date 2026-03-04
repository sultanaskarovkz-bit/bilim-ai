"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function PracticePage() {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const aiRef = useRef<HTMLDivElement>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [filterSubject, setFilterSubject] = useState("all");
  const [currentQ, setCurrentQ] = useState<any>(null);
  const [answer, setAnswer] = useState<number | null>(null);
  const [correct, setCorrect] = useState<boolean | null>(null);
  const [answered, setAnswered] = useState<string[]>([]);
  const [stats, setStats] = useState({ correct: 0, wrong: 0 });
  const [streak, setStreak] = useState(0);
  const [xp, setXp] = useState(0);
  const [loading, setLoading] = useState(true);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => { init(); }, []);
  useEffect(() => { if (aiExplanation && aiRef.current) setTimeout(() => aiRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 100); }, [aiExplanation]);

  async function init() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push("/"); return; }
    setUserId(session.user.id);

    // Get user's ENT profile
    const { data: entProfile } = await supabase
      .from("user_ent_profile").select("profile_subject_1, profile_subject_2").eq("user_id", session.user.id).single();
    if (!entProfile) { router.push("/ent"); return; }

    // Get all relevant subjects
    const { data: allSubjects } = await supabase.from("subjects").select("*").eq("exam", "ent").eq("is_active", true).order("sort_order");
    const mandatory = (allSubjects || []).filter(s => s.sort_order < 10);
    const profile = (allSubjects || []).filter(s => s.id === entProfile.profile_subject_1 || s.id === entProfile.profile_subject_2);
    const mySubjects = [...mandatory, ...profile];
    setSubjects(mySubjects);

    // Get topics for these subjects
    const subjectIds = mySubjects.map(s => s.id);
    const { data: topics } = await supabase.from("topics").select("id, subject_id").in("subject_id", subjectIds);
    const topicIds = (topics || []).map(t => t.id);

    // Load all questions
    const { data: qs } = await supabase
      .from("questions").select("*, topics(name_ru, subject_id)").eq("is_active", true).in("topic_id", topicIds);

    // Attach subject info to each question
    const enriched = (qs || []).map(q => {
      const t = topics?.find(t => t.id === q.topic_id);
      const s = mySubjects.find(s => s.id === t?.subject_id);
      return { ...q, subject: s };
    });

    // Shuffle
    for (let i = enriched.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [enriched[i], enriched[j]] = [enriched[j], enriched[i]];
    }

    setQuestions(enriched);
    if (enriched.length > 0) setCurrentQ(enriched[0]);
    setLoading(false);
  }

  function getPool() {
    const pool = filterSubject === "all" ? questions : questions.filter(q => q.subject?.id === filterSubject);
    return pool;
  }

  function nextQuestion() {
    setAnswer(null); setCorrect(null); setAiExplanation(null); setAiLoading(false);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    const pool = getPool();
    const available = pool.filter(q => !answered.includes(q.id));
    const next = available.length > 0 ? available[Math.floor(Math.random() * available.length)] : pool[Math.floor(Math.random() * pool.length)];
    setCurrentQ(next);
  }

  async function submitAnswer(index: number) {
    if (answer !== null || !currentQ) return;
    setAnswer(index);
    const isCorrect = index === currentQ.correct_index;
    setCorrect(isCorrect);
    setAnswered(prev => [...prev, currentQ.id]);
    if (isCorrect) { setStats(p => ({ ...p, correct: p.correct + 1 })); setStreak(s => s + 1); setXp(x => x + 10); }
    else { setStats(p => ({ ...p, wrong: p.wrong + 1 })); setStreak(0); }

    // Save to user_answers
    if (userId) {
      await supabase.from("user_answers").insert({
        user_id: userId, question_id: currentQ.id, selected_answer: index,
        is_correct: isCorrect, time_spent_seconds: 0,
      });
      // Update profile XP
      if (isCorrect) {
        const { data: profile } = await supabase.from("profiles").select("total_xp, tasks_today").eq("id", userId).single();
        if (profile) {
          await supabase.from("profiles").update({
            total_xp: (profile.total_xp || 0) + 10,
            tasks_today: (profile.tasks_today || 0) + 1,
            last_activity_date: new Date().toISOString().split("T")[0],
          }).eq("id", userId);
        }
      }
    }
  }

  function cleanAIText(text: string) {
    return text.replace(/\*\*/g, "").replace(/\*/g, "").replace(/#{1,3}\s/g, "").replace(/`/g, "").trim();
  }

  async function askAI() {
    if (aiLoading || aiExplanation || !currentQ) return;
    setAiLoading(true);
    const opts = typeof currentQ.options === "string" ? JSON.parse(currentQ.options) : currentQ.options || [];
    try {
      const res = await fetch("/api/ai-explain", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: currentQ.text_ru, userAnswer: opts[answer!], correctAnswer: opts[currentQ.correct_index],
          topic: currentQ.topics?.name_ru || "ЕНТ", explanation: currentQ.explanation_ru || "",
        }),
      });
      const data = await res.json();
      setAiExplanation(cleanAIText(data.text));
    } catch { setAiExplanation("Ошибка AI. Попробуй позже."); }
    setAiLoading(false);
  }

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <div style={{ fontSize: 48, animation: "bob 1.5s ease-in-out infinite" }}>🎯</div>
    </div>
  );

  if (!currentQ) return (
    <div style={{ textAlign: "center", marginTop: 80 }}>
      <p style={{ fontSize: 18, fontWeight: 800, color: "var(--ink)" }}>Нет вопросов</p>
      <button onClick={() => router.push("/ent")} style={{ marginTop: 16, color: "var(--jade)", fontWeight: 700, background: "none", border: "none", fontSize: 15, cursor: "pointer" }}>Назад</button>
    </div>
  );

  const options = typeof currentQ.options === "string" ? JSON.parse(currentQ.options) : currentQ.options || [];
  const total = stats.correct + stats.wrong;

  return (
    <div ref={scrollRef} style={{ position: "fixed", inset: 0, zIndex: 50, background: "var(--bg)", overflow: "auto", WebkitOverflowScrolling: "touch" as any }}>
      <div style={{ position: "absolute", top: -60, right: -40, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, var(--jade-g) 0%, transparent 70%)", opacity: 0.5, pointerEvents: "none" }} />
      <div style={{ maxWidth: 430, margin: "0 auto", padding: "16px 20px 140px", position: "relative", zIndex: 1 }}>

        {/* Top bar */}
        <div className="animate-in" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <button className="hover-lift" onClick={() => router.push("/ent")} style={{
            width: 42, height: 42, borderRadius: 14, background: "var(--card)",
            border: "1px solid var(--line)", fontSize: 16, color: "var(--mid)",
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
          }}>✕</button>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ background: "var(--jade-g)", padding: "6px 10px", borderRadius: 10, fontSize: 12, fontWeight: 800, color: "var(--jade)" }}>✓ {stats.correct}</div>
            <div style={{ background: "var(--ruby-g)", padding: "6px 10px", borderRadius: 10, fontSize: 12, fontWeight: 800, color: "var(--ruby)" }}>✗ {stats.wrong}</div>
            {streak > 1 && <div style={{ background: "var(--ruby-g)", padding: "6px 10px", borderRadius: 10, fontSize: 12, fontWeight: 800, color: "var(--ruby)" }}>🔥{streak}</div>}
          </div>
        </div>

        {/* Subject filter */}
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 8, marginBottom: 12 }}>
          <button onClick={() => { setFilterSubject("all"); nextQuestion(); }} style={{
            padding: "6px 12px", borderRadius: 10, border: `1.5px solid ${filterSubject === "all" ? "var(--jade)" : "var(--line)"}`,
            background: filterSubject === "all" ? "var(--jade-g)" : "transparent",
            color: filterSubject === "all" ? "var(--jade)" : "var(--pale)",
            fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
          }}>Все</button>
          {subjects.map(s => (
            <button key={s.id} onClick={() => { setFilterSubject(s.id); setAnswer(null); setCorrect(null); setAiExplanation(null);
              const pool = questions.filter(q => q.subject?.id === s.id);
              if (pool.length) setCurrentQ(pool[Math.floor(Math.random() * pool.length)]);
            }} style={{
              padding: "6px 12px", borderRadius: 10, border: `1.5px solid ${filterSubject === s.id ? "var(--jade)" : "var(--line)"}`,
              background: filterSubject === s.id ? "var(--jade-g)" : "transparent",
              color: filterSubject === s.id ? "var(--jade)" : "var(--pale)",
              fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
            }}>
              {s.icon} {s.name_ru}
            </button>
          ))}
        </div>

        {/* Topic badge */}
        <div style={{ marginBottom: 10, display: "flex", gap: 6, alignItems: "center" }}>
          <span style={{ background: "var(--jade-g)", color: "var(--jade)", fontSize: 10, fontWeight: 700, padding: "4px 10px", borderRadius: 8 }}>
            {currentQ.subject?.icon} {currentQ.subject?.name_ru}
          </span>
          <span style={{ background: "var(--royal-g)", color: "var(--royal)", fontSize: 10, fontWeight: 700, padding: "4px 10px", borderRadius: 8 }}>
            {currentQ.topics?.name_ru}
          </span>
        </div>

        {/* Question */}
        <div className="animate-in" style={{ background: "var(--card)", borderRadius: 22, padding: 22, marginBottom: 14, border: "1px solid var(--line)" }}>
          <p style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)", lineHeight: 1.6, fontFamily: "'Outfit', sans-serif" }}>{currentQ.text_ru}</p>
        </div>

        {/* Options */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
          {options.map((opt: string, i: number) => {
            let bg = "var(--card)", bd = "var(--line)", tc = "var(--ink)", ib = "var(--dim)", ic = "var(--mid)";
            if (answer !== null) {
              if (i === currentQ.correct_index) { bg = "var(--forest-g)"; bd = "var(--forest)"; tc = "var(--forest)"; ib = "var(--forest)"; ic = "white"; }
              else if (i === answer && !correct) { bg = "var(--ruby-g)"; bd = "var(--ruby)"; tc = "var(--ruby)"; ib = "var(--ruby)"; ic = "white"; }
            }
            return (
              <button key={i} className="hover-lift" onClick={() => submitAnswer(i)} disabled={answer !== null} style={{
                background: bg, border: `2px solid ${bd}`, borderRadius: 18, padding: "14px 16px",
                textAlign: "left", display: "flex", alignItems: "center", gap: 14, cursor: answer !== null ? "default" : "pointer",
              }}>
                <div style={{ width: 34, height: 34, borderRadius: 11, background: ib, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: ic, flexShrink: 0, transition: "all 0.3s" }}>
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
              background: correct ? "var(--forest-g)" : "var(--ruby-g)", borderRadius: 20, padding: 16, textAlign: "center", marginBottom: 12,
              border: `1px solid ${correct ? "rgba(24,136,94,0.2)" : "rgba(200,62,62,0.2)"}`,
            }}>
              <p style={{ fontSize: 17, fontWeight: 900, color: correct ? "var(--forest)" : "var(--ruby)" }}>
                {correct ? "Правильно! 🎉" : "Неверно 😔"}
              </p>
              {correct && <p style={{ fontSize: 12, fontWeight: 700, color: "var(--forest)", marginTop: 4 }}>+10 XP</p>}
            </div>

            {currentQ.explanation_ru && (
              <div style={{ background: "var(--royal-g)", borderRadius: 20, padding: 16, marginBottom: 12, border: "1px solid rgba(88,64,198,0.08)" }}>
                <p style={{ fontSize: 11, fontWeight: 800, color: "var(--royal)", marginBottom: 4 }}>💡 Объяснение</p>
                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--mid)", lineHeight: 1.6 }}>{currentQ.explanation_ru}</p>
              </div>
            )}

            {!correct && !aiExplanation && (
              <button className="hover-lift" onClick={askAI} disabled={aiLoading} style={{
                width: "100%", padding: 14, borderRadius: 18, border: "none", marginBottom: 12,
                background: aiLoading ? "var(--dim)" : "linear-gradient(135deg, var(--royal), #6C3CE0)",
                color: aiLoading ? "var(--mid)" : "white", fontWeight: 800, fontSize: 14, cursor: aiLoading ? "default" : "pointer",
                boxShadow: aiLoading ? "none" : "0 8px 24px rgba(88,64,198,0.35)",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              }}>
                {aiLoading ? <><span style={{ animation: "bob 1s ease-in-out infinite", fontSize: 18 }}>🤖</span><span>AI думает...</span></> : <><span style={{ fontSize: 18 }}>🤖</span><span>Объясни подробнее с AI</span></>}
              </button>
            )}

            {aiExplanation && (
              <div ref={aiRef} className="animate-in" style={{ background: "var(--card)", borderRadius: 22, padding: 18, marginBottom: 12, border: "2px solid rgba(88,64,198,0.15)", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: 0, width: 4, height: "100%", background: "linear-gradient(180deg, var(--royal), #6C3CE0)", borderRadius: "4px 0 0 4px" }} />
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, paddingLeft: 8 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 11, background: "linear-gradient(135deg, var(--royal), #6C3CE0)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, boxShadow: "0 4px 12px rgba(88,64,198,0.25)" }}>🤖</div>
                  <p style={{ fontSize: 13, fontWeight: 800, color: "var(--royal)" }}>AI Тьютор</p>
                </div>
                <p style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", lineHeight: 1.75, paddingLeft: 8 }}>{aiExplanation}</p>
              </div>
            )}

            <button className="hover-lift" onClick={nextQuestion} style={{
              width: "100%", padding: 16, borderRadius: 18, border: "none",
              background: "linear-gradient(135deg, var(--jade), var(--royal))",
              color: "white", fontWeight: 800, fontSize: 15, cursor: "pointer",
              boxShadow: "0 8px 24px rgba(26,122,104,0.35)",
            }}>Следующий вопрос →</button>
          </div>
        )}

        <p style={{ textAlign: "center", fontSize: 11, color: "var(--pale)", marginTop: 14, fontWeight: 600 }}>
          Решено: {total} | Серия: {streak} | XP: +{xp}
        </p>
      </div>
    </div>
  );
}
