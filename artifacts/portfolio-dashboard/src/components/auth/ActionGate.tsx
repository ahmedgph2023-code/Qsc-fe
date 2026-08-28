import type { ReactNode } from "react";
import { useAuth } from "@/lib/AuthContext";
import { canPerformAction, type AppAction } from "@/lib/access";

/**
 * Render children only when the signed-in user may perform the action (SEC-04).
 */
export function ActionGate({
  action,
  children,
  fallback = null,
}: {
  action: AppAction;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { role, username } = useAuth();
  if (!canPerformAction(action, { role, username })) return <>{fallback}</>;
  return <>{children}</>;
}
