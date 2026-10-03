import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// RTL's automatic cleanup only self-registers when Vitest's `globals: true`
// is enabled (it hooks into a global `afterEach`). This project imports
// test globals explicitly instead, so cleanup is wired up here — without
// it, every render() in a file stacks up in the same jsdom document.
afterEach(() => {
  cleanup();
});

/**
 * Guarantees a working `localStorage` for every test file, regardless of
 * whether the jsdom environment in a given Vitest/jsdom/Node/OS combination
 * actually provides a functional one. `window.localStorage` in jsdom is
 * only backed by a real implementation for non-opaque origins, and its
 * exact availability has been observed to vary across machines/versions —
 * so rather than depend on that always holding, this installs a minimal,
 * spec-equivalent in-memory Storage as a fallback the moment it's missing.
 * Centralized here (not per test file) so no individual test needs to know
 * or care whether it's running against jsdom's own implementation or this
 * one — lib/local-fallback.ts only ever calls getItem/setItem/removeItem.
 */
function installLocalStorageFallbackIfMissing(): void {
  const isFunctional = typeof globalThis.localStorage?.setItem === "function" && typeof globalThis.localStorage?.getItem === "function";
  if (isFunctional) return;

  const store = new Map<string, string>();
  const memoryStorage: Storage = {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => {
      store.set(key, String(value));
    },
    removeItem: (key) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
    key: (index) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
  };

  Object.defineProperty(globalThis, "localStorage", { value: memoryStorage, configurable: true, writable: true });
}

installLocalStorageFallbackIfMissing();
