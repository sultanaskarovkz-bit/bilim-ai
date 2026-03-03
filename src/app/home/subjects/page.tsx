"use client";
import { EXAMS } from "@/lib/constants";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/stores/appStore";

export default function SubjectsPage() {
  const router = useRouter();
  const { selectedExam, setSelectedExam } = useAppStore();

  return (
    <div>
      <h1 className="text-xl font-black text-slate-800 mb-5">Предметы</h1>
      <div className="flex gap-2 mb-5 overflow-x-auto pb-2">
        {Object.entries(EXAMS).map(([key, exam]) => (
          <button key={key} onClick={() => setSelectedExam(key)}
            className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap ${selectedExam === key ? "bg-purple-600 text-white shadow" : "bg-white text-slate-600 shadow-sm"}`}>
            {exam.icon} {exam.name}
          </button>
        ))}
      </div>
      <button onClick={() => router.push("/home/question?exam=" + selectedExam + "&mode=practice")}
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-purple-500 text-white font-bold shadow-lg mb-4">
        Начать тренировку по {EXAMS[selectedExam]?.name}
      </button>
      <p className="text-center text-sm text-slate-400">Вопросы подбираются по слабым темам</p>
    </div>
  );
}
