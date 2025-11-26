import { useState, useCallback } from 'react';

/**
 * Custom hook for managing loading states consistently
 * Provides a clean way to handle async operations with loading indicators
 *
 * @returns {Object} - Object containing loading state and helper functions
 *
 * @example
 * const { isLoading, withLoading, setLoading } = useLoading();
 *
 * const handleSubmit = async () => {
 *   await withLoading(async () => {
 *     const result = await api.submit(data);
 *     return result;
 *   });
 * };
 */
export default function useLoading(initialState = false) {
  const [isLoading, setIsLoading] = useState(initialState);
  const [error, setError] = useState(null);

  /**
   * Wraps an async function with loading state management
   * @param {Function} asyncFn - Async function to execute
   * @param {Object} options - Configuration options
   * @returns {Promise} - Returns the result of the async function
   */
  const withLoading = useCallback(async (asyncFn, options = {}) => {
    const {
      onSuccess,
      onError,
      onFinally,
      preserveError = false
    } = options;

    try {
      setIsLoading(true);
      if (!preserveError) {
        setError(null);
      }

      const result = await asyncFn();

      if (onSuccess) {
        onSuccess(result);
      }

      return result;
    } catch (err) {
      setError(err);

      if (onError) {
        onError(err);
      } else {
        throw err;
      }
    } finally {
      setIsLoading(false);

      if (onFinally) {
        onFinally();
      }
    }
  }, []);

  /**
   * Resets both loading and error states
   */
  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
  }, []);

  /**
   * Clears only the error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    setLoading: setIsLoading,
    setError,
    withLoading,
    reset,
    clearError
  };
}

/**
 * Hook for managing multiple loading states
 * Useful when you have multiple async operations on the same screen
 *
 * @example
 * const {
 *   isLoading: isSaving,
 *   withLoading: withSaving
 * } = useMultipleLoading();
 *
 * const {
 *   isLoading: isDeleting,
 *   withLoading: withDeleting
 * } = useMultipleLoading();
 */
export const useMultipleLoading = () => {
  return useLoading();
};
