"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, callFunction } from "@/lib/supabase";
import { EXAMS } from "@/lib/constants";

export default function ProfilePage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { callFunction("get-profile-stats", {}).then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false)); }, []);

  async function logout() { await supabase.auth.signOut(); router.replace("/login"); }

  if (loading) return <div className="text-center mt-20 text-4xl animate-pulse">👤</div>;

  const p = data?.profile || {};
  const stats = data?.stats || { total: 0, correct: 0 };
  const accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;

  return (
    <div>
      <div className="text-center mb-6">
        <div className="w-20 h-20 rounded-full bg-purple-100 mx-auto flex items-center justify-center text-3xl font-black text-purple-600">{p.name?.[0] || "?"}</div>
        <h1 className="text-xl font-black text-slate-800 mt-3">{p.name}</h1>
        <p className="text-sm text-slate-400">Lv.{p.level}</p>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-white rounded-2xl p-4 shadow-sm text-center"><p className="text-2xl font-black text-purple-600">{p.total_xp || 0}</p><p className="text-xs text-slate-400 font-bold">Всего XP</p></div>
        <div className="bg-white rounded-2xl p-4 shadow-sm text-center"><p className="text-2xl font-black text-green-500">{accuracy}%</p><p className="text-xs text-slate-400 font-bold">Точность</p></div>
        <div className="bg-white rounded-2xl p-4 shadow-sm text-center"><p className="text-2xl font-black text-orange-500">{p.current_streak || 0}</p><p className="text-xs text-slate-400 font-bold">Стрик</p></div>
        <div className="bg-white rounded-2xl p-4 shadow-sm text-center"><p className="text-2xl font-black text-blue-500">{data?.study_minutes || 0}</p><p className="text-xs text-slate-400 font-bold">Минут</p></div>
      </div>
      <div className="bg-white rounded-2xl p-4 shadow-sm mb-5">
        <h3 className="font-bold text-slate-800 mb-3">Мои экзамены</h3>
        <div className="flex flex-wrap gap-2">
          {(data?.exams || []).map((e: string) => (
            <span key={e} className="px-3 py-1.5 rounded-full bg-purple-50 text-purple-600 text-sm font-bold">{EXAMS[e]?.icon} {EXAMS[e]?.name || e}</span>
          ))}
        </div>
      </div>
      <button onClick={logout} className="w-full py-3 rounded-2xl bg-red-50 text-red-500 font-bold text-sm">Выйти</button>
    </div>
  );
}
