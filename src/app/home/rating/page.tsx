"use client";
import { useEffect, useState } from "react";
import { callFunction } from "@/lib/supabase";

export default function RatingPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { callFunction("get-leaderboard", {}).then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false)); }, []);

  if (loading) return <div className="text-center mt-20 text-4xl animate-pulse">🏆</div>;
  const list = data?.leaderboard || [];

  return (
    <div>
      <h1 className="text-xl font-black text-slate-800 mb-5">Рейтинг</h1>
      {list.length >= 3 && (
        <div className="flex justify-center items-end gap-3 mb-6">
          {[1,0,2].map((idx) => {
            const u = list[idx];
            const h = ["h-24","h-20","h-16"][idx];
            const c = ["bg-yellow-400","bg-slate-300","bg-orange-300"][idx];
            return (
              <div key={idx} className="text-center">
                <p className="text-sm font-bold text-slate-700 mb-1">{u?.name}</p>
                <p className="text-xs text-purple-600 font-bold mb-1">{u?.xp} XP</p>
                <div className={`w-16 ${h} ${c} rounded-t-xl flex items-center justify-center text-white font-black text-lg`}>{idx+1}</div>
              </div>
            );
          })}
        </div>
      )}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {list.slice(3).map((u: any) => (
          <div key={u.user_id} className="flex items-center gap-3 p-3 border-b border-slate-50">
            <span className="w-7 text-center text-sm font-bold text-slate-400">{u.rank}</span>
            <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-sm font-bold text-purple-600">{u.name?.[0] || "?"}</div>
            <div className="flex-1"><p className="text-sm font-bold text-slate-700">{u.name}</p><p className="text-xs text-slate-400">Lv.{u.level}</p></div>
            <p className="text-sm font-bold text-purple-600">{u.xp} XP</p>
          </div>
        ))}
        {list.length === 0 && <p className="text-center py-8 text-slate-400">Пока пусто. Будь первым!</p>}
      </div>
    </div>
  );
}
