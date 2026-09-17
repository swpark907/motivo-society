import "@testing-library/jest-dom/vitest";

// jsdom에 없는 브라우저 API. Carousel이 쓴다.
if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}
