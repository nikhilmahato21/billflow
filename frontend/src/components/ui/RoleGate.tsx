import React from "react";
import { useRole, Role } from "../../hooks/useRole";

interface RoleGateProps {
  /** Render children only if the user has one of these roles */
  allow?: Role[];
  /** Render children only if the user has this permission flag */
  permission?: keyof ReturnType<typeof useRole>;
  /** What to render when access is denied (default: nothing) */
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Conditionally renders children based on the current user's role.
 *
 * Usage:
 *   <RoleGate allow={["owner"]}>
 *     <DeleteButton />
 *   </RoleGate>
 *
 *   <RoleGate permission="canManagePayments">
 *     <RecordPaymentButton />
 *   </RoleGate>
 */
export function RoleGate({ allow, permission, fallback = null, children }: RoleGateProps) {
  const perms = useRole();

  if (allow && !allow.includes(perms.role)) return <>{fallback}</>;
  if (permission && !perms[permission]) return <>{fallback}</>;

  return <>{children}</>;
}
