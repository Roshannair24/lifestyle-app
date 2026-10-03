/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import "@/global.css";

import { Platform } from "react-native";

// const COLORS = {
//   primary: "#1f5f4a",
//   text: "#1a1a1a",
//   muted: "#6b7280",
//   border: "#d1d5db",
//   error: "#dc2626",
//   bg: "#ffffff",
// };

export const Colors = {
  // light: {
  //   text: '#000000',
  //   background: '#ffffff',
  //   backgroundElement: '#F0F0F3',
  //   backgroundSelected: '#E0E1E6',
  //   textSecondary: '#60646C',
  // },
  // dark: {
  //   text: '#ffffff',
  //   background: '#000000',
  //   backgroundElement: '#212225',
  //   backgroundSelected: '#2E3135',
  //   textSecondary: '#B0B4BA',
  // },

  light: {
    text: "#1a1a1a",
    background: "#fafaf7",
    backgroundElement: "#F0F0F3",
    backgroundSelected: "#E0E1E6",
    textSecondary: "#667085",
    primary: "#1f5f4a", // placeholder: match to app.padosipro.com
    border: "#d1d5db",
    error: "#dc2626",
    success: "#15803D",
  },
  dark: {
    text: "#ffffff",
    background: "#000000",
    backgroundElement: "#212225",
    backgroundSelected: "#2E3135",
    textSecondary: "#B0B4BA",
    primary: "#3fa080",
    border: "#3a3d42",
    error: "#f87171",
    success: "#15803D",
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "var(--font-display)",
    serif: "var(--font-serif)",
    rounded: "var(--font-rounded)",
    mono: "var(--font-mono)",
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
