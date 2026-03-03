"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { callFunction } from "@/lib/supabase";
import { useAppStore } from "@/stores/appStore";

export default function HomePage() {
  const router = useRouter();
  const { profile, selectedExam } = useAppStore();
  const [state, setState] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    callFunction("get-daily-state", {}).then(d => { setState(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center mt-20 text-4xl animate-pulse">🧠</div>;

  const p = state?.profile || profile || {};
  const missions = state?.missions || [];

  return (
    <div>
      <div className="mb-5">
        <p className="text-sm text-slate-400 font-semibold">Привет, {p.name || "Student"} 👋</p>
        <h1 className="text-xl font-black text-slate-800 mt-1">Готов к тренировке?</h1>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-white rounded-2xl p-3 shadow-sm text-center">
          <p className="text-2xl font-black text-orange-500">🔥 {p.streak || 0}</p>
          <p className="text-[10px] text-slate-400 font-bold mt-1">СТРИК</p>
        </div>
        <div className="bg-white rounded-2xl p-3 shadow-sm text-center">
          <p className="text-2xl font-black text-purple-600">{p.total_xp || 0}</p>
          <p className="text-[10px] text-slate-400 font-bold mt-1">XP</p>
        </div>
        <div className="bg-white rounded-2xl p-3 shadow-sm text-center">
          <p className="text-2xl font-black text-blue-500">Lv.{p.level || 1}</p>
          <p className="text-[10px] text-slate-400 font-bold mt-1">{p.level_name || "Новичок"}</p>
        </div>
      </div>

      {p.trial_days_left > 0 && (
        <div className="bg-gradient-to-r from-purple-600 to-blue-500 rounded-2xl p-4 mb-5 text-white shadow-lg">
          <p className="font-bold">Бесплатный доступ</p>
          <p className="text-sm opacity-90">Осталось {p.trial_days_left} дней</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mb-5">
        <button onClick={() => router.push("/home/question?exam=" + selectedExam + "&mode=practice")}
          className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl p-4 text-left shadow-lg">
          <span className="text-2xl">📝</span>
          <p className="font-bold mt-2">Тренировка</p>
          <p className="text-xs opacity-80">Решай задания</p>
        </button>
        <button onClick={() => router.push("/home/mock?exam=" + selectedExam)}
          className="bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-2xl p-4 text-left shadow-lg">
          <span className="text-2xl">🎯</span>
          <p className="font-bold mt-2">Пробный</p>
          <p className="text-xs opacity-80">Полный экзамен</p>
        </button>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm mb-5">
        <h3 className="font-bold text-slate-800 mb-3">Ежедневные миссии</h3>
        {missions.length === 0 ? <p className="text-sm text-slate-400">Миссии обновятся завтра</p> : (
          <div className="space-y-2">
            {missions.map((m: any, i: number) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${m.is_completed ? "bg-green-100" : "bg-slate-100"}`}>
                  {m.is_completed ? "✅" : "📝"}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-700">{m.mission}</p>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1">
                    <div className="bg-purple-500 h-1.5 rounded-full" style={{width: Math.min(100,(m.current_value/m.target_value)*100)+"%"}} />
                  </div>
                </div>
                <span className="text-xs font-bold text-purple-500">+{m.xp_reward}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <p className="text-center text-slate-400 text-sm">Сегодня решено: <span className="font-bold text-slate-800">{p.tasks_today || 0} заданий</span></p>
      </div>
    </div>
  );
}
