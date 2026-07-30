export function readStorage<T>(key: string): T | null {
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(key) ?? "null");
    return value && typeof value === "object" ? value as T : null;
  } catch {
    return null;
  }
}

export function writeStorage(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage may be unavailable in privacy mode; the UI remains usable.
  }
}

export function clearAppStorage(): void {
  try {
    for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
      const key = window.localStorage.key(index);
      if (key?.startsWith("valorantbuild.")) {
        window.localStorage.removeItem(key);
      }
    }
  } catch {
    // Storage may be unavailable in privacy mode; reloading still resets UI state.
  }
}
