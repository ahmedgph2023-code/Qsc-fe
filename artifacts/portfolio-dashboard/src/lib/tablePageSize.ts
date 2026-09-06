import { useCallback, useState } from "react";

export const TABLE_PAGE_SIZE_STORAGE_KEY = "ipms.tablePageSize";

export function resolveStoredPageSize(
  stored: number,
  allowed: readonly number[],
  fallback: number,
): number {
  if (allowed.includes(stored)) return stored;
  const sorted = [...allowed].sort((a, b) => a - b);
  const next = sorted.find((size) => size >= stored);
  return next ?? sorted[sorted.length - 1] ?? fallback;
}

export function readStoredPageSize(
  allowed: readonly number[],
  fallback: number,
  storageKey = TABLE_PAGE_SIZE_STORAGE_KEY,
): number {
  try {
    const raw = localStorage.getItem(storageKey);
    const parsed = raw ? Number(raw) : NaN;
    if (Number.isFinite(parsed) && parsed > 0) {
      return resolveStoredPageSize(parsed, allowed, fallback);
    }
  } catch {
    /* ignore */
  }
  return fallback;
}

export function writeStoredPageSize(size: number, storageKey = TABLE_PAGE_SIZE_STORAGE_KEY) {
  try {
    localStorage.setItem(storageKey, String(size));
  } catch {
    /* ignore */
  }
}

export function useStoredPageSize(
  allowed: readonly number[],
  fallback: number,
  storageKey = TABLE_PAGE_SIZE_STORAGE_KEY,
): [number, (size: number) => void] {
  const [pageSize, setPageSizeState] = useState(() =>
    readStoredPageSize(allowed, fallback, storageKey),
  );

  const setPageSize = useCallback(
    (size: number) => {
      setPageSizeState(size);
      writeStoredPageSize(size, storageKey);
    },
    [storageKey],
  );

  return [pageSize, setPageSize];
}
