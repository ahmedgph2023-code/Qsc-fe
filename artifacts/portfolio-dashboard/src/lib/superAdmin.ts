export const SUPER_ADMIN_USERNAME = "super_admin@gmail.com";

export function isSuperAdmin(username: string | null | undefined): boolean {
  return (username || "").trim().toLowerCase() === SUPER_ADMIN_USERNAME.toLowerCase();
}
