import { create } from "zustand";

interface AppState {
  user: any | null;
  profile: any | null;
  isLoading: boolean;
  selectedExam: string;
  setUser: (user: any) => void;
  setProfile: (profile: any) => void;
  setSelectedExam: (exam: string) => void;
  setLoading: (v: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  profile: null,
  isLoading: true,
  selectedExam: "ent",
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile, selectedExam: profile?.exams?.[0] || "ent", isLoading: false }),
  setSelectedExam: (exam) => set({ selectedExam: exam }),
  setLoading: (v) => set({ isLoading: v }),
}));
