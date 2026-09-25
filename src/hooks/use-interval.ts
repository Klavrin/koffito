import { useEffect, useRef } from "react";

/** Calls `callback` every `ms` while `enabled`; the latest callback is always used. */
export function useInterval(callback: () => void, ms: number, enabled = true) {
  const saved = useRef(callback);

  useEffect(() => {
    saved.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;
    const timer = setInterval(() => saved.current(), ms);
    return () => clearInterval(timer);
  }, [ms, enabled]);
}
