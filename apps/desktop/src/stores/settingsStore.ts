import { create } from "zustand";

interface SettingsStore {
  theme: "dark" | "light";
  aiApiKey: string;
  aiModel: string;
  aiPersona: string;
  language: "zh" | "en";

  setTheme: (theme: "dark" | "light") => void;
  setAiApiKey: (key: string) => void;
  setAiModel: (model: string) => void;
  setAiPersona: (persona: string) => void;
  setLanguage: (lang: "zh" | "en") => void;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  theme: "dark",
  aiApiKey: "",
  aiModel: "claude-sonnet-4-20250514",
  aiPersona: "default",
  language: "zh",

  setTheme: (theme) => {
    document.documentElement.setAttribute("data-theme", theme);
    set({ theme });
  },
  setAiApiKey: (aiApiKey) => set({ aiApiKey }),
  setAiModel: (aiModel) => set({ aiModel }),
  setAiPersona: (aiPersona) => set({ aiPersona }),
  setLanguage: (language) => set({ language }),
}));
