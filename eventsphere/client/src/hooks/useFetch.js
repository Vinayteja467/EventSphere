import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook to perform async operations (like API calls) with loading/error state
 * @param {Function} apiCallFn - Function that returns an axios promise
 * @param {Array} dependencies - Dependency array to trigger refetch
 * @param {Boolean} immediate - Should fetch immediately on mount
 */
export const useFetch = (apiCallFn, dependencies = [], immediate = true) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiCallFn(...args);
      const result = response.data;
      if (result.success) {
        setData(result.data);
        return { success: true, data: result.data };
      } else {
        setError(result.message || 'Operation failed');
        return { success: false, error: result.message };
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Something went wrong';
      setError(errMsg);
      return { success: false, error: errMsg };
    } finally {
      setLoading(false);
    }
  }, [apiCallFn]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, dependencies);

  return { data, loading, error, execute, setData };
};
