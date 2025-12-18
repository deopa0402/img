import { useState, useEffect } from 'react';

/**
 * 디바운스 훅
 * @param initialValue 초기값
 * @param delay 지연 시간 (ms)
 * @returns value, debouncedValue, setValue
 */
export function useDebounce(initialValue: string = '', delay: number = 500) {
  const [value, setValue] = useState(initialValue);
  const [debouncedValue, setDebouncedValue] = useState(initialValue);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return {
    value,
    debouncedValue,
    setValue,
  };
}
