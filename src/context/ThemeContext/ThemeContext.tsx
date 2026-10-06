import { createContext } from 'react';
import type { ThemeContextType } from 'typesCustom/context';

const ThemeContext = createContext<ThemeContextType>({
  mode: 'light',
  toggleTheme: () => {},
  preferredMode: 'light',
  setPreferredMode: () => {},
});

export default ThemeContext;
