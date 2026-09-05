import { useState, useEffect, useCallback } from 'react';

// Simple fetch hook with loading/error states.
// Pass `immediate=false` to skip the initial fetch (call `load()` manually).
export const useFetch = (loader, deps = [], { immediate = true } = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await loader();
      setData(result);
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Something went wrong');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => {
    if (!immediate) return;
    load();
  }, [load, immediate]);

  return { data, loading, error, load, setData };
};