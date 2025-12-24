import { create } from 'zustand';
import { AppPhase, HandGesture } from './types';

interface AppState {
  phase: AppPhase;
  gesture: HandGesture;
  isCameraOpen: boolean;
  setPhase: (phase: AppPhase) => void;
  setGesture: (gesture: HandGesture) => void;
  toggleCamera: () => void;
}

export const useStore = create<AppState>((set) => ({
  phase: AppPhase.Tree,
  gesture: HandGesture.None,
  isCameraOpen: false,
  setPhase: (phase) => set({ phase }),
  setGesture: (gesture) => set({ gesture }),
  toggleCamera: () => set((state) => ({ isCameraOpen: !state.isCameraOpen })),
}));