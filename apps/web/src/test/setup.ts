import '@testing-library/jest-dom';

// Mock IntersectionObserver
if (typeof window !== 'undefined') {
  (window as any).IntersectionObserver = class IntersectionObserver {
    constructor() { }
    disconnect() { }
    observe() { }
    unobserve() { }
  };

  // Mock ResizeObserver
  (window as any).ResizeObserver = class ResizeObserver {
    constructor() { }
    disconnect() { }
    observe() { }
    unobserve() { }
  };
} 