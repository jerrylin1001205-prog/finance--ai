import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark';

export interface Theme {
  mode: ThemeMode;
  bg: string;
  bg2: string;
  card: string;
  border: string;
  text: string;
  textSub: string;
  textMuted: string;
  primary: string;
  primaryText: string;
  headerBg: string;
  headerText: string;
  headerSub: string;
  income: string;
  expense: string;
  progressBg: string;
  inputBorder: string;
  iconBg: string;
}

export const LIGHT: Theme = {
  mode: 'light',
  bg: '#F8FAFC',
  bg2: '#F1F5F9',
  card: '#FFFFFF',
  border: '#E2E8F0',
  text: '#0F172A',
  textSub: '#475569',
  textMuted: '#94A3B8',
  primary: '#1E40AF',
  primaryText: '#FFFFFF',
  headerBg: '#0F172A',
  headerText: '#FFFFFF',
  headerSub: 'rgba(255,255,255,0.5)',
  income: '#15803D',
  expense: '#B91C1C',
  progressBg: '#E2E8F0',
  inputBorder: '#CBD5E1',
  iconBg: '#F1F5F9',
};

export const DARK: Theme = {
  mode: 'dark',
  bg: '#0F172A',
  bg2: '#1E293B',
  card: '#1E293B',
  border: '#334155',
  text: '#F1F5F9',
  textSub: '#94A3B8',
  textMuted: '#475569',
  primary: '#3B82F6',
  primaryText: '#FFFFFF',
  headerBg: '#020617',
  headerText: '#F1F5F9',
  headerSub: 'rgba(255,255,255,0.4)',
  income: '#22C55E',
  expense: '#F87171',
  progressBg: '#334155',
  inputBorder: '#475569',
  iconBg: '#334155',
};

const KEY = 'app_theme';
let _current: Theme = LIGHT;
let _listeners: Array<(t: Theme) => void> = [];

export async function loadTheme(): Promise<Theme> {
  try {
    const stored = await AsyncStorage.getItem(KEY);
    _current = stored === 'dark' ? DARK : LIGHT;
  } catch {
    _current = LIGHT;
  }
  return _current;
}

export async function setTheme(mode: ThemeMode): Promise<void> {
  _current = mode === 'dark' ? DARK : LIGHT;
  await AsyncStorage.setItem(KEY, mode);
  _listeners.forEach(fn => fn(_current));
}

export function getTheme(): Theme { return _current; }

export function subscribeTheme(fn: (t: Theme) => void): () => void {
  _listeners.push(fn);
  return () => { _listeners = _listeners.filter(l => l !== fn); };
}

export function useTheme() {
  const [theme, setT] = React.useState<Theme>(getTheme());
  React.useEffect(() => subscribeTheme(setT), []);
  return theme;
}
