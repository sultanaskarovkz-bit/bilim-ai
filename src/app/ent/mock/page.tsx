"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const BLOCK1_TIME = 100 * 60; // 1h40m
const BLOCK2_TIME = 140 * 60; // 2h20m

export default function MockExamPage() {
  const router = useRouter();
  const timerRef = useRef<any>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [phase, setPhase] = useState<"loading" | "intro" | "block1" | "break" | "block2" | "results">("loading");
  const [subjects, setSubjects] = useState<{ mandatory: any[]; profile: any[] }>({ mandatory: [], profile: [] });
  const [block1Qs, setBlock1Qs] = useState<any[]>([]);
  const [block2Qs, setBlock2Qs] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<string, { selected: number; correct: number; isCorrect: boolean; subjectId: string }>>({});
  const [timer, setTimer] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => { init(); }, []);

  async function init() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push("/"); return; }
    setUserId(session.user.id);

    const { data: entProfile } = await supabase.from("user_ent_profile").select("profile_subject_1, profile_subject_2").eq("user_id", session.user.id).single();
    if (!entProfile) { router.push("/ent"); return; }

    const { data: allSubjects } = await supabase.from("subjects").select("*").eq("exam", "ent").eq("is_active", true).order("sort_order");
    const mandatory = (allSubjects || []).filter(s => s.sort_order < 10);
    const profile = (allSubjects || []).filter(s => s.id === entProfile.profile_subject_1 || s.id === entProfile.profile_subject_2);
    setSubjects({ mandatory, profile });

    // Load topics
    const allIds = [...mandatory, ...profile].map(s => s.id);
    const { data: topics } = await supabase.from("topics").select("id, subject_id").in("subject_id", allIds);

    // Helper: get random N questions for subject
    async function getQsForSubject(subjectId: string, limit: number) {
      const tIds = (topics || []).filter(t => t.subject_id === subjectId).map(t => t.id);
      if (!tIds.length) return [];
      const { data } = await supabase.from("questions").select("*, topics(name_ru, subject_id)").eq("is_active", true).in("topic_id", tIds).limit(200);
      const shuffled = (data || []).sort(() => Math.random() - 0.5);
      return shuffled.slice(0, limit).map(q => ({ ...q, subjectId }));
    }

    // Block 1: history 20, math-lit 10, reading 10
    const histId = mandatory.find(s => s.sort_order === 1)?.id;
    const mlitId = mandatory.find(s => s.sort_order === 2)?.id;
    const readId = mandatory.find(s => s.sort_order === 3)?.id;
    const b1 = [
      ...(await getQsForSubject(histId, 20)),
      ...(await getQsForSubject(mlitId, 10)),
      ...(await getQsForSubject(readId, 10)),
    ];
    setBlock1Qs(b1);

    // Block 2: each profile 40
    const b2 = [
      ...(await getQsForSubject(entProfile.profile_subject_1, 40)),
      ...(await getQsForSubject(entProfile.profile_subject_2, 40)),
    ];
    setBlock2Qs(b2);

    setPhase("intro");
  }

  function startBlock(block: "block1" | "block2") {
    setPhase(block);
    setCurrentIdx(0);
    setSelectedAnswer(null);
    const maxTime = block === "block1" ? BLOCK1_TIME : BLOCK2_TIME;
    setTimer(maxTime);
    timerRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) { clearInterval(timerRef.current); endBlock(block); return 0; }
        return prev - 1;
      });
    }, 1000);
  }

  function endBlock(block: string) {
    clearInterval(timerRef.current);
    if (block === "block1") setPhase("break");
    else finishExam();
  }

  function handleConfirm() {
    if (selectedAnswer === null) return;
    const qs = phase === "block1" ? block1Qs : block2Qs;
    const q = qs[currentIdx];
    if (!q) return;
    setAnswers(prev => ({
      ...prev,
      [q.id]: { selected: selectedAnswer, correct: q.correct_index, isCorrect: selectedAnswer === q.correct_index, subjectId: q.subjectId },
    }));

    // Save answer
    if (userId) {
      supabase.from("user_answers").insert({
        user_id: userId, question_id: q.id, selected_answer: selectedAnswer,
        is_correct: selectedAnswer === q.correct_index, session_id: sessionId,
      });
    }

    setSelectedAnswer(null);
    if (currentIdx < qs.length - 1) { setCurrentIdx(p => p + 1); }
    else { endBlock(phase); }
  }

  function handleSkip() {
    const qs = phase === "block1" ? block1Qs : block2Qs;
    setSelectedAnswer(null);
    if (currentIdx < qs.length - 1) setCurrentIdx(p => p + 1);
    else endBlock(phase);
  }

  async function finishExam() {
    setPhase("results");
    // Save exam session
    if (userId) {
      const scores = calcScores();
      await supabase.from("exam_sessions").insert({
        user_id: userId, exam_type: "ent_mock", status: "completed",
        score_history: scores.history, score_math_lit: scores.mathLit, score_reading: scores.reading,
        profile_subject_1: subjects.profile[0]?.id, profile_subject_2: subjects.profile[1]?.id,
        score_profile_1: scores.profile1, score_profile_2: scores.profile2,
        total_score: scores.total, correct_answers: scores.correctTotal,
        passed: scores.passed, finished_at: new Date().toISOString(),
      });
    }
  }

  function getSubjectScore(subjectId: string) {
    return Object.values(answers).filter(a => a.subjectId === subjectId && a.isCorrect).length;
  }

  function calcScores() {
    const histId = subjects.mandatory.find(s => s.sort_order === 1)?.id || "";
    const mlitId = subjects.mandatory.find(s => s.sort_order === 2)?.id || "";
    const readId = subjects.mandatory.find(s => s.sort_order === 3)?.id || "";
    const p1Id = subjects.profile[0]?.id || "";
    const p2Id = subjects.profile[1]?.id || "";

    const history = getSubjectScore(histId);
    const mathLit = getSubjectScore(mlitId);
    const reading = getSubjectScore(readId);
    const profile1Raw = getSubjectScore(p1Id);
    const profile2Raw = getSubjectScore(p2Id);
    // Profile scoring: 25 single (1pt) + 10 multi (2pt) + 5 match (2pt) = max 50
    // Simplified: approximate 1.25x for profile
    const profile1 = Math.round(profile1Raw * 1.25);
    const profile2 = Math.round(profile2Raw * 1.25);
    const total = history + mathLit + reading + profile1 + profile2;
    const correctTotal = history + mathLit + reading + profile1Raw + profile2Raw;

    const passedHistory = history >= 5;
    const passedMathLit = mathLit >= 3;
    const passedReading = reading >= 3;
    const passedProfile1 = profile1 >= 5;
    const passedProfile2 = profile2 >= 5;
    const passed = passedHistory && passedMathLit && passedReading && passedProfile1 && passedProfile2 && total >= 50;

    return { history, mathLit, reading, profile1, profile2, total, correctTotal, passed,
      thresholds: [
        { name: subjects.mandatory[0]?.name_ru, icon: subjects.mandatory[0]?.icon, score: history, max: 20, threshold: 5, ok: passedHistory },
        { name: subjects.mandatory[1]?.name_ru, icon: subjects.mandatory[1]?.icon, score: mathLit, max: 10, threshold: 3, ok: passedMathLit },
        { name: subjects.mandatory[2]?.name_ru, icon: subjects.mandatory[2]?.icon, score: reading, max: 10, threshold: 3, ok: passedReading },
        { name: subjects.profile[0]?.name_ru, icon: subjects.profile[0]?.icon, score: profile1, max: 50, threshold: 5, ok: passedProfile1 },
        { name: subjects.profile[1]?.name_ru, icon: subjects.profile[1]?.icon, score: profile2, max: 50, threshold: 5, ok: passedProfile2 },
      ],
    };
  }

  const fmt = (s: number) => `${Math.floor(s / 3600)}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  // ========== LOADING ==========
  if (phase === "loading") return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <div style={{ fontSize: 48, animation: "bob 1.5s ease-in-out infinite" }}>📝</div>
    </div>
  );

  // ========== INTRO ==========
  if (phase === "intro") return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "var(--bg)", overflow: "auto" }}>
      <div style={{ maxWidth: 430, margin: "0 auto", padding: "24px 20px 100px" }}>
        <button onClick={() => router.push("/ent")} style={{ padding: "8px 14px", borderRadius: 12, border: "1px solid var(--line)", background: "var(--card)", color: "var(--mid)", fontSize: 13, cursor: "pointer", marginBottom: 24 }}>← Назад</button>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>📝</div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: "var(--ink)", fontFamily: "'Fraunces', serif" }}>Пробный ЕНТ</h2>
          <p style={{ color: "var(--pale)", fontSize: 13 }}>Полная имитация экзамена</p>
        </div>
        <div style={{ background: "var(--card)", borderRadius: 20, padding: 16, border: "1px solid var(--line)", marginBottom: 10 }}>
          <p style={{ color: "var(--jade)", fontSize: 12, fontWeight: 800, marginBottom: 10 }}>БЛОК 1 — Обязательные (1ч 40мин)</p>
          {subjects.mandatory.map(s => (
            <div key={s.id} style={{ display: "flex", justifyContent: "space-between", color: "var(--ink)", fontSize: 13, marginBottom: 4 }}>
              <span>{s.icon} {s.name_ru}</span>
              <span style={{ color: "var(--pale)" }}>{s.sort_order === 1 ? "20" : "10"} вопросов</span>
            </div>
          ))}
        </div>
        <div style={{ background: "var(--card)", borderRadius: 20, padding: 16, border: "1px solid var(--line)", marginBottom: 20 }}>
          <p style={{ color: "var(--royal)", fontSize: 12, fontWeight: 800, marginBottom: 10 }}>БЛОК 2 — Профильные (2ч 20мин)</p>
          {subjects.profile.map(s => (
            <div key={s.id} style={{ display: "flex", justifyContent: "space-between", color: "var(--ink)", fontSize: 13, marginBottom: 4 }}>
              <span>{s.icon} {s.name_ru}</span>
              <span style={{ color: "var(--pale)" }}>40 вопросов</span>
            </div>
          ))}
        </div>
        <div style={{ background: "var(--jade-g)", borderRadius: 14, padding: 12, textAlign: "center", marginBottom: 20, border: "1px solid var(--jade)" }}>
          <p style={{ color: "var(--jade)", fontSize: 13, fontWeight: 800 }}>120 вопросов / 140 баллов / 4 часа</p>
        </div>
        <button onClick={() => startBlock("block1")} className="hover-lift" style={{
          width: "100%", padding: 16, borderRadius: 18, border: "none",
          background: "linear-gradient(135deg, var(--jade), var(--royal))",
          color: "white", fontWeight: 800, fontSize: 16, cursor: "pointer",
          boxShadow: "0 8px 24px rgba(26,122,104,0.35)",
        }}>Начать экзамен 🚀</button>
      </div>
    </div>
  );

  // ========== BREAK ==========
  if (phase === "break") {
    const b1Score = calcScores();
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ maxWidth: 420, padding: 20, textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>☕</div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: "var(--ink)", marginBottom: 6 }}>Блок 1 завершён</h2>
          <p style={{ color: "var(--pale)", fontSize: 13, marginBottom: 16 }}>Промежуточный результат: {b1Score.history + b1Score.mathLit + b1Score.reading}/40</p>
          <div style={{ background: "var(--card)", borderRadius: 18, padding: 14, border: "1px solid var(--line)", marginBottom: 20, textAlign: "left" }}>
            {b1Score.thresholds.slice(0, 3).map((t, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}>
                <span style={{ color: "var(--ink)" }}>{t.icon} {t.name}</span>
                <span style={{ color: t.ok ? "var(--jade)" : "var(--ruby)", fontWeight: 800 }}>{t.score}/{t.max}</span>
              </div>
            ))}
          </div>
          <button onClick={() => startBlock("block2")} className="hover-lift" style={{
            width: "100%", padding: 16, borderRadius: 18, border: "none",
            background: "linear-gradient(135deg, var(--royal), #6C3CE0)",
            color: "white", fontWeight: 800, fontSize: 15, cursor: "pointer",
          }}>Начать Блок 2 →</button>
        </div>
      </div>
    );
  }

  // ========== RESULTS ==========
  if (phase === "results") {
    const scores = calcScores();
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "var(--bg)", overflow: "auto" }}>
        <div style={{ maxWidth: 430, margin: "0 auto", padding: "24px 20px 100px" }}>
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>{scores.passed ? "🎉" : "📊"}</div>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: "var(--ink)", fontFamily: "'Fraunces', serif" }}>Результаты ЕНТ</h2>
            <div style={{
              display: "inline-block", padding: "8px 20px", borderRadius: 12, marginTop: 10,
              background: scores.passed ? "var(--forest-g)" : "var(--ruby-g)",
              border: `1.5px solid ${scores.passed ? "var(--forest)" : "var(--ruby)"}`,
            }}>
              <span style={{ color: scores.passed ? "var(--forest)" : "var(--ruby)", fontSize: 14, fontWeight: 800 }}>
                {scores.passed ? "ЕНТ СДАНО ✓" : "ЕНТ НЕ СДАНО"}
              </span>
            </div>
          </div>

          {/* Total */}
          <div style={{ background: "var(--card)", borderRadius: 22, padding: 22, border: "1px solid var(--line)", textAlign: "center", marginBottom: 14 }}>
            <p style={{ color: "var(--pale)", fontSize: 11 }}>Общий балл</p>
            <p style={{ fontSize: 48, fontWeight: 900, color: "var(--jade)", fontFamily: "'Fraunces', serif", margin: "4px 0" }}>{scores.total}</p>
            <p style={{ color: "var(--pale)", fontSize: 14 }}>из 140</p>
            <div style={{ height: 6, borderRadius: 3, background: "var(--dim)", marginTop: 14 }}>
              <div style={{ height: "100%", borderRadius: 3, width: `${(scores.total / 140) * 100}%`, background: "linear-gradient(90deg, var(--jade), var(--royal))" }} />
            </div>
          </div>

          {/* Per subject */}
          <div style={{ background: "var(--card)", borderRadius: 20, padding: 16, border: "1px solid var(--line)", marginBottom: 14 }}>
            <p style={{ color: "var(--pale)", fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 12 }}>По предметам</p>
            {scores.thresholds.map((t, i) => (
              <div key={i} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ color: "var(--ink)", fontSize: 12 }}>{t.icon} {t.name}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ color: t.ok ? "var(--jade)" : "var(--ruby)", fontSize: 14, fontWeight: 800 }}>{t.score}/{t.max}</span>
                    <span style={{
                      padding: "2px 6px", borderRadius: 4, fontSize: 9, fontWeight: 800,
                      background: t.ok ? "var(--forest-g)" : "var(--ruby-g)", color: t.ok ? "var(--forest)" : "var(--ruby)",
                    }}>{t.ok ? "ПОРОГ ✓" : `ПОРОГ ${t.threshold}`}</span>
                  </div>
                </div>
                <div style={{ height: 4, borderRadius: 2, background: "var(--dim)" }}>
                  <div style={{ height: "100%", borderRadius: 2, width: `${(t.score / t.max) * 100}%`, background: t.ok ? "var(--jade)" : "var(--ruby)" }} />
                </div>
              </div>
            ))}
          </div>

          {/* Grant info */}
          <div style={{ background: "var(--royal-g)", borderRadius: 16, padding: 14, border: "1px solid rgba(88,64,198,0.15)", marginBottom: 14 }}>
            <p style={{ color: "var(--royal)", fontSize: 12, fontWeight: 800, marginBottom: 4 }}>Ориентир для гранта</p>
            <p style={{ color: "var(--mid)", fontSize: 12, lineHeight: 1.5 }}>
              {scores.total >= 100 ? "Ваш результат конкурентоспособен для многих грантов!" : scores.total >= 70 ? "Неплохо, но для гранта нужно набрать больше." : "Нужно усилить подготовку для уверенного поступления."}
            </p>
          </div>

          <button onClick={() => router.push("/ent")} className="hover-lift" style={{
            width: "100%", padding: 16, borderRadius: 18, border: "none",
            background: "linear-gradient(135deg, var(--jade), var(--royal))",
            color: "white", fontWeight: 800, fontSize: 15, cursor: "pointer", marginBottom: 8,
            boxShadow: "0 8px 24px rgba(26,122,104,0.35)",
          }}>На главную</button>
          <button onClick={() => { setAnswers({}); setPhase("intro"); }} style={{
            width: "100%", padding: 14, borderRadius: 18, border: "1px solid var(--line)",
            background: "transparent", color: "var(--mid)", fontSize: 13, cursor: "pointer",
          }}>Пройти ещё раз</button>
        </div>
      </div>
    );
  }

  // ========== EXAM QUESTION (block1 or block2) ==========
  const qs = phase === "block1" ? block1Qs : block2Qs;
  const q = qs[currentIdx];
  if (!q) return null;
  const options = typeof q.options === "string" ? JSON.parse(q.options) : q.options || [];
  const subjectInfo = [...subjects.mandatory, ...subjects.profile].find(s => s.id === q.subjectId);
  const blockLabel = phase === "block1" ? "Блок 1" : "Блок 2";
  const timerDanger = timer < 300;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "var(--bg)", overflow: "auto" }}>
      <div style={{ maxWidth: 430, margin: "0 auto", padding: "12px 20px 120px" }}>

        {/* Timer bar */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "10px 14px", borderRadius: 14, background: "var(--card)",
          border: `1px solid ${timerDanger ? "var(--ruby)" : "var(--line)"}`, marginBottom: 10,
        }}>
          <span style={{ color: "var(--pale)", fontSize: 11 }}>{blockLabel}</span>
          <span style={{ color: timerDanger ? "var(--ruby)" : "var(--jade)", fontSize: 18, fontWeight: 900, fontFamily: "monospace" }}>{fmt(timer)}</span>
          <span style={{ color: "var(--pale)", fontSize: 11 }}>{currentIdx + 1}/{qs.length}</span>
        </div>

        {/* Progress dots */}
        <div style={{ display: "flex", gap: 2, marginBottom: 12, overflowX: "auto", paddingBottom: 4 }}>
          {qs.map((_: any, i: number) => {
            const a = answers[qs[i]?.id];
            let bg = "var(--dim)";
            if (i === currentIdx) bg = "var(--jade)";
            else if (a?.isCorrect) bg = "var(--forest)";
            else if (a && !a.isCorrect) bg = "var(--ruby)";
            return <div key={i} style={{ width: i === currentIdx ? 14 : 5, height: 5, borderRadius: 3, background: bg, flexShrink: 0, transition: "all 0.2s" }} />;
          })}
        </div>

        {/* Subject badge */}
        <span style={{
          background: phase === "block1" ? "var(--jade-g)" : "var(--royal-g)",
          color: phase === "block1" ? "var(--jade)" : "var(--royal)",
          fontSize: 10, fontWeight: 700, padding: "4px 10px", borderRadius: 8, display: "inline-block", marginBottom: 10,
        }}>
          {subjectInfo?.icon} {subjectInfo?.name_ru}
        </span>

        {/* Question */}
        <div style={{ background: "var(--card)", borderRadius: 22, padding: 20, marginBottom: 12, border: "1px solid var(--line)" }}>
          <p style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)", lineHeight: 1.6, fontFamily: "'Outfit', sans-serif" }}>{q.text_ru}</p>
        </div>

        {/* Options */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 12 }}>
          {options.map((opt: string, i: number) => (
            <button key={i} onClick={() => setSelectedAnswer(i)} style={{
              padding: "12px 16px", borderRadius: 16, border: `2px solid ${selectedAnswer === i ? "var(--jade)" : "var(--line)"}`,
              background: selectedAnswer === i ? "var(--jade-g)" : "var(--card)",
              color: selectedAnswer === i ? "var(--jade)" : "var(--ink)",
              fontSize: 14, fontWeight: 700, cursor: "pointer", textAlign: "left", display: "flex", gap: 12, alignItems: "center",
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 800, flexShrink: 0,
                background: selectedAnswer === i ? "var(--jade)" : "var(--dim)",
                color: selectedAnswer === i ? "white" : "var(--mid)",
              }}>{String.fromCharCode(65 + i)}</div>
              {opt}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={handleSkip} style={{
            flex: 1, padding: 14, borderRadius: 14, border: "1px solid var(--line)",
            background: "transparent", color: "var(--mid)", fontSize: 13, cursor: "pointer",
          }}>Пропустить</button>
          <button onClick={handleConfirm} disabled={selectedAnswer === null} style={{
            flex: 2, padding: 14, borderRadius: 14, border: "none",
            background: selectedAnswer !== null ? "linear-gradient(135deg, var(--jade), var(--royal))" : "var(--dim)",
            color: selectedAnswer !== null ? "white" : "var(--pale)",
            fontSize: 14, fontWeight: 800, cursor: selectedAnswer !== null ? "pointer" : "not-allowed",
          }}>Ответить →</button>
        </div>

        <button onClick={() => endBlock(phase)} style={{
          width: "100%", padding: 10, marginTop: 8, borderRadius: 12, border: "1px solid var(--line)",
          background: "transparent", color: "var(--pale)", fontSize: 11, cursor: "pointer",
        }}>Завершить блок досрочно</button>
      </div>
    </div>
  );
}
