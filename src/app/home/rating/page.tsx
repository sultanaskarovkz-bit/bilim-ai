"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function RatingPage() {
  const [leaders, setLeaders] = useState<any[]>([]);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  async function loadLeaderboard() {
    const { data } = await supabase
      .from("profiles")
      .select("id, name, total_xp, current_streak")
      .order("total_xp", { ascending: false })
      .limit(20);
    if (data) setLeaders(data);
  }

  return (
    <div>
      <h1 className="text-xl font-black text-slate-800 mb-5">Рейтинг 🏆</h1>
      {leaders.length === 0 && <p className="text-slate-400 text-center mt-10">Пока нет данных</p>}
      <div className="space-y-2">
        {leaders.map((u, i) => (
          <div key={u.id} className="bg-white rounded-2xl p-4 flex items-center gap-3 shadow-sm">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${i === 0 ? "bg-yellow-100 text-yellow-600" : i === 1 ? "bg-slate-100 text-slate-500" : i === 2 ? "bg-orange-100 text-orange-500" : "bg-slate-50 text-slate-400"}`}>
              {i + 1}
            </div>
            <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center font-bold text-purple-600 text-sm">
              {(u.name || "?")[0]}
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm text-slate-800">{u.name || "Student"}</p>
              <p className="text-xs text-slate-400">Lv.{Math.floor((u.total_xp || 0) / 100) + 1}</p>
            </div>
            <p className="font-black text-purple-600">{u.total_xp || 0} XP</p>
          </div>
        ))}
      </div>
    </div>
  );
}