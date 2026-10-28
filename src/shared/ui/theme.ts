import { MD3LightTheme, type MD3Theme } from 'react-native-paper';

/**
 * Application visual language.
 *
 * React Native Paper (MIT) provides the component primitives. The theme below
 * gives them a calm, editorial identity suitable for a personal training app:
 * warm neutral surfaces, deep plum text and a rosewood accent.
 *
 * Keep colors, spacing and typography centralized so screens do not encode
 * their own visual decisions.
 */
export const appTheme: MD3Theme = {
  ...MD3LightTheme,
  roundness: 4,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#B4475B',
    onPrimary: '#FFFFFF',
    primaryContainer: '#F8DDE1',
    onPrimaryContainer: '#4A101C',
    secondary: '#66795F',
    onSecondary: '#FFFFFF',
    secondaryContainer: '#E8EEE2',
    onSecondaryContainer: '#2D3A29',
    tertiary: '#A87343',
    onTertiary: '#FFFFFF',
    tertiaryContainer: '#F7E5D4',
    onTertiaryContainer: '#47280F',
    error: '#A13A34',
    onError: '#FFFFFF',
    errorContainer: '#FFEDEC',
    onErrorContainer: '#6D211D',
    background: '#FAF6F3',
    onBackground: '#2C2029',
    surface: '#FFFFFF',
    onSurface: '#2C2029',
    surfaceVariant: '#F2E8E2',
    onSurfaceVariant: '#6A5A65',
    outline: '#B6A3AC',
    outlineVariant: '#E5D7D1',
    shadow: '#1E1118',
    scrim: '#000000',
    inverseSurface: '#392D35',
    inverseOnSurface: '#F8EFEA',
    inversePrimary: '#F4B6C1',
    elevation: {
      ...MD3LightTheme.colors.elevation,
      level0: 'transparent',
      level1: '#FFF9F6',
      level2: '#FBF1EC',
      level3: '#F8EAE4',
      level4: '#F6E7E1',
      level5: '#F4E3DD',
    },
  },
};

/** Semantic colors used by shared and feature components. */
export const colors = {
  background: appTheme.colors.background,
  surface: appTheme.colors.surface,
  surfaceMuted: '#F7EFEA',
  text: appTheme.colors.onSurface,
  textMuted: appTheme.colors.onSurfaceVariant,
  border: appTheme.colors.outlineVariant,
  primary: appTheme.colors.primary,
  primaryPressed: '#943647',
  primarySoft: appTheme.colors.primaryContainer,
  onPrimary: appTheme.colors.onPrimary,
  secondary: '#F0E6E0',
  secondaryPressed: '#E4D7D0',
  onSecondary: '#392A34',
  sage: '#66795F',
  sageSoft: '#E8EEE2',
  sand: '#A87343',
  sandSoft: '#F7E5D4',
  danger: appTheme.colors.error,
  dangerPressed: '#822D28',
  onDanger: appTheme.colors.onError,
  disabled: '#B9ACB2',
  inputBackground: appTheme.colors.surface,
  errorBackground: appTheme.colors.errorContainer,
  errorBorder: '#E5B5B1',
  errorText: appTheme.colors.onErrorContainer,
  scrim: appTheme.colors.scrim,
  scrimOpacity: 0.45,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radii = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

export const fontSizes = {
  display: 34,
  title: 28,
  heading: 22,
  subheading: 17,
  body: 16,
  small: 14,
  tiny: 12,
} as const;
