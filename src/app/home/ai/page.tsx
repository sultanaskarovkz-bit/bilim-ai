"use client";
import { useState } from "react";

export default function AIPage() {
  const [messages, setMessages] = useState<{role: string; text: string}[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function send() {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setLoading(true);
    // AI will be connected later
    setTimeout(() => {
      setMessages(prev => [...prev, { role: "assistant", text: "AI тьютор скоро будет подключён! Пока тренируйся в разделе Тренировка." }]);
      setLoading(false);
    }, 1000);
  }

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 160px)" }}>
      <h1 className="text-xl font-black text-slate-800 mb-4">AI Тьютор 🤖</h1>

      <div className="flex-1 overflow-auto space-y-3 mb-4">
        {messages.length === 0 && (
          <div className="text-center mt-10">
            <p className="text-4xl mb-3">🤖</p>
            <p className="text-slate-400 text-sm">Задай вопрос по любой теме</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${m.role === "user" ? "bg-purple-600 text-white" : "bg-white text-slate-700 shadow-sm"}`}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && <div className="flex justify-start"><div className="bg-white p-3 rounded-2xl text-sm text-slate-400 shadow-sm">Думаю...</div></div>}
      </div>

      <div className="flex gap-2">
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
          placeholder="Задай вопрос..."
          className="flex-1 bg-white rounded-2xl px-4 py-3 text-sm shadow-sm outline-none focus:ring-2 focus:ring-purple-300" />
        <button onClick={send} className="bg-purple-600 text-white w-12 h-12 rounded-2xl font-bold shadow-lg">&#x27A4;</button>
      </div>
    </div>
  );
}