import { MD3LightTheme, type MD3Theme } from "react-native-paper";

/**
 * Application visual language.
 *
 * React Native Paper (MIT) provides the component primitives. The theme below
 * gives them a warm, modern fitness identity: sun-washed ivory surfaces, deep
 * plum text, vivid violet actions and a soft lime accent for positive states.
 *
 * Keep colors, spacing and typography centralized so screens do not encode
 * their own visual decisions.
 */
export const appTheme: MD3Theme = {
  ...MD3LightTheme,
  roundness: 12,
  colors: {
    ...MD3LightTheme.colors,
    primary: "#6C2BD9",
    onPrimary: "#FFFFFF",
    primaryContainer: "#EFE4FC",
    onPrimaryContainer: "#35135F",
    secondary: "#71893F",
    onSecondary: "#FFFFFF",
    secondaryContainer: "#F0F6D9",
    onSecondaryContainer: "#364312",
    tertiary: "#B05168",
    onTertiary: "#FFFFFF",
    tertiaryContainer: "#FBE7E9",
    onTertiaryContainer: "#4E1F2B",
    error: "#A13A34",
    onError: "#FFFFFF",
    errorContainer: "#FFEDEC",
    onErrorContainer: "#6D211D",
    background: "#FBF6F8",
    onBackground: "#2D1B36",
    surface: "#FFFFFF",
    onSurface: "#2D1B36",
    surfaceVariant: "#F5ECE8",
    onSurfaceVariant: "#7A6A77",
    outline: "#B7A5AD",
    outlineVariant: "#EEE0DB",
    shadow: "#3A2442",
    scrim: "#000000",
    inverseSurface: "#392D3F",
    inverseOnSurface: "#FBF4F8",
    inversePrimary: "#D9BDFA",
    elevation: {
      ...MD3LightTheme.colors.elevation,
      level0: "transparent",
      level1: "#FFF9F5",
      level2: "#FDF3EE",
      level3: "#FAEDE8",
      level4: "#F8EAE4",
      level5: "#F6E6E0",
    },
  },
};

/** Semantic colors used by shared and feature components. */
export const colors = {
  background: appTheme.colors.background,
  surface: appTheme.colors.surface,
  surfaceMuted: "#F9F0EB",
  surfaceLavender: "#F5EFFC",
  surfaceSet: "#F4EEFB",
  text: appTheme.colors.onSurface,
  textMuted: appTheme.colors.onSurfaceVariant,
  border: appTheme.colors.outlineVariant,
  primary: appTheme.colors.primary,
  primaryPressed: "#571FB3",
  primarySoft: appTheme.colors.primaryContainer,
  primarySoftStrong: "#E2D2F7",
  onPrimary: appTheme.colors.onPrimary,
  secondary: "#F1ECF8",
  secondaryPressed: "#E6DEEE",
  onSecondary: "#4E2D72",
  sage: "#71893F",
  sageSoft: "#F0F6D9",
  positive: "#DDF28C",
  positivePressed: "#CCE874",
  positiveSoft: "#F4F9DF",
  onPositive: "#39480F",
  sand: "#A87343",
  sandSoft: "#F8E9D8",
  rose: "#B05168",
  roseSoft: "#FBE7E9",
  blush: "#FBE8E7",
  lavender: "#F1E7FB",
  lavenderStrong: "#E4D4F7",
  ink: "#301A45",
  onInk: "#FFFFFF",
  peach: "#FBE3CC",
  gold: "#E4A62F",
  coral: "#ED8C82",
  shadow: appTheme.colors.shadow,
  danger: appTheme.colors.error,
  dangerPressed: "#822D28",
  onDanger: appTheme.colors.onError,
  disabled: "#B9ACB2",
  inputBackground: appTheme.colors.surface,
  errorBackground: appTheme.colors.errorContainer,
  errorBorder: "#E5B5B1",
  errorText: appTheme.colors.onErrorContainer,
  scrim: appTheme.colors.scrim,
  scrimOpacity: 0.45,
} as const;

/**
 * Screen-scoped palette for the saved-workout summary (Workout Detail).
 *
 * The 2026-11-18 design revision gives this screen a warm beige and cream
 * canvas with energetic lime, lavender and sky-blue accents. Red is reserved
 * for warnings and destructive states. The rest of the application keeps the
 * violet baseline until an explicit global migration is approved.
 */
export const workoutSummaryColors = {
  background: "#F1EAE0",
  surface: "#FFF3E7",
  surfaceMuted: "#F7EBDD",
  text: "#340404",
  textMuted: "#4B2323",
  border: "#E3D4C2",
  action: "#D7DC38",
  actionPressed: "#C5CB2C",
  onAction: "#340404",
  accent: "#C4BBFE",
  accentPressed: "#B1A6FB",
  onAccent: "#340404",
  accentSoft: "#EBE6FF",
  info: "#9CB9D9",
  infoSoft: "#DFEAF5",
  onInfo: "#340404",
  danger: "#ED4140",
  dangerSoft: "#FBDAD6",
  dangerText: "#A8231F",
  onDanger: "#340404",
  divider: "rgba(52, 4, 4, 0.14)",
  shadow: "#340404",
  pressOverlay: "rgba(52, 4, 4, 0.08)",
} as const;

/**
 * Paper theme scoped to Workout Detail components that read theme defaults,
 * such as the weight dialog and its text input. It never replaces the global
 * provider.
 */
export const workoutSummaryTheme: MD3Theme = {
  ...appTheme,
  colors: {
    ...appTheme.colors,
    primary: workoutSummaryColors.text,
    onPrimary: workoutSummaryColors.surface,
    primaryContainer: workoutSummaryColors.accentSoft,
    onPrimaryContainer: workoutSummaryColors.text,
    secondary: workoutSummaryColors.accent,
    onSecondary: workoutSummaryColors.onAccent,
    secondaryContainer: workoutSummaryColors.accentSoft,
    onSecondaryContainer: workoutSummaryColors.text,
    tertiary: workoutSummaryColors.info,
    onTertiary: workoutSummaryColors.onInfo,
    tertiaryContainer: workoutSummaryColors.infoSoft,
    onTertiaryContainer: workoutSummaryColors.text,
    /*
     * Paper uses `error` for text and outlines, so the scoped theme needs the
     * darker AA-compliant red. The brighter `danger` fill stays reserved for
     * badges and warning surfaces.
     */
    error: workoutSummaryColors.dangerText,
    onError: workoutSummaryColors.onDanger,
    errorContainer: workoutSummaryColors.dangerSoft,
    onErrorContainer: workoutSummaryColors.text,
    background: workoutSummaryColors.background,
    onBackground: workoutSummaryColors.text,
    surface: workoutSummaryColors.surface,
    onSurface: workoutSummaryColors.text,
    surfaceVariant: workoutSummaryColors.surfaceMuted,
    onSurfaceVariant: workoutSummaryColors.textMuted,
    outline: workoutSummaryColors.border,
    outlineVariant: workoutSummaryColors.border,
    shadow: workoutSummaryColors.shadow,
    inverseSurface: workoutSummaryColors.text,
    inverseOnSurface: workoutSummaryColors.surface,
    inversePrimary: workoutSummaryColors.action,
    elevation: {
      ...MD3LightTheme.colors.elevation,
      level0: "transparent",
      level1: "#FFF6EC",
      level2: "#FCF0E3",
      level3: "#F9EBDD",
      level4: "#F7E8D9",
      level5: "#F5E4D4",
    },
  },
};

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

/**
 * Display typeface used by the redesigned workout summary.
 *
 * Nunito is distributed under the SIL Open Font License. Static weights are
 * bundled in `assets/fonts`, so the screen works offline and keeps the same
 * personality on iOS, Android and web.
 */
export const fonts = {
  regular: "Nunito_400Regular",
  semibold: "Nunito_600SemiBold",
  bold: "Nunito_700Bold",
  extraBold: "Nunito_800ExtraBold",
} as const;

export const fontSizes = {
  display: 34,
  hero: 32,
  title: 28,
  heading: 22,
  subheading: 17,
  body: 16,
  small: 14,
  tiny: 12,
} as const;
