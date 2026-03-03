"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        router.replace("/home");
      }
    });
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="text-5xl animate-pulse mb-4">🧠</div>
        <p className="text-slate-500 font-bold">Входим...</p>
      </div>
    </div>
  );
}