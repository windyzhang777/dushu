export type Theme = 'light' | 'dark' | 'sepia';
export const THEMES: Theme[] = ['light', 'dark', 'sepia'];

export interface ThemeColors {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  border: string;
  highlight: string;
  highlightTint: string;
}

export const themes: Record<Theme, ThemeColors> = {
  light: {
    background: '#FFFFFF',
    foreground: '#1A1A1A',
    card: '#FFFFFF',
    cardForeground: '#1A1A1A',
    primary: '#D4A017',
    primaryForeground: '#5C3D0A',
    secondary: '#E5E5E5',
    secondaryForeground: '#4A4A4A',
    muted: '#F5F5F5',
    mutedForeground: '#737373',
    accent: '#F5F5F5',
    accentForeground: '#1A1A1A',
    destructive: '#DA553B',
    border: '#E5E5E5',
    highlight: '#FEF3C7',
    highlightTint: '#FDE68A',
  },
  dark: {
    background: '#1A1A1A',
    foreground: '#FAFAFA',
    card: '#262626',
    cardForeground: '#FAFAFA',
    primary: '#D4A017',
    primaryForeground: '#FEF9C3',
    secondary: '#4A4A4A',
    secondaryForeground: '#E5E5E5',
    muted: '#2E2E2E',
    mutedForeground: '#A3A3A3',
    accent: '#2E2E2E',
    accentForeground: '#FAFAFA',
    destructive: '#E06B53',
    border: '#4A4A4A',
    highlight: '#5C4556',
    highlightTint: '#7C5C7C',
  },
  sepia: {
    background: '#F4ECD8',
    foreground: '#5B4636',
    card: '#F4ECD8',
    cardForeground: '#5B4636',
    primary: '#C29037',
    primaryForeground: '#5B4636',
    secondary: '#E5E5E5',
    secondaryForeground: '#5B4636',
    muted: '#EDE0C8',
    mutedForeground: '#5B4636',
    accent: '#EDE0C8',
    accentForeground: '#5B4636',
    destructive: '#DA553B',
    border: '#E5E5E5',
    highlight: '#FEF3C7',
    highlightTint: '#FDE68A',
  },
};
