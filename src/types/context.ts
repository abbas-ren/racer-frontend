import { type PaletteMode } from '@mui/material/styles';

export interface ThemeContextType {
  theme?: any;
  toggleTheme: () => void;
  mode: PaletteMode;
  preferredMode: 'system' | PaletteMode;
  setPreferredMode: (mode: 'system' | PaletteMode) => void;
}
