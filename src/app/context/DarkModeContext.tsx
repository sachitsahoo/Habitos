import { createContext, useContext } from 'react';

interface DarkModeContextValue {
  isDark: boolean;
  toggleDark: () => void;
}

export const DarkModeContext = createContext<DarkModeContextValue>({
  isDark: false,
  toggleDark: () => {},
});

export const useDarkMode = () => useContext(DarkModeContext);
