"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { callFunction } from "@/lib/supabase";

function QuestionContent() {
  const params = useSearchParams();
  const router = useRouter();
  const exam = params.get("exam") || "ent";

  const [question, setQuestion] = useState<any>(null);
  const [answer, setAnswer] = useState<number | null>(null);
  const [result, setResult] = useState<any>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [timer, setTimer] = useState(0);
  const [streak, setStreak] = useState(0);

  useEffect(() => { fetchQuestion(); const iv = setInterval(() => setTimer(t => t+1), 1000); return () => clearInterval(iv); }, []);

  async function fetchQuestion() {
    setLoading(true); setAnswer(null); setResult(null); setExplanation(null); setTimer(0);
    try { const d = await callFunction("get-question", { exam }); setQuestion(d.question); } catch(e) { console.error(e); }
    setLoading(false);
  }

  async function submitAnswer(index: number) {
    if (answer !== null) return;
    setAnswer(index);
    try {
      const d = await callFunction("submit-answer", { question_id: question.id, selected_index: index, time_spent_sec: timer });
      setResult(d); setStreak(d.streak || 0);
      if (d.explanation) setExplanation(d.explanation);
      else if (d.needs_ai_explanation) {
        const exp = await callFunction("get-explanation", { question_id: question.id, selected_index: index });
        setExplanation(exp.explanation);
      }
    } catch(e) { console.error(e); }
  }

  if (loading && !question) return <div className="text-center mt-20 text-4xl animate-pulse">🧠</div>;
  if (!question) return <div className="text-center mt-20"><p className="text-xl font-bold">Нет вопросов</p><button onClick={() => router.back()} className="mt-4 text-purple-600 font-bold">Назад</button></div>;

  const options = question.options || [];

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-50 to-purple-50/30 overflow-auto">
      <div className="max-w-[430px] mx-auto px-5 py-4 pb-10">
        <div className="flex justify-between items-center mb-5">
          <button onClick={() => router.back()} className="w-10 h-10 rounded-xl bg-white shadow flex items-center justify-center text-slate-400 font-bold">&#10005;</button>
          <div className="bg-white px-3 py-1.5 rounded-xl shadow text-sm font-bold text-purple-600">{Math.floor(timer/60)}:{(timer%60).toString().padStart(2,"0")}</div>
          {streak > 0 && <div className="bg-orange-50 px-3 py-1.5 rounded-xl text-sm font-bold text-orange-500">🔥{streak}</div>}
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
          <p className="text-base font-bold text-slate-800 leading-relaxed">{question.text_ru}</p>
          {question.image_url && <img src={question.image_url} alt="" className="mt-3 rounded-xl max-h-48 w-full object-contain" />}
        </div>

        <div className="space-y-2.5 mb-4">
          {options.map((opt: any, i: number) => {
            const text = typeof opt === "string" ? opt : opt.ru || opt.text || JSON.stringify(opt);
            let cls = "bg-white border-transparent text-slate-700";
            if (answer !== null) {
              if (i === result?.correct_index) cls = "bg-green-50 border-green-400 text-green-700";
              else if (i === answer && !result?.correct) cls = "bg-red-50 border-red-400 text-red-700";
            }
            return (
              <button key={i} onClick={() => submitAnswer(i)} disabled={answer !== null}
                className={`w-full p-4 rounded-2xl border-2 text-left font-semibold text-sm shadow-sm transition-all ${cls}`}>
                {String.fromCharCode(65+i)}. {text}
              </button>
            );
          })}
        </div>

        {result && (
          <div className={`rounded-2xl p-4 mb-4 text-center ${result.correct ? "bg-green-100" : "bg-red-50"}`}>
            <p className="text-lg font-black">{result.correct ? "Правильно! 🎉" : "Неверно 😔"}</p>
            <p className="text-sm font-bold mt-1">+{result.xp} XP{result.multiplier > 1 ? " (x" + result.multiplier + ")" : ""}</p>
          </div>
        )}

        {explanation && (
          <div className="bg-blue-50 rounded-2xl p-4 mb-4">
            <p className="text-sm font-bold text-blue-800 mb-2">Объяснение 🧠</p>
            <p className="text-sm text-blue-700 leading-relaxed">{explanation}</p>
          </div>
        )}

        {answer !== null && (
          <button onClick={fetchQuestion} className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-purple-500 text-white font-bold text-base shadow-lg">
            Следующее &rarr;
          </button>
        )}
      </div>
    </div>
  );
}

export default function QuestionPage() {
  return <Suspense fallback={<div className="text-center mt-20 text-4xl animate-pulse">🧠</div>}><QuestionContent /></Suspense>;
}
