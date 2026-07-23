const NAMESPACE = 'habitforge';

/** Thin wrapper around localStorage so the persistence layer is swappable later. */
export const storage = {
  get<T>(key: string, fallback: T): T {
    try {
      const raw = window.localStorage.getItem(`${NAMESPACE}:${key}`);
      if (!raw) return fallback;
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  },
  set<T>(key: string, value: T): void {
    try {
      window.localStorage.setItem(`${NAMESPACE}:${key}`, JSON.stringify(value));
    } catch {
      // Storage full or unavailable (private browsing) — fail silently, in-memory state still works.
    }
  },
  remove(key: string): void {
    window.localStorage.removeItem(`${NAMESPACE}:${key}`);
  },
};
