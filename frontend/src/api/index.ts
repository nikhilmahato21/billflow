import axios from "axios";
import { useAuthStore } from "../store/auth";

const API_URL = import.meta.env.VITE_API_URL || "/api";

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

// Request interceptor: attach token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor: refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = useAuthStore.getState().refreshToken;
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
          useAuthStore.getState().setAuth({
            ...useAuthStore.getState() as any,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
          });
          original.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(original);
        } catch {
          useAuthStore.getState().logout();
        }
      }
    }
    return Promise.reject(error);
  }
);

// API helpers
export const authApi = {
  register: (data: object) => api.post("/auth/register", data),
  login: (data: object) => api.post("/auth/login", data),
};

export const onboardingApi = {
  getTemplates: () => api.get("/onboarding/templates"),
  applyTemplate: (templateSlug: string) => api.post("/onboarding/apply-template", { templateSlug }),
  complete: (data: object) => api.patch("/onboarding/complete", data),
};

export const businessApi = {
  get: (id: string) => api.get(`/businesses/${id}`),
  updateProfile: (id: string, data: object) => api.patch(`/businesses/${id}/profile`, data),
  updateSettings: (id: string, data: object) => api.patch(`/businesses/${id}/settings`, data),
  updateReminders: (id: string, data: object) => api.patch(`/businesses/${id}/reminders`, data),
  updateTax: (id: string, data: object) => api.patch(`/businesses/${id}/tax`, data),
};

export const customerApi = {
  list: (search?: string) => api.get("/customers", { params: { search } }),
  create: (data: object) => api.post("/customers", data),
  update: (id: string, data: object) => api.patch(`/customers/${id}`, data),
  delete: (id: string) => api.delete(`/customers/${id}`),
};

export const itemApi = {
  list: (grouped?: boolean) => api.get("/items", { params: { grouped } }),
  create: (data: object) => api.post("/items", data),
  update: (id: string, data: object) => api.patch(`/items/${id}`, data),
  delete: (id: string) => api.delete(`/items/${id}`),
};

export const invoiceApi = {
  list: (params?: object) => api.get("/invoices", { params }),
  create: (data: object) => api.post("/invoices", data),
  get: (id: string) => api.get(`/invoices/${id}`),
  updateStatus: (id: string, status: string) => api.patch(`/invoices/${id}/status`, { status }),
  delete: (id: string) => api.delete(`/invoices/${id}`),
  addPayment: (id: string, data: object) => api.post("/payments", { ...data, invoiceId: id }),
  getPayments: (id: string) => api.get(`/invoices/${id}/payments`),
};

export const posApi = {
  checkout: (data: object) => api.post("/pos/checkout", data),
};

export const subscriptionApi = {
  list: () => api.get("/subscriptions"),
  create: (data: object) => api.post("/subscriptions", data),
  update: (id: string, data: object) => api.patch(`/subscriptions/${id}`, data),
};

export const dashboardApi = {
  stats: () => api.get("/dashboard/stats"),
  revenue: (period?: string) => api.get("/dashboard/revenue", { params: { period } }),
};


// Me endpoint
export const meApi = {
  get: () => api.get("/auth/me"),
};

// Staff API
export const staffApi = {
  list: () => api.get("/staff"),
  invite: (data: object) => api.post("/staff", data),
  updateRole: (id: string, role: string) => api.patch(`/staff/${id}`, { role }),
  remove: (id: string) => api.delete(`/staff/${id}`),
};


// ─── Razorpay API ─────────────────────────────────────────────────────────────
export const razorpayApi = {
  // Plans
  listPlans:         ()                     => api.get("/razorpay/plans"),
  createPlan:        (data: object)         => api.post("/razorpay/plans", data),
  createPlanForItem: (itemId: string)       => api.post(`/razorpay/plans/item/${itemId}`),

  // Subscriptions
  listSubscriptions:   ()                   => api.get("/razorpay/subscriptions"),
  createSubscription:  (data: object)       => api.post("/razorpay/subscriptions", data),
  getSubscription:     (id: string)         => api.get(`/razorpay/subscriptions/${id}`),
  cancelSubscription:  (id: string, atCycleEnd = false) =>
    api.post(`/razorpay/subscriptions/${id}/cancel`, {}, { params: { at_cycle_end: atCycleEnd } }),
  pauseSubscription:   (id: string)         => api.post(`/razorpay/subscriptions/${id}/pause`),
  resumeSubscription:  (id: string)         => api.post(`/razorpay/subscriptions/${id}/resume`),
  syncSubscription:    (id: string)         => api.post(`/razorpay/subscriptions/${id}/sync`),

  // Payment verification
  verifyPayment: (data: {
    razorpayPaymentId:      string;
    razorpaySubscriptionId: string;
    razorpaySignature:      string;
  }) => api.post("/razorpay/verify-payment", data),
};
