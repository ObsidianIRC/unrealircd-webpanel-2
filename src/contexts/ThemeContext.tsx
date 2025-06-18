import type React from 'react';
import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light';

export type AccentColor = 'default' | 'green' | 'purple' | 'orange' | 'red' | 'pink';

interface ThemeContextType {
  theme: Theme;
  accentColor: AccentColor;
  setTheme: (theme: Theme) => void;
  setAccentColor: (color: AccentColor) => void;
  toggleTheme: () => void;
  updateKey: number;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Accent color definitions with HSL values for better theming
const accentColors: Record<AccentColor, { hue: number; saturation: number }> = {
  default: { hue: 218, saturation: 83 }, // Beautiful #4b86ee blue (this IS the blue option)
  green: { hue: 142, saturation: 71 },
  purple: { hue: 262, saturation: 83 },
  orange: { hue: 25, saturation: 95 },
  red: { hue: 0, saturation: 84 },
  pink: { hue: 330, saturation: 81 },
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem('theme');
    if (stored === 'dark' || stored === 'light') {
      return stored;
    }
    return 'dark'; // Default to dark mode for IRC night nerds 🌙
  });

  const [accentColor, setAccentColor] = useState<AccentColor>(() => {
    const stored = localStorage.getItem('accentColor');
    if (stored && stored in accentColors) {
      return stored as AccentColor;
    }
    return 'default';
  });

  const [updateKey, setUpdateKey] = useState(0);

  useEffect(() => {
    const root = window.document.documentElement;

    // Remove existing theme classes
    root.classList.remove('light', 'dark');
    root.classList.add(theme);

    // Apply accent color custom properties with dark mode adjustments
    const { hue, saturation } = accentColors[accentColor];

    // Adjust lightness for certain colors in dark mode
    let lightness = 50;
    if (theme === 'dark') {
      // Make pink, purple, and red lighter in dark mode for better visibility
      if (accentColor === 'pink') lightness = 65;
      else if (accentColor === 'purple') lightness = 65;
      else if (accentColor === 'red') lightness = 60;
      else lightness = 50;
    }

    root.style.setProperty('--primary-hue', hue.toString());
    root.style.setProperty('--primary-saturation', `${saturation}%`);
    root.style.setProperty('--primary-lightness', `${lightness}%`);

    // Update primary and ring colors with the adjusted lightness
    root.style.setProperty('--primary', `${hue} ${saturation}% ${lightness}%`);
    root.style.setProperty('--ring', `${hue} ${saturation}% ${lightness}%`);

    // Store preferences
    localStorage.setItem('theme', theme);
    localStorage.setItem('accentColor', accentColor);

    // Force component updates for dynamic color changes
    setUpdateKey(prev => prev + 1);
  }, [theme, accentColor]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider value={{ theme, accentColor, setTheme, setAccentColor, toggleTheme, updateKey }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
