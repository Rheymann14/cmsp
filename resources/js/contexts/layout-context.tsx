// resources/js/contexts/layout-context.tsx
import { createContext, ReactNode, useContext } from 'react';
import { useLayout, LayoutOption } from '@/hooks/use-layout';

type LayoutContextType = {
  layout: LayoutOption;
  updateLayout: (value: LayoutOption) => void;
};

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function LayoutProvider({ children }: { children: ReactNode }) {
  const { layout, updateLayout } = useLayout();
  return (
    <LayoutContext.Provider value={{ layout, updateLayout }}>
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayoutContext() {
  const ctx = useContext(LayoutContext);
  if (!ctx) {
    throw new Error('useLayoutContext must be used within a LayoutProvider');
  }
  return ctx;
}
