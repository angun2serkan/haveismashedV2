import Constants from 'expo-constants';

export const API_URL = Constants.expoConfig?.extra?.apiUrl ?? 'http://localhost:3000/api';

export const APP_ENV = (() => {
  const variant = Constants.expoConfig?.extra?.appVariant;
  if (variant === 'production') return 'production' as const;
  if (variant === 'preview') return 'staging' as const;
  return 'development' as const;
})();

export const IS_DEV = APP_ENV === 'development';
export const IS_PROD = APP_ENV === 'production';
