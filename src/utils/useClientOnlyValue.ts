// src/utils/useClientOnlyValue.ts (Web optimization utility)
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

/**
 * Returns the second argument on the web and the first argument on native.
 * This is useful when you want to render different content on web vs native.
 */
export function useClientOnlyValue<T>(nativeValue: T, webValue: T): T {
  const [value, setValue] = useState(Platform.OS === 'web' ? webValue : nativeValue);

  useEffect(() => {
    if (Platform.OS === 'web') {
      setValue(webValue);
    }
  }, [webValue]);

  return value;
}


