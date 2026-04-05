export const colors = {
  // Backgrounds
  bg: '#0f0f13',
  bgCard: '#18181f',
  bgInput: '#2a2a35',
  border: '#2a2a35',

  // Brand
  primary: '#7c3aed',
  primaryLight: '#a855f7',
  primaryMuted: 'rgba(124,58,237,0.15)',
  primaryBorder: 'rgba(124,58,237,0.3)',

  pink: '#db2777',
  pinkLight: '#f9a8d4',
  pinkMuted: 'rgba(219,39,119,0.12)',

  // Text
  textPrimary: '#f9fafb',
  textSecondary: '#9ca3af',
  textMuted: '#6b7280',

  // Status
  success: '#4ade80',
  warning: '#fbbf24',
  error: '#f87171',

  // Service icons
  iconPink: '#fce7f3',
  iconPurple: '#ede9fe',
  iconBlue: '#dbeafe',
  iconGreen: '#d1fae5',

  white: '#ffffff',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  full: 999,
};

import { Platform } from 'react-native';
// Altura de la barra de navegación del sistema Android (botones atrás/home/recientes)
export const BOTTOM_INSET = Platform.OS === 'android' ? 48 : 0;

export const shadow = {
  primary: {
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
};
