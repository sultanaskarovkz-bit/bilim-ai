"use client";
import { useState, useRef, useEffect } from "react";
import { callFunction } from "@/lib/supabase";

interface Msg { role: "user" | "assistant"; content: string; }

export default function AIPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => { bottom.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function send() {
    if (!input.trim() || loading) return;
    const text = input.trim(); setInput("");
    const updated = [...messages, { role: "user" as const, content: text }];
    setMessages(updated); setLoading(true);
    try {
      const d = await callFunction("ai-tutor", { messages: updated });
      setMessages([...updated, { role: "assistant", content: d.reply }]);
    } catch { setMessages([...updated, { role: "assistant", content: "Ошибка. Попробуй позже." }]); }
    setLoading(false);
  }

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 140px)" }}>
      <h1 className="text-xl font-black text-slate-800 mb-4">AI Репетитор 🤖</h1>
      <div className="flex-1 overflow-auto space-y-3 mb-3">
        {messages.length === 0 && <div className="text-center mt-10"><p className="text-4xl mb-3">🧠</p><p className="text-slate-500 font-medium">Задай вопрос по учёбе</p></div>}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${m.role === "user" ? "bg-purple-600 text-white" : "bg-white shadow-sm text-slate-700"}`}>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</p>
            </div>
          </div>
        ))}
        {loading && <div className="flex justify-start"><div className="bg-white shadow-sm rounded-2xl px-4 py-3"><p className="text-sm text-slate-400 animate-pulse">Думаю...</p></div></div>}
        <div ref={bottom} />
      </div>
      <div className="flex gap-2">
        <input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="Задай вопрос..."
          className="flex-1 py-3 px-4 rounded-2xl bg-white shadow border border-slate-100 text-sm outline-none focus:border-purple-300" />
        <button onClick={send} disabled={loading || !input.trim()} className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow disabled:opacity-50">&#10148;</button>
      </div>
    </div>
  );
}
