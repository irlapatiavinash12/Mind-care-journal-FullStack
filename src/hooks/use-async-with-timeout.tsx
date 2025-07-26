import { useState, useCallback, useRef } from 'react';

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

interface UseAsyncWithTimeoutOptions {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

export function useAsyncWithTimeout<T>(
  asyncFunction: () => Promise<T>,
  options: UseAsyncWithTimeoutOptions = {}
) {
  const {
    timeout = 10000, // 10 seconds default
    retries = 2,
    retryDelay = 1000
  } = options;

  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: false,
    error: null
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const execute = useCallback(async () => {
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    
    setState({ data: null, loading: true, error: null });

    let currentRetry = 0;
    
    while (currentRetry <= retries) {
      try {
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), timeout);
        });

        const result = await Promise.race([
          asyncFunction(),
          timeoutPromise
        ]);

        setState({ data: result, loading: false, error: null });
        return result;
      } catch (error) {
        if (abortControllerRef.current?.signal.aborted) {
          setState({ data: null, loading: false, error: new Error('Request cancelled') });
          return;
        }

        if (currentRetry === retries) {
          const finalError = error instanceof Error ? error : new Error('Unknown error');
          setState({ data: null, loading: false, error: finalError });
          throw finalError;
        }

        currentRetry++;
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }, [asyncFunction, timeout, retries, retryDelay]);

  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setState({ data: null, loading: false, error: null });
  }, []);

  return {
    ...state,
    execute,
    reset
  };
}