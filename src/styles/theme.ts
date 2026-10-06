import { createTheme, PaletteColorOptions } from '@mui/material/styles';
import { colors } from './colors';
import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/500.css';
import '@fontsource/dm-sans/600.css';
import '@fontsource/dm-sans/700.css';
import '@fontsource/dm-sans/800.css';
import {
  red,
  green,
  blue,
  orange,
  amber,
  teal,
  cyan,
  indigo,
  deepPurple,
  purple,
  pink,
  brown,
  blueGrey,
  deepOrange,
  lightBlue,
  lightGreen,
  lime,
  yellow,
} from '@mui/material/colors';

interface ButtonPaletteOptions {
  bg?: string;
  text?: string;
  hover?: string;
  stroke?: string;
}

interface TextFieldPaletteOptions {
  outline?: string;
  mandatory?: string;
  error?: string;
  placeholder?: string;
  selected?: string;
  text?: string;
  label?: string;
}
type MUIColorScale = {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
  A100?: string;
  A200?: string;
  A400?: string;
  A700?: string;
};

declare module '@mui/material/styles' {
  interface SimplePaletteColorOptions {
    gradient?: string;
    bg?: string;
    lite?: string;
    strong?: string;
    10?: string;
    20?: string;
  }

  interface PaletteColor {
    100?: string;
    200?: string;
    300?: string;
    400?: string;
    500?: string;
    600?: string;
    700?: string;
    800?: string;
    900?: string;
    bg?: string;
    strong?: string;
    lite?: string;
    10?: string;
    20?: string;
  }

  interface TypeText {
    link?: string;
    body?: string;
    caption?: string;
    highlight?: string;
    title?: string;
    subtitle?: string;
    subtitle2?: string;
    button?: string;
    contrast?: string;
    legend?: string;
    muted?: string;
    strong?: string;
    tertiary?: string;
    subtle?: string;
    infoTitle?: string;
  }
  interface TypeBackground {
    elevated?: string;
    pressed?: string;
    disabled?: string;
    card?: string;
    highlight?: string;
    lite?: string;
    brand?: string;
    cool?: string;
    mist?: string;
    hover?: string;
    veryLight?: string;
  }
  interface Palette {
    progress?: SimplePaletteColorOptions;
    progress2?: SimplePaletteColorOptions;
    warning2?: SimplePaletteColorOptions;
    status?: {
      completed?: { bg?: string; text?: string };
      queued?: { bg?: string; text?: string };
      running?: { bg?: string; text?: string };
      ready?: { bg?: string; text?: string };
    };
    border?: {
      main?: string;
      lite?: string;
    };
    shadow?: {
      primary?: string;
      subtle?: string;
      hoverBg?: string;
    };
    switch?: {
      trackOff?: string;
      thumb?: string;
    };
    icon?: {
      muted?: string;
      primary?: string;
    };
    checkbox?: {
      primary?: string;
    };
    button?: {
      primary?: ButtonPaletteOptions;
      secondary?: ButtonPaletteOptions;
      outlined?: ButtonPaletteOptions;
      disabled?: ButtonPaletteOptions;
    };
    logout?: {
      gradient?: string;
      border?: string;
    };
    accent?: PaletteColorOptions;
    textfield?: TextFieldPaletteOptions;
    // Expose MUI color scales like palette.grey
    red: MUIColorScale;
    green: MUIColorScale;
    blue: MUIColorScale;
    orange: MUIColorScale;
    amber: MUIColorScale;
    teal: MUIColorScale;
    cyan: MUIColorScale;
    indigo: MUIColorScale;
    deepPurple: MUIColorScale;
    purple: MUIColorScale;
    pink: MUIColorScale;
    brown: MUIColorScale;
    blueGrey: MUIColorScale;
    deepOrange: MUIColorScale;
    lightBlue: MUIColorScale;
    lightGreen: MUIColorScale;
    lime: MUIColorScale;
    yellow: MUIColorScale;
  }

  interface PaletteOptions {
    progress?: SimplePaletteColorOptions;
    progress2?: SimplePaletteColorOptions;
    warning2?: SimplePaletteColorOptions;
    status?: {
      completed?: { bg?: string; text?: string };
      queued?: { bg?: string; text?: string };
      running?: { bg?: string; text?: string };
      ready?: { bg?: string; text?: string };
    };
    border?: {
      main?: string;
      lite?: string;
    };
    shadow?: {
      primary?: string;
      subtle?: string;
      hoverBg?: string;
    };
    switch?: {
      trackOff?: string;
      thumb?: string;
    };
    icon?: {
      muted?: string;
      primary?: string;
    };
    checkbox?: {
      primary?: string;
    };
    button?: {
      primary?: ButtonPaletteOptions;
      secondary?: ButtonPaletteOptions;
      disabled?: ButtonPaletteOptions;
      outlined?: ButtonPaletteOptions;
    };
    logout?: {
      gradient?: string;
      border?: string;
    };
    accent?: PaletteColorOptions;
    textfield?: TextFieldPaletteOptions;
    // Options for MUI color scales
    red?: MUIColorScale;
    green?: MUIColorScale;
    blue?: MUIColorScale;
    orange?: MUIColorScale;
    amber?: MUIColorScale;
    teal?: MUIColorScale;
    cyan?: MUIColorScale;
    indigo?: MUIColorScale;
    deepPurple?: MUIColorScale;
    purple?: MUIColorScale;
    pink?: MUIColorScale;
    brown?: MUIColorScale;
    blueGrey?: MUIColorScale;
    deepOrange?: MUIColorScale;
    lightBlue?: MUIColorScale;
    lightGreen?: MUIColorScale;
    lime?: MUIColorScale;
    yellow?: MUIColorScale;
  }
  interface TypographyVariants {
    body3: React.CSSProperties;
    button2?: React.CSSProperties;
    body4?: React.CSSProperties;
    heading1?: React.CSSProperties;
    heading2?: React.CSSProperties;
    buttonBase?: React.CSSProperties;
    label1?: React.CSSProperties;
    label2?: React.CSSProperties;
    system1?: React.CSSProperties;
    system2?: React.CSSProperties;
    body5?: React.CSSProperties;
    legend?: React.CSSProperties;
  }
  interface TypographyVariantsOptions {
    body3?: React.CSSProperties;
    body4?: React.CSSProperties;
    button2?: React.CSSProperties;
    heading1?: React.CSSProperties;
    heading2?: React.CSSProperties;
    buttonBase?: React.CSSProperties;
    label1?: React.CSSProperties;
    label2?: React.CSSProperties;
    system1?: React.CSSProperties;
    system2?: React.CSSProperties;
    body5?: React.CSSProperties;
    legend?: React.CSSProperties;
  }
}

declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    body3: true;
    body4: true;
    body5: true;
    button2: true;
    heading1: true;
    heading2: true;
    buttonBase: true;
    system1: true;
    system2: true;
    link: true;
    label1: true;
    label2: true;
    legend: true;
  }
}

declare module '@mui/material/Checkbox' {
  interface CheckboxPropsSizeOverrides {
    normal: true;
  }
}

// Function to get theme based on mode
export const getTheme = () =>
  createTheme({
    components: {
      MuiCheckbox: {
        variants: [
          {
            props: { size: 'normal' },
            style: {
              '& .MuiSvgIcon-root': {
                fontSize: 16,
              },
              width: 24,
              height: 24,
            },
          },
        ],
      },
    },
    cssVariables: true,
    typography: {
      fontFamily: '"DM Sans", sans-serif',
      // Headings
      h1: {
        fontWeight: 800,
        fontSize: '3.75rem', // 60px
        letterSpacing: '-1.5px',
      },
      h2: {
        fontWeight: 700,
        fontSize: '3rem', // 48px
        letterSpacing: '-0.5px',
      },
      h3: {
        fontWeight: 700,
        fontSize: '2.25rem', // 36px
      },
      h4: {
        fontWeight: 600,
        fontSize: '1.875rem', // 30px
        letterSpacing: '0.25px',
      },
      h5: {
        fontWeight: 600,
        fontSize: '1.5rem', // 24px
      },
      h6: {
        fontWeight: 600,
        fontSize: '1.25rem', // 20px
        letterSpacing: '0.15px',
      },

      // Subtitles
      subtitle1: {
        fontWeight: 600,
        fontSize: '1.125rem', // 18px
      },
      subtitle2: {
        fontWeight: 600,
        fontSize: '1rem', // 16px
        letterSpacing: '0.1px',
      },

      // Body Text
      body1: {
        fontWeight: 400,
        fontSize: '1rem', // 16px
        letterSpacing: '0.5px',
      },
      body2: {
        fontWeight: 400,
        fontSize: '0.875rem', // 14px
        letterSpacing: '0.25px',
      },
      body3: {
        fontWeight: 400,
        fontSize: '0.75rem', // 12px
        letterSpacing: '0.25px',
      },
      body4: {
        fontWeight: 400,
        fontSize: '0.625rem', // 10px
      },
      body5: {
        fontWeight: 400,
        fontSize: '0.6875rem', // 11px
        letterSpacing: '0%',
      },

      // Buttons
      button: {
        fontWeight: 600,
        fontSize: '0.875rem', // 14px
        letterSpacing: '1.25px',
        textTransform: 'none',
      },
      button2: {
        fontWeight: 500,
        fontSize: '0.875rem', // 14px
        textTransform: 'none',
      },

      // Caption and Overline
      caption: {
        fontWeight: 600,
        fontSize: '0.625rem', // 10px
      },
      overline: {
        fontWeight: 400,
        fontSize: '0.625rem', // 10px
        letterSpacing: '1.5px',
      },
      heading1: {
        fontWeight: 600,
        fontSize: '1.5rem', // 24px
        letterSpacing: '0%',
      },
      heading2: {
        fontWeight: 400,
        fontSize: '1.25rem', // 20px
        letterSpacing: '0%',
      },
      buttonBase: {
        fontWeight: 500,
        fontSize: '0.75rem', // 12px
        letterSpacing: '0%',
      },
      label1: {
        fontWeight: 600,
        fontSize: '0.8125rem', // 13px
        letterSpacing: '-0.08px',
      },
      label2: {
        fontWeight: 600,
        fontSize: '0.5625rem', // 9px
        letterSpacing: '-2%',
      },
      system1: {
        fontWeight: 400,
        fontSize: '0.75rem', // 12px
      },
      system2: {
        fontWeight: 400,
        fontSize: '0.875rem', // 14px
      },
      legend: {
        fontWeight: 500,
        fontSize: '1rem',
      },
    },
    palette: {
      primary: {
        main: colors.primary[500],
        ...colors.primary,
        '50': colors.lightestPrimary,
        lite: colors.primary30015, // 15% of #6764FF
        bg: colors.primary30005, // 5% of #6764FF
      },
      grey: {
        ...colors.grey,
      },
      // Attach MUI color scales for convenient usage via theme.palette.<color>[shade]
      red,
      green,
      blue,
      orange,
      amber,
      teal,
      cyan,
      indigo,
      deepPurple,
      purple,
      pink,
      brown,
      blueGrey,
      deepOrange,
      lightBlue,
      lightGreen,
      lime,
      yellow,
      secondary: {
        main: colors.primary[300],
      },
      divider: colors.lightGrayBg,
      border: {
        main: colors.silver,
        lite: colors.liteBorder,
      },
      shadow: {
        primary: colors.shadowPrimary,
        subtle: colors.shadowSubtle,
        hoverBg: colors.hoverBgSubtle,
      },
      switch: {
        trackOff: colors.grayTrack,
        thumb: colors.white,
      },
      icon: {
        muted: colors.slateGray,
        primary: colors.royalBlue,
      },
      checkbox: {
        primary: colors.deepBlack,
      },
      error: {
        main: colors.vermilionRed,
        bg: colors.vermilionRed30,
        lite: colors.lightBlush,
        strong: colors.vermilionDark,
        '20': colors.vermilionRed20,
        '10': colors.vermilionRed10,
      },
      warning: {
        main: colors.amberGlow,
        bg: colors.amberGlow30,
        '20': colors.amberGlow20,
        '10': colors.amberGlow10,
      },
      success: {
        main: colors.emeraldGreen,
        bg: colors.emeraldGreen30,
        strong: colors.emeraldDark,
        '20': colors.emeraldGreen20,
        '10': colors.emeraldGreen10,
      },
      progress: {
        main: colors.skyBlue,
        bg: colors.skyBlue30,
        strong: colors.darkAzure,
      },
      progress2: {
        main: colors.goldenBrown,
        bg: colors.lightYellow,
      },
      warning2: {
        main: colors.burntOrange,
        bg: colors.burntOrange30,
        '10': colors.burntOrange10,
      },
      status: {
        completed: {
          bg: colors.forestGreen05,
          text: colors.forestGreen,
        },
        queued: {
          bg: colors.bronzeAmber05,
          text: colors.bronzeAmber,
        },
        running: {
          bg: colors.primary30005,
          text: colors.primary[500],
        },
        ready: {
          bg: colors.coolGray,
          text: colors.slateCharcoal,
        },
      },
      info: {
        main: colors.brightBlue,
        bg: colors.brightBlue30,
      },
      background: {
        default: colors.softGray,
        paper: colors.white,
        elevated: colors.white,
        pressed: colors.lightGray,
        card: colors.snowGray,
        highlight: colors.primary20,
        lite: colors.icyLilac,
        brand: colors.brandPurple,
        cool: colors.coolGray,
        mist: colors.mistGray,
        hover: colors.ashMist,
        veryLight: colors.grey[50],
        disabled: colors.paleGray,
      },
      button: {
        primary: {
          bg: colors.primary[400],
          text: colors.white,
          hover: colors.primary[400],
          stroke: colors.primary[300],
        },
        outlined: {
          bg: colors.softGray,
          text: colors.primary[300],
          hover: colors.primary[100],
          stroke: colors.primary[300],
        },
        secondary: {
          bg: colors.primary[500],
          text: colors.white,
          hover: colors.primary[600],
          stroke: colors.primary[500],
        },
        disabled: {
          // bg: colors.primary[300],
          text: colors.dimGray,
          bg: colors.silver,
        },
      },
      logout: {
        gradient:
          'linear-gradient(180deg, #FFFFFF 0%, #F5F3FF 50%, #E9E7FF 100%)',
        border: colors.primaryBorder20,
      },
      text: {
        caption: colors.cloudyGray,
        body: colors.deepGray,
        primary: colors.deepGray,
        link: colors.primary[700],
        contrast: colors.white,
        legend: colors.midnightSlate,
        subtitle: colors.black20,
        subtitle2: colors.primary[300],
        muted: colors.zincGray,
        strong: colors.nearBlack,
        tertiary: colors.slateCharcoal,
        subtle: colors.stoneGray,
        disabled: colors.ashGray,
        infoTitle: colors.richBlack,
      },
      textfield: {
        outline: colors.steelGray,
        mandatory: colors.crimsonRed,
        error: colors.crimsonRed,
        placeholder: colors.steelGray,
      },
    },
  });
