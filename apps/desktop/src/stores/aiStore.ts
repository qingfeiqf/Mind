import { create } from "zustand";
import type { UUID, AIMessage } from "@mind/shared";

interface AIStore {
  isOpen: boolean;
  isLoading: boolean;
  currentConversationId: UUID | null;
  messages: AIMessage[];
  streamingContent: string;

  open: () => void;
  close: () => void;
  toggle: () => void;
  setLoading: (loading: boolean) => void;
  setConversation: (id: UUID) => void;
  addMessage: (message: AIMessage) => void;
  setStreamingContent: (content: string) => void;
  appendStreamingContent: (chunk: string) => void;
  clearMessages: () => void;
}

export const useAIStore = create<AIStore>((set) => ({
  isOpen: false,
  isLoading: false,
  currentConversationId: null,
  messages: [],
  streamingContent: "",

  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
  setLoading: (isLoading) => set({ isLoading }),
  setConversation: (id) => set({ currentConversationId: id }),
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  setStreamingContent: (content) => set({ streamingContent: content }),
  appendStreamingContent: (chunk) =>
    set((state) => ({
      streamingContent: state.streamingContent + chunk,
    })),
  clearMessages: () => set({ messages: [], streamingContent: "" }),
}));
