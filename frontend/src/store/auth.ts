import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Business {
  id: string;
  name: string;
  onboardingComplete: boolean;
}

interface AuthState {
  user: User | null;
  business: Business | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (data: { user: User; business: Business; accessToken: string; refreshToken: string }) => void;
  updateBusiness: (data: Partial<Business>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      business: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setAuth: (data) =>
        set({
          user: data.user,
          business: data.business,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          isAuthenticated: true,
        }),

      updateBusiness: (data) =>
        set((state) => ({
          business: state.business ? { ...state.business, ...data } : null,
        })),

      logout: () =>
        set({
          user: null,
          business: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        }),
    }),
    { name: "billflow-auth" }
  )
);

// Onboarding state (not persisted)
interface OnboardingState {
  step: number;
  data: Record<string, unknown>;
  setStep: (step: number) => void;
  setData: (data: Record<string, unknown>) => void;
  nextStep: () => void;
  prevStep: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  step: 1,
  data: {},
  setStep: (step) => set({ step }),
  setData: (data) => set((state) => ({ data: { ...state.data, ...data } })),
  nextStep: () => set((state) => ({ step: state.step + 1 })),
  prevStep: () => set((state) => ({ step: Math.max(1, state.step - 1) })),
}));
