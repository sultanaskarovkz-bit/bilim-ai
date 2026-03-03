"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function SubjectsPage() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    loadSubjects();
  }, []);

  async function loadSubjects() {
    const { data } = await supabase
      .from("subjects")
      .select("*, topics(id, name_ru)")
      .eq("is_active", true)
      .order("sort_order");
    if (data) {
      setSubjects(data);
      if (data.length > 0) setSelected(data[0].exam);
    }
  }

  return (
    <div>
      <h1 className="text-xl font-black text-slate-800 mb-5">Предметы</h1>

      <div className="flex gap-2 mb-5 overflow-x-auto pb-2">
        {subjects.map((s) => (
          <button key={s.id} onClick={() => setSelected(s.exam)}
            className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap ${selected === s.exam ? "bg-purple-600 text-white shadow" : "bg-white text-slate-600 shadow-sm"}`}>
            {s.icon || "📚"} {s.name_ru}
          </button>
        ))}
      </div>

      {subjects.filter(s => s.exam === selected).map(s => (
        <div key={s.id} className="bg-white rounded-2xl p-5 shadow-sm mb-4">
          <h2 className="font-bold text-slate-800 mb-3">{s.icon || "📚"} {s.name_ru}</h2>
          <div className="space-y-2 mb-4">
            {(s.topics || []).map((t: any) => (
              <div key={t.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                <p className="text-sm font-semibold text-slate-600">{t.name_ru}</p>
              </div>
            ))}
          </div>
          <button onClick={() => router.push("/home/question?exam=" + s.exam)}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-purple-500 text-white font-bold shadow-lg">
            Начать тренировку
          </button>
        </div>
      ))}

      {subjects.length === 0 && (
        <p className="text-center text-slate-400 mt-10">Загрузка предметов...</p>
      )}
    </div>
  );
}
