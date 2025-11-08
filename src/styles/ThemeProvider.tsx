import React, { createContext, useContext, useMemo, useState } from 'react';
import { darkTheme, lightTheme, type Theme } from './theme';

type ThemeContextValue = {
  theme: Theme;
  mode: 'light' | 'dark';
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<'light' | 'dark'>('light');
  const theme = mode === 'light' ? lightTheme : darkTheme;
  const value = useMemo<ThemeContextValue>(
    () => ({ theme, mode, toggleTheme: () => setMode((m) => (m === 'light' ? 'dark' : 'light')) }),
    [theme, mode],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('Không thể sử dụng useTheme ngoài ThemeProvider');
  return ctx;
};
