interface IPalette {
  primary: string;
  secondary: string;
  ternary: string;
  backgroundOverlay: string;
  blue: string;
  darkBlue: string;
  darkBlueHover: string;
  blueBackground: string;
  success: string;
  danger: string;
  dangerHover: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
}

interface IMediaQueries {
  mobile: string;
  tablet: string;
  desktop: string;
  desktopLarge: string;
}

interface IMediaQueriesPixels {
  mobile: number;
  tablet: number;
  desktop: number;
  desktopLarge: number;
}

interface IFonts {
  inter: string;
  nunito: string;
}

interface IComponentStyling {
  color?: string;
  background?: string;
  hover?: string;
  backgroundHover?: string;

  boxShadow?: string;

  opacity?: string;

  borderRadius?: string;
  borderColor?: string;

  fontWeight?: string | number;
  border?: string;
}

interface IComponents {
  button: {
    primary: IComponentStyling;
    secondary: IComponentStyling;
    tertiary: IComponentStyling;
    danger: IComponentStyling;
  };
}

export interface IDefaultTheme {
  mediaQueries: IMediaQueries;
  palette: IPalette;
  components: IComponents;
  fonts: IFonts;
}

export const mediaQueries: IMediaQueriesPixels = {
  mobile: 768,
  tablet: 1024,
  desktop: 1366,
  desktopLarge: 1920,
};

const colors: IPalette = {
  primary: '#0c0c0f',
  secondary: '#141618',
  ternary: '#1b1d1e',
  backgroundOverlay: 'rgba(12,12,15,0.5)',
  blue: '#4395FE',
  darkBlue: '#0C3F94',
  darkBlueHover: 'rgba(12,63,148,0.59)',
  blueBackground: '#0F1A2F',
  success: '#33A466',
  danger: '#F82828',
  dangerHover: '#361919',
  textPrimary: '#E7E8E9',
  textSecondary: '#899096',
  border: '#313538',
};

export const theme: IDefaultTheme = {
  mediaQueries: {
    mobile: `@media (max-width: ${mediaQueries.mobile}px)`,
    tablet: `@media (max-width: ${mediaQueries.tablet}px)`,
    desktop: `@media (max-width: ${mediaQueries.desktop}px)`,
    desktopLarge: `@media (max-width: ${mediaQueries.desktopLarge}px)`,
  },
  palette: colors,
  components: {
    button: {
      primary: {
        color: colors.textPrimary,
        background: colors.darkBlue,
        hover: colors.textPrimary,
        backgroundHover: colors.darkBlueHover,
        boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)',
        fontWeight: 500,
        border: `1px solid ${colors.darkBlue}`,
      },
      secondary: {
        color: colors.textPrimary,
        background: colors.ternary,
        hover: colors.textPrimary,
        backgroundHover: colors.border,
        boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)',
        fontWeight: 500,
        border: `1px solid ${colors.border}`,
      },
      tertiary: {
        color: colors.textPrimary,
        background: 'transparent',
        hover: colors.textPrimary,
        backgroundHover: colors.border,
        fontWeight: 500,
        border: 'transparent',
      },
      danger: {
        color: colors.textPrimary,
        background: colors.danger,
        hover: colors.danger,
        backgroundHover: colors.dangerHover,
        boxShadow: '4px 4px 4px rgba(0, 0, 0, 0.25)',
        fontWeight: 500,
        border: `2px solid ${colors.danger}`,
      },
    },
  },
  fonts: {
    inter: 'Inter',
    nunito: 'Nunito',
  },
};
