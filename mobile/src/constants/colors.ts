export const colors = {
  background: {
    primary: '#0a0a0f',
    secondary: '#12121a',
    tertiary: '#1a1a2e',
  },
  neon: {
    pink: '#ff2d78',
    blue: '#00d4ff',
    purple: '#b44dff',
    green: '#00ff88',
    yellow: '#ffd700',
    red: '#ff4444',
  },
  text: {
    primary: '#ffffff',
    secondary: '#a0a0b0',
    muted: '#606070',
  },
  border: '#2a2a3e',
  overlay: 'rgba(0,0,0,0.7)',
} as const;

export type Colors = typeof colors;

export const neonShadow = (color: string) => ({
  shadowColor: color,
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.6,
  shadowRadius: 8,
  elevation: 8,
});

export const neonGlow = (color: string, intensity: number = 0.6) => ({
  shadowColor: color,
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: intensity,
  shadowRadius: 12,
  elevation: 10,
});
