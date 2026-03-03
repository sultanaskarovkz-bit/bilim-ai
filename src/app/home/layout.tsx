"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

const NAV = [
  { id: "/home", icon: "\u{1F3E0}", label: "Главная" },
  { id: "/home/subjects", icon: "\u{1F4DA}", label: "Предметы" },
  { id: "/home/rating", icon: "\u{1F3C6}", label: "Рейтинг" },
  { id: "/home/profile", icon: "\u{1F464}", label: "Профиль" },
];

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.replace("/login");
      else setSession(data.session);
    });
  }, []);

  if (!session) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "var(--bg)" }}>
        <div style={{ fontSize: 48, animation: "bob 1.5s ease-in-out infinite" }}>{"\u{1F9E0}"}</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", position: "relative", background: "var(--bg)" }}>
      {/* Ambient glow */}
      <div style={{ position: "absolute", top: -80, right: -60, width: 250, height: 250, borderRadius: "50%", background: "radial-gradient(circle, var(--saffron-g) 0%, transparent 70%)", opacity: 0.6, pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: 80, left: -100, width: 280, height: 280, borderRadius: "50%", background: "radial-gradient(circle, var(--jade-g) 0%, transparent 70%)", opacity: 0.4, pointerEvents: "none" }} />

      <div style={{ padding: "28px 20px 110px", position: "relative", zIndex: 1 }}>
        {children}
      </div>

      {/* Bottom Nav */}
      <div style={{
        position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 430, zIndex: 50,
        background: "rgba(255,253,247,0.95)", backdropFilter: "blur(20px)",
        borderTop: "1px solid var(--line)", padding: "6px 4px 28px",
      }}>
        <div style={{ display: "flex", justifyContent: "space-around" }}>
          {NAV.map(n => {
            const on = pathname === n.id;
            return (
              <button key={n.id} className="hover-lift" onClick={() => router.push(n.id)} style={{
                background: on ? "rgba(26,122,104,0.08)" : "transparent",
                border: "none", borderRadius: 14, padding: "8px 16px",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
              }}>
                <span style={{ fontSize: 20, filter: on ? "none" : "grayscale(0.8)", opacity: on ? 1 : 0.4, transition: "all 0.2s" }}>{n.icon}</span>
                <span style={{ fontSize: 10, fontWeight: on ? 800 : 600, color: on ? "var(--jade)" : "var(--pale)", transition: "all 0.2s" }}>{n.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
