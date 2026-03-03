"use client";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase, callFunction } from "@/lib/supabase";
import { useAppStore } from "@/stores/appStore";

const NAV = [
  { href: "/home", icon: "🏠", label: "Главная" },
  { href: "/home/subjects", icon: "📚", label: "Предметы" },
  { href: "/home/rating", icon: "🏆", label: "Рейтинг" },
  { href: "/home/ai", icon: "🤖", label: "AI" },
  { href: "/home/profile", icon: "👤", label: "Профиль" },
];

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoading, setUser, setProfile, setLoading } = useAppStore();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) { router.replace("/login"); return; }
      setUser(session.user);
      callFunction("get-daily-state", {}).then(d => setProfile({ ...d.profile, loaded: true })).catch(() => setLoading(false));
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((ev) => { if (ev === "SIGNED_OUT") router.replace("/login"); });
    return () => subscription.unsubscribe();
  }, []);

  if (isLoading) return <div className="flex items-center justify-center min-h-screen"><div className="text-5xl animate-pulse">🧠</div></div>;

  return (
    <>
      <main className="px-5 pb-24 pt-6">{children}</main>
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white/95 backdrop-blur-lg border-t border-slate-100 px-2 pb-5 pt-2 z-50">
        <div className="flex justify-around">
          {NAV.map((item) => {
            const active = pathname === item.href || (item.href === "/home" && pathname === "/home");
            return (
              <button key={item.href} onClick={() => router.push(item.href)}
                className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all ${active ? "text-purple-600" : "text-slate-400"}`}>
                <span className="text-xl">{item.icon}</span>
                <span className="text-[10px] font-bold">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
