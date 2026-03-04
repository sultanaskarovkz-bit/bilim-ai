"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const MANDATORY = [
  { icon: "🏛️", name: "История Казахстана", q: 20, pts: 20 },
  { icon: "📐", name: "Мат. грамотность", q: 10, pts: 10 },
  { icon: "📖", name: "Грамотность чтения", q: 10, pts: 10 },
];

const COMBOS = [
  { name: "Медицина", match: ["Биология", "Химия"], emoji: "🩺" },
  { name: "IT / Инженерия", match: ["Математика", "Физика"], emoji: "🔧" },
  { name: "Право / Экономика", match: ["Всемирная история", "Английский язык"], emoji: "⚖️" },
  { name: "Педагогика", match: ["Биология", "География"], emoji: "📚" },
];

export default function EntPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [profileSubjects, setProfileSubjects] = useState<any[]>([]);
  const [allSubjects, setAllSubjects] = useState<any[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<"loading" | "onboarding" | "dashboard">("loading");
  const [questionCounts, setQuestionCounts] = useState<Record<string, number>>({});

  useEffect(() => { init(); }, []);

  async function init() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push("/"); return; }
    setUserId(session.user.id);

    // Load all ENT subjects
    const { data: subjects } = await supabase
      .from("subjects").select("*").eq("exam", "ent").eq("is_active", true).order("sort_order");
    setAllSubjects(subjects || []);

    // Check if user has ENT profile
    const { data: entProfile } = await supabase
      .from("user_ent_profile").select("*, s1:subjects!profile_subject_1(*), s2:subjects!profile_subject_2(*)").eq("user_id", session.user.id).single();

    if (entProfile?.profile_subject_1 && entProfile?.profile_subject_2) {
      setProfileSubjects([entProfile.s1, entProfile.s2]);
      setPhase("dashboard");
    } else {
      setPhase("onboarding");
    }

    // Count questions per subject via topics
    const { data: topics } = await supabase.from("topics").select("id, subject_id");
    if (topics) {
      const topicIds = topics.map(t => t.id);
      const { count } = await supabase.from("questions").select("*", { count: "exact", head: true }).eq("is_active", true).in("topic_id", topicIds);
      // Get counts per subject
      const counts: Record<string, number> = {};
      for (const s of (subjects || [])) {
        const sTopics = topics.filter(t => t.subject_id === s.id).map(t => t.id);
        if (sTopics.length) {
          const { count: c } = await supabase.from("questions").select("*", { count: "exact", head: true }).eq("is_active", true).in("topic_id", sTopics);
          counts[s.id] = c || 0;
        }
      }
      setQuestionCounts(counts);
    }
    setLoading(false);
  }

  const profileOptions = allSubjects.filter(s => s.sort_order >= 10);
  const mandatorySubjects = allSubjects.filter(s => s.sort_order < 10);

  function toggle(id: string) {
    setSelected(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 2) return prev;
      return [...prev, id];
    });
  }

  function selectCombo(names: string[]) {
    const ids = profileOptions.filter(s => names.includes(s.name_ru)).map(s => s.id);
    if (ids.length === 2) setSelected(ids);
  }

  async function saveProfile() {
    if (selected.length !== 2 || !userId) return;
    await supabase.from("user_ent_profile").upsert({
      user_id: userId,
      profile_subject_1: selected[0],
      profile_subject_2: selected[1],
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
    const s1 = allSubjects.find(s => s.id === selected[0]);
    const s2 = allSubjects.find(s => s.id === selected[1]);
    setProfileSubjects([s1, s2]);
    setPhase("dashboard");
  }

  const totalQuestions = Object.values(questionCounts).reduce((a, b) => a + b, 0);
  const mySubjects = [...mandatorySubjects, ...profileSubjects.filter(Boolean)];

  // ========== LOADING ==========
  if (phase === "loading") return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <div style={{ fontSize: 48, animation: "bob 1.5s ease-in-out infinite" }}>🎓</div>
    </div>
  );

  // ========== ONBOARDING ==========
  if (phase === "onboarding") return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "var(--bg)", overflow: "auto", WebkitOverflowScrolling: "touch" as any }}>
      <div style={{ position: "absolute", top: -60, right: -40, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, var(--jade-g) 0%, transparent 70%)", opacity: 0.5, pointerEvents: "none" }} />
      <div style={{ maxWidth: 500, margin: "0 auto", padding: "40px 20px 100px", position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🎓</div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: "var(--ink)", fontFamily: "'Fraunces', serif" }}>
            Подготовка к ЕНТ
          </h1>
          <p style={{ color: "var(--mid)", fontSize: 14, marginTop: 6 }}>Выберите 2 профильных предмета</p>
          <p style={{ color: "var(--pale)", fontSize: 12, marginTop: 4 }}>Можно изменить позже в настройках</p>
        </div>

        {/* Mandatory preview */}
        <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap", marginBottom: 20 }}>
          {MANDATORY.map(m => (
            <span key={m.name} style={{ padding: "6px 12px", borderRadius: 10, background: "var(--jade-g)", color: "var(--jade)", fontSize: 11, fontWeight: 700 }}>
              {m.icon} {m.name}
            </span>
          ))}
        </div>

        {/* Combos */}
        <p style={{ color: "var(--mid)", fontSize: 11, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}>Популярные связки</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
          {COMBOS.map(c => {
            const isActive = c.match.every(n => selected.some(id => profileOptions.find(s => s.id === id)?.name_ru === n));
            return (
              <button key={c.name} onClick={() => selectCombo(c.match)} style={{
                padding: "8px 14px", borderRadius: 12, border: `1.5px solid ${isActive ? "var(--jade)" : "var(--line)"}`,
                background: isActive ? "var(--jade-g)" : "transparent", color: isActive ? "var(--jade)" : "var(--mid)",
                fontSize: 13, fontWeight: 700, cursor: "pointer",
              }}>
                {c.emoji} {c.name}
              </button>
            );
          })}
        </div>

        {/* Subject grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {profileOptions.map(s => {
            const isSel = selected.includes(s.id);
            const isDis = !isSel && selected.length >= 2;
            const cnt = questionCounts[s.id] || 0;
            return (
              <button key={s.id} onClick={() => !isDis && toggle(s.id)} className="hover-lift" style={{
                padding: 14, borderRadius: 16, border: `2px solid ${isSel ? "var(--jade)" : "var(--line)"}`,
                background: isSel ? "var(--jade-g)" : "var(--card)", cursor: isDis ? "not-allowed" : "pointer",
                opacity: isDis ? 0.4 : 1, textAlign: "left", display: "flex", alignItems: "center", gap: 10,
              }}>
                <span style={{ fontSize: 26 }}>{s.icon}</span>
                <div>
                  <div style={{ color: isSel ? "var(--jade)" : "var(--ink)", fontSize: 13, fontWeight: 800 }}>{s.name_ru}</div>
                  <div style={{ color: "var(--pale)", fontSize: 11, marginTop: 2 }}>{cnt} вопросов</div>
                </div>
                {isSel && (
                  <div style={{ marginLeft: "auto", width: 24, height: 24, borderRadius: 8, background: "var(--jade)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 900 }}>
                    {selected.indexOf(s.id) + 1}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Confirm */}
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: "16px 20px", background: "var(--bg)", borderTop: "1px solid var(--line)", zIndex: 10 }}>
          <button onClick={saveProfile} disabled={selected.length !== 2} className="hover-lift" style={{
            width: "100%", maxWidth: 500, margin: "0 auto", display: "block",
            padding: 16, borderRadius: 18, border: "none",
            background: selected.length === 2 ? "linear-gradient(135deg, var(--jade), var(--royal))" : "var(--dim)",
            color: selected.length === 2 ? "white" : "var(--pale)", fontWeight: 800, fontSize: 15,
            cursor: selected.length === 2 ? "pointer" : "not-allowed",
            boxShadow: selected.length === 2 ? "0 8px 24px rgba(26,122,104,0.35)" : "none",
          }}>
            {selected.length === 0 ? "Выберите 2 предмета" : selected.length === 1 ? "Ещё 1 предмет" : "Начать подготовку →"}
          </button>
        </div>
      </div>
    </div>
  );

  // ========== DASHBOARD ==========
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "var(--bg)", overflow: "auto", WebkitOverflowScrolling: "touch" as any }}>
      <div style={{ position: "absolute", top: -60, right: -40, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, var(--jade-g) 0%, transparent 70%)", opacity: 0.5, pointerEvents: "none" }} />
      <div style={{ maxWidth: 430, margin: "0 auto", padding: "20px 20px 120px", position: "relative", zIndex: 1 }}>

        {/* Header */}
        <div className="animate-in" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: "var(--ink)", fontFamily: "'Fraunces', serif", margin: 0 }}>BilimAI</h1>
            <p style={{ color: "var(--pale)", fontSize: 11, margin: "2px 0 0" }}>Подготовка к ЕНТ 2026</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => { setPhase("onboarding"); setSelected([]); }} style={{
              padding: "8px 12px", borderRadius: 12, border: "1px solid var(--line)",
              background: "var(--card)", color: "var(--mid)", fontSize: 12, cursor: "pointer",
            }}>
              ⚙️
            </button>
            <button onClick={() => router.push("/home")} style={{
              padding: "8px 12px", borderRadius: 12, border: "1px solid var(--line)",
              background: "var(--card)", color: "var(--mid)", fontSize: 12, cursor: "pointer",
            }}>
              ←
            </button>
          </div>
        </div>

        {/* My subjects */}
        <div className="animate-in" style={{ background: "var(--card)", borderRadius: 20, padding: 16, border: "1px solid var(--line)", marginBottom: 12 }}>
          <p style={{ color: "var(--pale)", fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}>Мои предметы</p>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {mySubjects.map(s => s && (
              <span key={s.id} style={{
                padding: "5px 10px", borderRadius: 8, fontSize: 11, fontWeight: 700,
                background: s.sort_order < 10 ? "var(--jade-g)" : "var(--royal-g)",
                color: s.sort_order < 10 ? "var(--jade)" : "var(--royal)",
              }}>
                {s.icon} {s.name_ru}
              </span>
            ))}
          </div>
        </div>

        {/* Stats banner */}
        <div className="animate-in" style={{
          background: "linear-gradient(135deg, var(--jade-g), var(--royal-g))",
          borderRadius: 20, padding: 16, border: "1px solid var(--line)", marginBottom: 16,
          display: "flex", justifyContent: "space-around", textAlign: "center",
        }}>
          <div>
            <p style={{ fontSize: 22, fontWeight: 900, color: "var(--jade)", margin: 0 }}>{totalQuestions}</p>
            <p style={{ fontSize: 10, color: "var(--mid)", margin: 0 }}>вопросов</p>
          </div>
          <div>
            <p style={{ fontSize: 22, fontWeight: 900, color: "var(--royal)", margin: 0 }}>140</p>
            <p style={{ fontSize: 10, color: "var(--mid)", margin: 0 }}>макс. балл</p>
          </div>
          <div>
            <p style={{ fontSize: 22, fontWeight: 900, color: "var(--saffron)", margin: 0 }}>4ч</p>
            <p style={{ fontSize: 10, color: "var(--mid)", margin: 0 }}>на экзамен</p>
          </div>
        </div>

        {/* Two actions */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          <button onClick={() => router.push("/ent/practice")} className="hover-lift" style={{
            padding: "22px 14px", borderRadius: 20, border: "1px solid var(--line)",
            background: "var(--card)", cursor: "pointer", textAlign: "left",
          }}>
            <div style={{ fontSize: 30, marginBottom: 8 }}>🎯</div>
            <div style={{ color: "var(--ink)", fontSize: 15, fontWeight: 800, marginBottom: 4 }}>Тренировка</div>
            <div style={{ color: "var(--pale)", fontSize: 11, lineHeight: 1.4 }}>Вопросы вразброс по всем предметам</div>
          </button>

          <button onClick={() => router.push("/ent/mock")} className="hover-lift" style={{
            padding: "22px 14px", borderRadius: 20, border: "1.5px solid var(--jade)",
            background: "var(--jade-g)", cursor: "pointer", textAlign: "left",
          }}>
            <div style={{ fontSize: 30, marginBottom: 8 }}>📝</div>
            <div style={{ color: "var(--jade)", fontSize: 15, fontWeight: 800, marginBottom: 4 }}>Пробный ЕНТ</div>
            <div style={{ color: "var(--mid)", fontSize: 11, lineHeight: 1.4 }}>Полная имитация с таймером</div>
          </button>
        </div>

        {/* Per-subject progress */}
        <div className="animate-in" style={{ background: "var(--card)", borderRadius: 20, padding: 16, border: "1px solid var(--line)" }}>
          <p style={{ color: "var(--pale)", fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 12 }}>Вопросов по предметам</p>
          {mySubjects.map(s => {
            if (!s) return null;
            const cnt = questionCounts[s.id] || 0;
            return (
              <div key={s.id} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ color: "var(--ink)", fontSize: 12, fontWeight: 700 }}>{s.icon} {s.name_ru}</span>
                  <span style={{ color: "var(--pale)", fontSize: 11 }}>{cnt}</span>
                </div>
                <div style={{ height: 4, borderRadius: 2, background: "var(--dim)" }}>
                  <div style={{
                    height: "100%", borderRadius: 2,
                    width: `${Math.min((cnt / 200) * 100, 100)}%`,
                    background: cnt >= 100 ? "var(--jade)" : cnt >= 50 ? "var(--saffron)" : "var(--ruby)",
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
