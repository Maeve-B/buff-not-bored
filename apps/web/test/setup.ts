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
