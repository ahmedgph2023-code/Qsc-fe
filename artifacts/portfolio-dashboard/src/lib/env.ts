/** Client-safe config from `.env` (VITE_* only). See `.env.example`. */
const DEFAULT_API_BASE = "http://localhost:5001/api";

export function getApiBase(): string {
  const fromEnv = import.meta.env.VITE_API_BASE?.trim();
  return fromEnv || DEFAULT_API_BASE;
}
