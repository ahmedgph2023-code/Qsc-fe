import type { ReactNode } from "react";
import { Redirect } from "wouter";
import { useAuth } from "@/lib/AuthContext";
import { canAccessPath, firstAllowedHome } from "@/lib/access";

/**
 * Hide children when the signed-in user cannot access the current path.
 * Super Admin sees unlocked routes. Locked Phase 2–4 / extra nav stays closed for everyone.
 */
export function RoleGate({
  path,
  children,
  fallback,
}: {
  path: string;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { isAuthenticated, role, username } = useAuth();
  if (!isAuthenticated) return <Redirect to="/login" />;
  if (!canAccessPath(path, { role, username })) {
    if (fallback) return <>{fallback}</>;
    return <Redirect to={firstAllowedHome({ role, username })} />;
  }
  return <>{children}</>;
}
