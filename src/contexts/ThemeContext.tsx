import { useEffect } from 'react';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Always apply dark mode
    const root = window.document.documentElement;
    root.classList.add('dark');
  }, []);

  return <>{children}</>;
}
