import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  ThemeProvider,
  type PaletteMode,
  StyledEngineProvider,
} from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import { getTheme } from 'styles/theme';
import ThemeContext from './ThemeContext';

const ThemeContextProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const getSystemTheme = (): PaletteMode => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  };

  // const storedPreferredMode =
  //   (localStorage.getItem("preferredMode") as "system" | PaletteMode) ||
  //   "system";
  const [preferredMode, setPreferredMode] = useState<'system' | PaletteMode>(
    // storedPreferredMode
    'light',
  );
  const [mode, setMode] = useState<PaletteMode>(
    preferredMode === 'system' ? getSystemTheme() : preferredMode,
  );

  useEffect(() => {
    if (preferredMode === 'system') {
      setMode(getSystemTheme());
    }
  }, [preferredMode]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = () => {
      if (preferredMode === 'system') {
        setMode(getSystemTheme());
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [preferredMode]);

  useEffect(() => {
    localStorage.setItem('preferredMode', preferredMode);
  }, [preferredMode]);

  const theme = useMemo(() => getTheme(), [mode]);

  const toggleTheme = useCallback(() => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setPreferredMode(newMode);
    setMode(newMode);
    return newMode;
  }, [mode]);

  const contextValue = useMemo(
    () => ({ theme, toggleTheme, mode, preferredMode, setPreferredMode }),
    [toggleTheme, mode, preferredMode, setPreferredMode],
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      <ThemeProvider theme={theme}>
        <StyledEngineProvider injectFirst>
          <CssBaseline />
          {children}
        </StyledEngineProvider>
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};

export default ThemeContextProvider;
