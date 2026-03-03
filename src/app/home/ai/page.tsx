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
    setTimeout(() => {
      setMessages(prev => [...prev, { role: "assistant", text: "AI \u0442\u044C\u044E\u0442\u043E\u0440 \u0441\u043A\u043E\u0440\u043E \u0431\u0443\u0434\u0435\u0442 \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0451\u043D! \u041F\u043E\u043A\u0430 \u0442\u0440\u0435\u043D\u0438\u0440\u0443\u0439\u0441\u044F \u0432 \u0440\u0430\u0437\u0434\u0435\u043B\u0435 \u0422\u0440\u0435\u043D\u0438\u0440\u043E\u0432\u043A\u0430." }]);
      setLoading(false);
    }, 1000);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 200px)" }}>
      <h1 className="animate-in" style={{ fontFamily: "'Fraunces', serif", fontSize: 28, color: "var(--ink)", fontWeight: 900, marginBottom: 16 }}>
        AI {"\u{1F916}"}
      </h1>

      <div style={{ flex: 1, overflow: "auto", marginBottom: 16 }}>
        {messages.length === 0 && (
          <div style={{ textAlign: "center", marginTop: 60 }}>
            <div style={{ fontSize: 52, marginBottom: 12, animation: "bob 3s ease-in-out infinite" }}>{"\u{1F916}"}</div>
            <p style={{ color: "var(--mid)", fontSize: 15, fontWeight: 700, marginBottom: 6 }}>AI {"\u0422\u044C\u044E\u0442\u043E\u0440"}</p>
            <p style={{ color: "var(--pale)", fontSize: 13, fontWeight: 600 }}>{"\u0417\u0430\u0434\u0430\u0439 \u0432\u043E\u043F\u0440\u043E\u0441 \u043F\u043E \u043B\u044E\u0431\u043E\u0439 \u0442\u0435\u043C\u0435"}</p>
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
              <div style={{
                maxWidth: "80%", padding: "12px 16px", borderRadius: 20,
                fontSize: 14, fontWeight: 600, lineHeight: 1.5,
                background: m.role === "user" ? "linear-gradient(135deg, var(--jade), var(--royal))" : "var(--card)",
                color: m.role === "user" ? "white" : "var(--ink)",
                border: m.role === "user" ? "none" : "1px solid var(--line)",
                boxShadow: m.role === "user" ? "0 4px 12px rgba(26,122,104,0.3)" : "none",
              }}>
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              <div style={{ background: "var(--card)", border: "1px solid var(--line)", padding: "12px 16px", borderRadius: 20, fontSize: 14, color: "var(--pale)", fontWeight: 600 }}>
                {"\u0414\u0443\u043C\u0430\u044E..."}
              </div>
            </div>
          )}
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
