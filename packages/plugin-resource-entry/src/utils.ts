export const requestIdleCallback =
  window.requestIdleCallback ||
  function requestIdleCallback(cb: IdleRequestCallback): number {
    const start = Date.now();
    return window.setTimeout(() => {
      cb({
        didTimeout: false,
        timeRemaining() {
          // eslint-disable-next-line @typescript-eslint/no-magic-numbers
          return Math.max(0, 50 - (Date.now() - start));
        },
      });
    }, 1);
  };
