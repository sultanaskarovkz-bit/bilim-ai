"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

function QuestionContent() {
  const params = useSearchParams();
  const router = useRouter();
  const exam = params.get("exam") || "pdd";

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
    setLoading(true);
    setAnswer(null);
    setCorrect(null);
    setTimer(0);
    try {
      let query = supabase
        .from("questions")
        .select("*, topics!inner(name_ru, subjects!inner(exam))")
        .eq("topics.subjects.exam", exam)
        .eq("is_active", true)
        .limit(50);

      const { data, error } = await query;
      if (error) throw error;
      if (data && data.length > 0) {
        const available = data.filter(q => !answered.includes(q.id));
        const pool = available.length > 0 ? available : data;
        const random = pool[Math.floor(Math.random() * pool.length)];
        setQuestion(random);
      } else {
        setQuestion(null);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  async function submitAnswer(index: number) {
    if (answer !== null) return;
    setAnswer(index);
    const isCorrect = index === question.correct_index;
    setCorrect(isCorrect);

    if (isCorrect) {
      setStreak(s => s + 1);
      setXp(x => x + 10);
    } else {
      setStreak(0);
    }

    setAnswered(prev => [...prev, question.id]);

    // Save progress to profile
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("total_xp, tasks_today")
          .eq("id", session.user.id)
          .single();

        if (profile) {
          await supabase
            .from("profiles")
            .update({
              total_xp: (profile.total_xp || 0) + (isCorrect ? 10 : 0),
              tasks_today: (profile.tasks_today || 0) + 1,
              last_activity_date: new Date().toISOString().split("T")[0],
            })
            .eq("id", session.user.id);
        }
      }
    } catch (e) {
      console.error("Progress save error:", e);
    }
  }

  function nextQuestion() {
    fetchQuestion();
  }

  if (loading && !question)
    return <div className="text-center mt-20 text-4xl animate-pulse">🧠</div>;

  if (!question)
    return (
      <div className="text-center mt-20">
        <p className="text-xl font-bold">Нет вопросов</p>
        <button onClick={() => router.back()} className="mt-4 text-purple-600 font-bold">Назад</button>
      </div>
    );

  const options = typeof question.options === "string"
    ? JSON.parse(question.options)
    : question.options || [];

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-50 to-purple-50/30 overflow-auto">
      <div className="max-w-[430px] mx-auto px-5 py-4 pb-10">
        <div className="flex justify-between items-center mb-5">
          <button onClick={() => router.back()} className="w-10 h-10 rounded-xl bg-white shadow flex items-center justify-center text-slate-400 font-bold">&#10005;</button>
          <div className="bg-white px-3 py-1.5 rounded-xl shadow text-sm font-bold text-purple-600">
            {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, "0")}
          </div>
          <div className="flex gap-2">
            {streak > 0 && <div className="bg-orange-50 px-3 py-1.5 rounded-xl text-sm font-bold text-orange-500">🔥{streak}</div>}
            <div className="bg-purple-50 px-3 py-1.5 rounded-xl text-sm font-bold text-purple-600">+{xp} XP</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
          <p className="text-xs font-bold text-purple-400 mb-2">{question.topics?.name_ru || "ПДД"}</p>
          <p className="text-base font-bold text-slate-800 leading-relaxed">{question.text_ru}</p>
        </div>

        <div className="space-y-2.5 mb-4">
          {options.map((opt: string, i: number) => {
            let cls = "bg-white border-transparent text-slate-700";
            if (answer !== null) {
              if (i === question.correct_index) cls = "bg-green-50 border-green-400 text-green-700";
              else if (i === answer && !correct) cls = "bg-red-50 border-red-400 text-red-700";
            }
            return (
              <button key={i} onClick={() => submitAnswer(i)} disabled={answer !== null}
                className={`w-full p-4 rounded-2xl border-2 text-left font-semibold text-sm shadow-sm transition-all ${cls}`}>
                {String.fromCharCode(65 + i)}. {opt}
              </button>
            );
          })}
        </div>

        {answer !== null && (
          <div className={`rounded-2xl p-4 mb-4 text-center ${correct ? "bg-green-100" : "bg-red-50"}`}>
            <p className="text-lg font-black">{correct ? "Правильно! 🎉" : "Неверно 😔"}</p>
            {correct && <p className="text-sm font-bold mt-1">+10 XP</p>}
          </div>
        )}

        {answer !== null && question.explanation_ru && (
          <div className="bg-blue-50 rounded-2xl p-4 mb-4">
            <p className="text-sm font-bold text-blue-800 mb-2">Объяснение 🧠</p>
            <p className="text-sm text-blue-700 leading-relaxed">{question.explanation_ru}</p>
          </div>
        )}

        {answer !== null && (
          <button onClick={nextQuestion}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-purple-500 text-white font-bold text-base shadow-lg">
            Следующий вопрос &rarr;
          </button>
        )}

        <p className="text-center text-xs text-slate-400 mt-4">
          Решено: {answered.length} | Серия: {streak}
        </p>
      </div>
    </div>
  );
}

export default function QuestionPage() {
  return (
    <Suspense fallback={<div className="text-center mt-20 text-4xl animate-pulse">🧠</div>}>
      <QuestionContent />
    </Suspense>
  );
}
