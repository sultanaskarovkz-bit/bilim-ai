"use client";
import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function AIPage() {
  const [messages, setMessages] = useState<{role: string; text: string}[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadStats(); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function loadStats() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
    const { data: answers } = await supabase.from("user_answers").select("is_correct, questions(topic_id, topics(name_ru))").eq("user_id", session.user.id);

    const topicMap: Record<string, { correct: number; total: number; name: string }> = {};
    if (answers) {
      answers.forEach((a: any) => {
        const name = a.questions?.topics?.name_ru || "Unknown";
        const tid = a.questions?.topic_id;
        if (!tid) return;
        if (!topicMap[tid]) topicMap[tid] = { correct: 0, total: 0, name };
        topicMap[tid].total++;
        if (a.is_correct) topicMap[tid].correct++;
      });
    }

    const weakTopics = Object.values(topicMap)
      .filter(t => t.total >= 3)
      .sort((a, b) => (a.correct / a.total) - (b.correct / b.total))
      .slice(0, 3)
      .map(t => `${t.name} (${Math.round(100 * t.correct / t.total)}%)`);

    setStats({
      name: profile?.name || "Student",
      xp: profile?.total_xp || 0,
      level: Math.floor((profile?.total_xp || 0) / 100) + 1,
      totalAnswers: answers?.length || 0,
      correctRate: answers && answers.length > 0
        ? Math.round(100 * answers.filter((a: any) => a.is_correct).length / answers.length)
        : 0,
      weakTopics,
    });
  }

  function cleanText(text: string): string {
    return text.replace(/\*\*/g, "").replace(/\*/g, "").replace(/#{1,3}\s/g, "").replace(/`/g, "").trim();
  }

  async function send() {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setLoading(true);

    try {
      const context = stats
        ? `\u041A\u043E\u043D\u0442\u0435\u043A\u0441\u0442 \u0443\u0447\u0435\u043D\u0438\u043A\u0430: \u0438\u043C\u044F ${stats.name}, \u0443\u0440\u043E\u0432\u0435\u043D\u044C ${stats.level}, ${stats.totalAnswers} \u043E\u0442\u0432\u0435\u0442\u043E\u0432, \u0442\u043E\u0447\u043D\u043E\u0441\u0442\u044C ${stats.correctRate}%. ${stats.weakTopics.length > 0 ? "\u0421\u043B\u0430\u0431\u044B\u0435 \u0442\u0435\u043C\u044B: " + stats.weakTopics.join(", ") + "." : ""}`
        : "";

      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          history: messages.slice(-10),
          studentContext: context,
        }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", text: cleanText(data.text) }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: "assistant", text: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u044F \u043A AI. \u041F\u043E\u043F\u0440\u043E\u0431\u0443\u0439 \u043F\u043E\u0437\u0436\u0435." }]);
    }
    setLoading(false);
  }

  const suggestions = [
    "\u041E\u0431\u044A\u044F\u0441\u043D\u0438 \u043F\u0440\u0430\u0432\u0438\u043B\u043E \u043F\u043E\u043C\u0435\u0445\u0438 \u0441\u043F\u0440\u0430\u0432\u0430",
    "\u041A\u0430\u043A\u0438\u0435 \u0437\u043D\u0430\u043A\u0438 \u0437\u0430\u043F\u0440\u0435\u0449\u0430\u044E\u0449\u0438\u0435?",
    "\u041A\u0430\u043A \u043F\u0440\u043E\u0435\u0437\u0436\u0430\u0442\u044C \u043A\u0440\u0443\u0433\u043E\u0432\u043E\u0435?",
    "\u0421\u043A\u043E\u0440\u043E\u0441\u0442\u044C \u0432 \u0436\u0438\u043B\u043E\u0439 \u0437\u043E\u043D\u0435?",
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 200px)" }}>
      <h1 className="animate-in" style={{ fontFamily: "'Fraunces', serif", fontSize: 28, color: "var(--ink)", fontWeight: 900, marginBottom: 16 }}>
        AI {"\u{1F916}"}
      </h1>

      <div style={{ flex: 1, overflow: "auto", marginBottom: 16 }}>
        {messages.length === 0 && (
          <div style={{ textAlign: "center", marginTop: 40 }}>
            <div style={{ fontSize: 52, marginBottom: 12, animation: "bob 3s ease-in-out infinite" }}>{"\u{1F916}"}</div>
            <p style={{ color: "var(--mid)", fontSize: 15, fontWeight: 700, marginBottom: 6 }}>AI {"\u0422\u044C\u044E\u0442\u043E\u0440"}</p>
            <p style={{ color: "var(--pale)", fontSize: 13, fontWeight: 600, marginBottom: 20 }}>{"\u0417\u0430\u0434\u0430\u0439 \u0432\u043E\u043F\u0440\u043E\u0441 \u043F\u043E \u043B\u044E\u0431\u043E\u0439 \u0442\u0435\u043C\u0435 \u041F\u0414\u0414"}</p>
            {stats && stats.weakTopics.length > 0 && (
              <div style={{ background: "var(--ruby-g)", borderRadius: 16, padding: "12px 16px", marginBottom: 16, textAlign: "left" }}>
                <p style={{ fontSize: 11, fontWeight: 800, color: "var(--ruby)", marginBottom: 4 }}>{"\u26A0\uFE0F"} {"\u0421\u043B\u0430\u0431\u044B\u0435 \u0442\u0435\u043C\u044B:"}</p>
                <p style={{ fontSize: 12, fontWeight: 600, color: "var(--mid)" }}>{stats.weakTopics.join(", ")}</p>
              </div>
            )}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
              {suggestions.map((s, i) => (
                <button key={i} className="hover-lift" onClick={() => { setInput(s); }} style={{
                  background: "var(--card)", border: "1px solid var(--line)", borderRadius: 14,
                  padding: "8px 14px", fontSize: 12, fontWeight: 700, color: "var(--mid)", cursor: "pointer",
                }}>{s}</button>
              ))}
            </div>
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
              <div style={{
                maxWidth: "80%", padding: "12px 16px", borderRadius: 20,
                fontSize: 14, fontWeight: 600, lineHeight: 1.6,
                background: m.role === "user" ? "linear-gradient(135deg, var(--jade), var(--royal))" : "var(--card)",
                color: m.role === "user" ? "white" : "var(--ink)",
                border: m.role === "user" ? "none" : "1px solid var(--line)",
                boxShadow: m.role === "user" ? "0 4px 12px rgba(26,122,104,0.3)" : "none",
                whiteSpace: "pre-wrap",
              }}>
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              <div style={{ background: "var(--card)", border: "1px solid var(--line)", padding: "12px 16px", borderRadius: 20, fontSize: 14, color: "var(--pale)", fontWeight: 600 }}>
                {"\u{1F916}"} {"\u0414\u0443\u043C\u0430\u044E..."}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
          placeholder={"\u0417\u0430\u0434\u0430\u0439 \u0432\u043E\u043F\u0440\u043E\u0441..."}
          style={{
            flex: 1, background: "var(--card)", borderRadius: 18, padding: "14px 18px",
            fontSize: 14, fontWeight: 600, border: "1px solid var(--line)",
            outline: "none", color: "var(--ink)", fontFamily: "'Nunito', sans-serif",
          }}
        />
        <button className="hover-lift" onClick={send} style={{
          width: 50, height: 50, borderRadius: 18,
          background: "linear-gradient(135deg, var(--jade), var(--royal))",
          border: "none", color: "white", fontWeight: 900, fontSize: 18,
          boxShadow: "0 4px 16px rgba(26,122,104,0.3)", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>{"\u27A4"}</button>
      </div>
    </div>
  );
}
