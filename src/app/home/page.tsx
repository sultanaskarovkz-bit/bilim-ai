"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function HomePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
    if (data) setProfile(data);
  }

  return (
    <div>
      <p className="text-slate-500 text-sm">Привет, {profile?.name || "Student"} 👋</p>
      <h1 className="text-xl font-black text-slate-800 mt-1">Готов к тренировке?</h1>

      <div className="flex gap-3 mt-5">
        <div className="flex-1 bg-white rounded-2xl p-4 text-center shadow-sm">
          <p className="text-2xl font-black text-orange-500">🔥 {profile?.current_streak || 0}</p>
          <p className="text-[10px] font-bold text-slate-400 mt-1">СТРИК</p>
        </div>
        <div className="flex-1 bg-white rounded-2xl p-4 text-center shadow-sm">
          <p className="text-2xl font-black text-purple-600">{profile?.total_xp || 0}</p>
          <p className="text-[10px] font-bold text-slate-400 mt-1">XP</p>
        </div>
        <div className="flex-1 bg-white rounded-2xl p-4 text-center shadow-sm">
          <p className="text-2xl font-black text-slate-700">Lv.{Math.floor((profile?.total_xp || 0) / 100) + 1}</p>
          <p className="text-[10px] font-bold text-slate-400 mt-1">Уровень</p>
        </div>
      </div>

      <div className="flex gap-3 mt-4">
        <button onClick={() => router.push("/home/question?exam=pdd")}
          className="flex-1 bg-purple-600 rounded-2xl p-5 text-left shadow-lg">
          <span className="text-2xl">📝</span>
          <p className="text-white font-bold mt-2">Тренировка</p>
          <p className="text-purple-200 text-xs">Решай задания</p>
        </button>
        <button onClick={() => router.push("/home/question?exam=pdd&mode=exam")}
          className="flex-1 bg-green-500 rounded-2xl p-5 text-left shadow-lg">
          <span className="text-2xl">🎯</span>
          <p className="text-white font-bold mt-2">Пробный</p>
          <p className="text-green-200 text-xs">Полный экзамен</p>
        </button>
      </div>

      <div className="bg-white rounded-2xl p-5 mt-4 shadow-sm">
        <p className="font-bold text-slate-800">Ежедневные миссии</p>
        <p className="text-sm text-slate-400 mt-1">Миссии обновятся завтра</p>
      </div>

      <div className="bg-slate-50 rounded-2xl p-4 mt-3 text-center">
        <p className="text-sm text-slate-500">Сегодня решено: <span className="font-bold text-slate-800">{profile?.tasks_today || 0} заданий</span></p>
      </div>
    </div>
  );
}