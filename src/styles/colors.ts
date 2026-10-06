import { alpha } from '@mui/material';

export const colors = {
  primary: {
    100: '#E5F0FB',
    200: '#9896FF',
    300: '#6764FF',
    400: '#3835D1',
    500: '#2A289D',
    600: '#22217F',
    700: '#1D1B6B',
    800: '#14134D',
    900: '#0E0D33',
  },
  grey: {
    50: '#FBF9FA',
    100: '#F6F3F4',
    200: '#EBE6E7',
    300: '#D1D5DC',
    400: '#99A1AF',
    500: '#6A7282',
    600: '#4A5565',
    700: '#364153',
    800: '#1E2939',
    900: '#101828',
  },
  primary30015: alpha('#6764FF', 0.15), // 15% -> rgba(103, 100, 255, 0.15)
  primary30005: alpha('#6764FF', 0.05), // 5% -> rgba(103, 100, 255, 0.05)
  primary30050: alpha('#6764FF', 0.5), // 50% -> rgba(103, 100, 255, 0.5)
  shadowPrimary: alpha('#6764FF', 0.5), // 50% -> rgba(103, 100, 255, 0.5)
  shadowSubtle: alpha('#000000', 0.1), // 10% -> rgba(0, 0, 0, 0.1)
  hoverBgSubtle: alpha('#000000', 0.05), // 5% -> rgba(0, 0, 0, 0.05)
  grayTrack: '#CBCED4',
  primaryBorder20: alpha('#6764FF', 0.2), // 20% -> rgba(103, 100, 255, 0.2)
  lightestPrimary: '#F3F3FF',
  primary20: alpha('#3835D1', 0.2), // 20% -> rgba(56, 53, 209, 0.2)
  secondaryPurple: '#5B5A9D',
  successBright: '#00C950',
  ashGray: '#99A1AF',
  darkGray: '#111111',
  deepGray: '#222222',
  deepGray70: alpha('#222222', 0.7), // 70% -> rgba(34, 34, 34, 0.7)
  steelGray: '#677379',
  silverGray: '#BFC5C8',
  graphiteGray: '#2D2D2D',
  darkMaroon: '#0C0006',
  charcoalBrown: '#110D0F',
  crimsonRed: '#EA4A4A',
  wineRed: '#8C0D0D',
  pastelPink: '#FFD2E9',
  vividPink: '#CF1575',
  darkTeal: '#1C2B33',
  brightRed: '#FF4A4A',
  brightRed30: alpha('#FF4A4A', 0.3), // 30% -> rgba(255, 74, 74, 0.3)
  warmOrange: '#FEBA31',
  warmOrange30: alpha('#FEBA31', 0.3), // 30% -> rgba(254, 186, 49, 0.3)
  limeGreen: '#A2E91F',
  limeGreen30: alpha('#A2E91F', 0.3), // 30% -> rgba(162, 233, 31, 0.3)
  skyBlue: '#3388FF',
  skyBlue30: alpha('#3388FF', 0.3), // 30% -> rgba(51, 136, 255, 0.3)
  lightGray: '#E5E5E5',
  softGray: '#F4F4F4',
  neutralGray: '#909394',
  blushPink: '#FFEBF5',
  richPink: '#D0227C',
  silver: '#D7D7D7',
  charcoal: '#303030',
  mediumGray: '#828282',
  intenseRed: '#DE350B',
  intenseRed30: alpha('#CE1717', 0.3), // 30% -> rgba(206, 23, 23, 0.3)
  burntOrange: '#FF6900',
  burntOrange30: alpha('#FF6900', 0.3), // 30% -> rgba(255, 105, 0, 0.3)
  burntOrange10: alpha('#FF6900', 0.1), // 10% -> rgba(255, 105, 0, 0.1)
  vibrantGreen: '#1DBD53',
  vibrantGreen30: alpha('#53BD1A', 0.3), // 30% -> rgba(83, 189, 26, 0.3)
  deepBlue: '#0960DB',
  deepBlue20: alpha('#0960DB', 0.2), // 20% -> rgba(9, 96, 219, 0.2)
  blackCherry: '#2E041A',
  peachyPink: '#FFC9E5',
  snowGray: '#F9F9F9',
  paleGray: '#F9FAFB',
  coolGray: '#F3F4F6',
  mistGray: '#E5E7EB',
  ashMist: '#D1D5DC',
  black8: alpha('#000000', 0.8), // 80% -> rgba(0, 0, 0, 0.8)
  zincGray: '#52525B',
  nearBlack: '#010105',
  slateCharcoal: '#364153',
  slateGray: '#4A5565',
  stoneGray: '#6A7282',
  deepBlack: '#030213',
  richBlack: '#101828',
  vermilionRed: '#DE350B',
  vermilionRed30: alpha('#DE350B', 0.3), // 30% -> rgba(222, 53, 11, 0.3)
  vermilionRed20: alpha('#DE350B', 0.2), // 20% -> rgba(222, 53, 11, 0.2)
  vermilionRed10: alpha('#DE350B', 0.1), // 10% -> rgba(222, 53, 11, 0.1)
  vermilionDark: '#A62A07',
  emeraldGreen: '#1DBD53',
  emeraldGreen30: alpha('#1DBD53', 0.3), // 30% -> rgba(29, 189, 83, 0.3)
  emeraldGreen20: alpha('#1DBD53', 0.2), // 20% -> rgba(29, 189, 83, 0.2)
  emeraldGreen10: alpha('#1DBD53', 0.1), // 10% -> rgba(29, 189, 83, 0.1)
  emeraldDark: '#036C26',
  forestGreen: '#008236',
  forestGreen05: '#F0FDF4',
  bronzeAmber: '#A65F00',
  bronzeAmber05: '#FEFCE8',
  amberGlow: '#FFB222',
  amberGlow30: alpha('#FFB222', 0.3), // 30% -> rgba(255, 178, 34, 0.3)
  amberGlow20: alpha('#FFB222', 0.2), // 20% -> rgba(255, 178, 34, 0.2)
  amberGlow10: alpha('#FFB222', 0.1), // 10% -> rgba(255, 178, 34, 0.1)
  cloudyGray: '#8E8E8E',
  cloudyGray50: alpha('#8E8E8E', 0.5), // 50% -> rgba(142, 142, 142, 0.5)
  dimGray: '#7F7F7F',
  brightBlue: '#3A90FF',
  brightBlue30: alpha('#3A90FF', 0.3), // 30% -> rgba(58, 144, 255, 0.3)
  white: '#FFFFFF',
  icyLilac: '#F7F7FF',
  lightGrayBg: '#E9EAEB',
  brandPurple: '#7F56D9',
  midnightSlate: '#263349',
  black20: alpha('#000000', 0.2), // 20% -> rgba(0, 0, 0, 0.2)
  lightBlush: '#F7CCC2',
  darkAzure: '#1A5FD0',
  royalBlue: '#155DFC',
  goldenBrown: '#856404',
  lightYellow: '#FFF3CD',
  liteBorder: '#E4E4E4',
} as const;
