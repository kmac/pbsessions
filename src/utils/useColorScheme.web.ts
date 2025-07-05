// src/utils/useColorScheme.web.ts (Web-specific implementation)
import { useColorScheme as _useColorScheme } from 'react-native';

export function useColorScheme() {
  return _useColorScheme() ?? 'light';
}


