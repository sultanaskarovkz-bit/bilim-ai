"use client";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAppStore } from "@/stores/appStore";

const NAV = [
  { href: "/home", icon: "\u{1F3E0}", label: "\u0413\u043B\u0430\u0432\u043D\u0430\u044F" },
  { href: "/home/subjects", icon: "\u{1F4DA}", label: "\u041F\u0440\u0435\u0434\u043C\u0435\u0442\u044B" },
  { href: "/home/rating", icon: "\u{1F3C6}", label: "\u0420\u0435\u0439\u0442\u0438\u043D\u0433" },
  { href: "/home/ai", icon: "\u{1F916}", label: "AI" },
  { href: "/home/profile", icon: "\u{1F464}", label: "\u041F\u0440\u043E\u0444\u0438\u043B\u044C" },
];

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoading, setUser, setProfile, setLoading } = useAppStore();

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) { router.replace("/login"); return; }
      setUser(session.user);
      try {
        const { data: profile } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
        if (profile) { setProfile({ ...profile, loaded: true }); }
        else { setLoading(false); }
      } catch { setLoading(false); }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((ev) => { if (ev === "SIGNED_OUT") router.replace("/login"); });
    return () => subscription.unsubscribe();
  }, []);

  if (isLoading) return <div className="flex items-center justify-center min-h-screen"><div className="text-5xl animate-pulse">&#x1F9E0;</div></div>;

  return (
    <>
      <main className="px-5 pb-24 pt-6">{children}</main>
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white/95 backdrop-blur-lg border-t border-slate-100 px-2 pb-5 pt-2 z-50">
        <div className="flex justify-around">
          {NAV.map((item) => {
            const active = pathname === item.href;
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