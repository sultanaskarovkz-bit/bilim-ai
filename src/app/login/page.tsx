"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { EXAMS } from "@/lib/constants";

type Step = "welcome" | "phone" | "otp" | "name" | "exams";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("welcome");
  const [phone, setPhone] = useState("+7");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [selectedExams, setSelectedExams] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function sendOTP() {
    if (phone.length < 12) { setError("Введи номер полностью"); return; }
    setLoading(true); setError("");
    const { error: err } = await supabase.auth.signInWithOtp({ phone });
    if (err) setError(err.message); else setStep("otp");
    setLoading(false);
  }

  async function verifyOTP() {
    setLoading(true); setError("");
    const { data, error: err } = await supabase.auth.verifyOtp({ phone, token: otp, type: "sms" });
    if (err) { setError(err.message); setLoading(false); return; }
    if (data.session) setStep("name");
    setLoading(false);
  }

  async function finishSetup() {
    if (!name.trim()) { setError("Введи имя"); return; }
    if (selectedExams.length === 0) { setError("Выбери хотя бы 1 экзамен"); return; }
    setLoading(true); setError("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      await fetch(process.env.NEXT_PUBLIC_SUPABASE_URL + "/functions/v1/setup-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token, "apikey": process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! },
        body: JSON.stringify({ name, language: "ru", exams: selectedExams }),
      });
      router.replace("/home");
    } catch (err: any) { setError(err.message); }
    setLoading(false);
  }

  function toggleExam(exam: string) {
    setSelectedExams(prev => prev.includes(exam) ? prev.filter(e => e !== exam) : [...prev, exam]);
  }

  async function googleLogin() {
  await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: window.location.origin + "/auth/callback" },
  });
}

  return (
    <div className="min-h-screen px-6 py-10 flex flex-col">
      {step === "welcome" && (
        <div className="flex-1 flex flex-col justify-center">
          <div className="text-center mb-12">
            <div className="text-7xl mb-4">🧠</div>
            <h1 className="text-3xl font-black text-slate-800 mb-2">BilimAI</h1>
            <p className="text-slate-500 font-medium">Умная подготовка к экзаменам с AI</p>
          </div>
          <div className="space-y-3">
            <button onClick={() => setStep("phone")} className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-purple-500 text-white font-bold text-lg shadow-lg shadow-purple-200">
              📱 Войти по номеру
            </button>
            <button onClick={googleLogin} className="w-full py-4 rounded-2xl bg-white text-slate-700 font-bold text-lg shadow border border-slate-100">
              G Войти через Google
            </button>
          </div>
          <p className="text-center text-xs text-slate-400 mt-8">3 месяца бесплатно для всех экзаменов</p>
        </div>
      )}

      {step === "phone" && (
        <div className="flex-1 flex flex-col justify-center">
          <button onClick={() => setStep("welcome")} className="text-slate-400 mb-8">&larr; Назад</button>
          <h2 className="text-2xl font-black text-slate-800 mb-2">Введи номер</h2>
          <p className="text-slate-500 mb-6">Отправим SMS с кодом</p>
          <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+7 700 123 4567"
            className="w-full py-4 px-5 rounded-2xl bg-white text-lg font-bold text-slate-800 border border-slate-200 outline-none focus:border-purple-400 mb-4" />
          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
          <button onClick={sendOTP} disabled={loading}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-purple-500 text-white font-bold text-lg disabled:opacity-50">
            {loading ? "Отправляем..." : "Получить код"}
          </button>
        </div>
      )}

      {step === "otp" && (
        <div className="flex-1 flex flex-col justify-center">
          <button onClick={() => setStep("phone")} className="text-slate-400 mb-8">&larr; Назад</button>
          <h2 className="text-2xl font-black text-slate-800 mb-2">Введи код</h2>
          <p className="text-slate-500 mb-6">Отправили на {phone}</p>
          <input type="text" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ""))} placeholder="000000" maxLength={6}
            className="w-full py-4 px-5 rounded-2xl bg-white text-center text-2xl font-black text-slate-800 tracking-[0.5em] border border-slate-200 outline-none focus:border-purple-400 mb-4" />
          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
          <button onClick={verifyOTP} disabled={loading || otp.length < 6}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-purple-500 text-white font-bold text-lg disabled:opacity-50">
            {loading ? "Проверяем..." : "Подтвердить"}
          </button>
        </div>
      )}

      {step === "name" && (
        <div className="flex-1 flex flex-col justify-center">
          <h2 className="text-2xl font-black text-slate-800 mb-2">Как тебя зовут?</h2>
          <p className="text-slate-500 mb-6">Это имя увидят в рейтинге</p>
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Твоё имя"
            className="w-full py-4 px-5 rounded-2xl bg-white text-lg font-bold text-slate-800 border border-slate-200 outline-none focus:border-purple-400 mb-4" />
          <button onClick={() => { if (name.trim()) setStep("exams"); else setError("Введи имя"); }}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-purple-500 text-white font-bold text-lg">Далее</button>
        </div>
      )}

      {step === "exams" && (
        <div className="flex-1 flex flex-col">
          <h2 className="text-2xl font-black text-slate-800 mb-2">К чему готовишься?</h2>
          <p className="text-slate-500 mb-6">Можно выбрать несколько</p>
          <div className="space-y-3 flex-1">
            {Object.entries(EXAMS).map(([key, exam]) => (
              <button key={key} onClick={() => toggleExam(key)}
                className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all ${selectedExams.includes(key) ? "bg-purple-50 border-2 border-purple-400 shadow-md" : "bg-white border-2 border-transparent shadow"}`}>
                <span className="text-3xl">{exam.icon}</span>
                <div className="text-left flex-1">
                  <p className="font-bold text-slate-800">{exam.name}</p>
                  <p className="text-xs text-slate-400">{exam.desc}</p>
                </div>
                {selectedExams.includes(key) && <span className="text-purple-500 text-xl">&#10003;</span>}
              </button>
            ))}
          </div>
          {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
          <button onClick={finishSetup} disabled={loading || selectedExams.length === 0}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-purple-500 text-white font-bold text-lg mt-4 disabled:opacity-50">
            {loading ? "Настраиваем..." : "Начать (" + selectedExams.length + " экзамен)"}
          </button>
          <p className="text-center text-xs text-slate-400 mt-3">90 дней бесплатно, потом от 2,990 тг/мес</p>
        </div>
      )}
    </div>
  );
}
