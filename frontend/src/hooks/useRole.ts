import { useAuthStore } from "../store/auth";

export type Role = "owner" | "staff" | "accountant";

export function useRole() {
  const { user } = useAuthStore();
  const role = (user?.role ?? "staff") as Role;

  return {
    role,
    isOwner: role === "owner",
    isStaff: role === "staff",
    isAccountant: role === "accountant",

    // Named permission checks — mirrors the backend exactly
    canWrite: role === "owner" || role === "staff",
    canDelete: role === "owner",
    canManageSettings: role === "owner",
    canManagePayments: role === "owner" || role === "accountant",
    canUsePOS: role === "owner" || role === "staff",
    canManageStaff: role === "owner",
    canManageSubscriptions: role === "owner",
  };
}
