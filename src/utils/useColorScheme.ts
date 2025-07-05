// src/utils/useColorScheme.ts (Enhanced color scheme hook)
import { useColorScheme as _useColorScheme } from 'react-native';

export function useColorScheme() {
  return _useColorScheme() ?? 'light';
}

