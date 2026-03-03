"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function ProfilePage() {
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

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  if (!profile) return <div className="text-center mt-20 text-4xl animate-pulse">🧠</div>;

  return (
    <div>
      <div className="flex flex-col items-center mb-6">
        <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center text-3xl font-black text-purple-600">
          {(profile.name || "S")[0]}
        </div>
        <h1 className="text-xl font-black text-slate-800 mt-3">{profile.name}</h1>
        <p className="text-sm text-slate-400">{profile.email}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
          <p className="text-2xl font-black text-purple-600">{profile.total_xp || 0}</p>
          <p className="text-xs text-slate-400 font-bold">Всего XP</p>
        </div>
        <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
          <p className="text-2xl font-black text-orange-500">{profile.current_streak || 0}</p>
          <p className="text-xs text-slate-400 font-bold">Стрик</p>
        </div>
        <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
          <p className="text-2xl font-black text-green-500">{profile.tasks_today || 0}</p>
          <p className="text-xs text-slate-400 font-bold">Сегодня</p>
        </div>
        <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
          <p className="text-2xl font-black text-slate-700">Lv.{Math.floor((profile.total_xp || 0) / 100) + 1}</p>
          <p className="text-xs text-slate-400 font-bold">Уровень</p>
        </div>
      </div>

      <button onClick={logout} className="w-full py-4 rounded-2xl bg-red-50 text-red-500 font-bold text-center">
        Выйти
      </button>
    </div>
  );
}