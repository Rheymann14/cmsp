// src/hooks/use-layout.ts
import { useState, useEffect } from 'react';

export type LayoutOption = 'sidebar' | 'header';
const STORAGE_KEY = 'layoutPreference';

export function useLayout() {
  const [layout, setLayout] = useState<LayoutOption>('header');

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as LayoutOption | null;
    if (stored === 'sidebar' || stored === 'header') {
      setLayout(stored);
    }
  }, []);

  function updateLayout(value: LayoutOption) {
    setLayout(value);
    window.localStorage.setItem(STORAGE_KEY, value);
  }

  return { layout, updateLayout };
}
