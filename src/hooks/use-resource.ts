import { useCallback, useEffect, useRef, useState } from "react";

type ResourceState<T> = { data?: T; loading: boolean; error?: unknown };

/**
 * Loads async data for a screen and exposes refresh/update helpers.
 * Wrap `load` in `useCallback` so the request only re-runs when its inputs change.
 */
export function useResource<T>(load: () => Promise<T>, enabled = true) {
  const [state, setState] = useState<ResourceState<T>>({ loading: enabled });
  // Ignore responses from requests that were superseded by a newer one.
  const requestId = useRef(0);

  const refresh = useCallback(async () => {
    const id = ++requestId.current;
    setState((current) => ({ ...current, loading: true, error: undefined }));

    try {
      const data = await load();
      if (id === requestId.current) setState({ data, loading: false });
    } catch (error) {
      if (id === requestId.current) setState((current) => ({ ...current, loading: false, error }));
    }
  }, [load]);

  useEffect(() => {
    if (enabled) {
      refresh();
    } else {
      requestId.current++;
      setState({ loading: false });
    }
  }, [enabled, refresh]);

  const setData = useCallback((update: T | ((current: T | undefined) => T)) => {
    setState((current) => ({
      ...current,
      data: typeof update === "function" ? (update as (value: T | undefined) => T)(current.data) : update,
    }));
  }, []);

  return { ...state, refresh, setData };
}
