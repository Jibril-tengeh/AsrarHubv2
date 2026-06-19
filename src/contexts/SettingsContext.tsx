import React, { createContext, useContext, useState, useEffect } from 'react';

export type Theme = {
  id: string;
  name: string;
  bgHex: string;
  textHex: string;
  isDark: boolean;
};

const THEMES: Theme[] = [
  { id: 'light', name: 'Light', bgHex: '#ffffff', textHex: '#171717', isDark: false },
  { id: 'dark', name: 'Dark', bgHex: '#171717', textHex: '#f5f5f5', isDark: true },
  { id: 'sepia', name: 'Sepia', bgHex: '#F4ECD8', textHex: '#433422', isDark: false },
  { id: 'solarized-light', name: 'Solarized Light', bgHex: '#fdf6e3', textHex: '#657b83', isDark: false },
  { id: 'github-light', name: 'GitHub Light', bgHex: '#ffffff', textHex: '#24292e', isDark: false },
];

const COLORS = [
  { name: 'Red', val: 'red', light: '#fef2f2' },
  { name: 'Blue', val: 'blue', light: '#eff6ff' },
  { name: 'Green', val: 'green', light: '#f0fdf4' },
  { name: 'Yellow', val: 'yellow', light: '#fefce8' },
  { name: 'Purple', val: 'purple', light: '#faf5ff' },
  { name: 'Pink', val: 'pink', light: '#fdf2f8' },
  { name: 'Indigo', val: 'indigo', light: '#eef2ff' },
  { name: 'Teal', val: 'teal', light: '#f0fdfa' }
];

let themeCount = THEMES.length;
for (const color of COLORS) {
  THEMES.push({ id: `${color.val}-light`, name: `${color.name} tinted Light`, bgHex: color.light, textHex: '#171717', isDark: false });
}

for(let i = 13; i <= 24; i++) {
   const val = Math.floor((i / 24) * 255);
   const hex = val.toString(16).padStart(2, '0');
   THEMES.push({ id: `gray-${i}`, name: `Gray Tone ${i}`, bgHex: `#${hex}${hex}${hex}`, textHex: '#000000', isDark: false });
}

type SettingsContextType = {
  theme: Theme;
  setThemeId: (id: string) => void;
  themes: Theme[];
  textSize: number;
  setTextSize: (size: number) => void;
  arabicTextSize: number;
  setArabicTextSize: (size: number) => void;
  language: 'fr' | 'en';
  setLanguage: (lang: 'fr' | 'en') => void;
  dailyAlertTime: string | null;
  setDailyAlertTime: (time: string | null) => void;
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeId] = useState(() => localStorage.getItem('themeId') || 'light');
  const [textSize, setTextSize] = useState(() => Number(localStorage.getItem('textSize')) || 16);
  const [arabicTextSize, setArabicTextSize] = useState(() => Number(localStorage.getItem('arabicTextSize')) || 24);
  const [language, setLanguage] = useState<'fr' | 'en'>(() => {
    const saved = localStorage.getItem('language');
    // migrate 'ar' to 'en' if it was saved
    if (saved === 'ar') return 'en';
    return (saved as 'fr' | 'en') || 'fr';
  });
  const [dailyAlertTime, setDailyAlertTime] = useState<string | null>(() => localStorage.getItem('dailyAlertTime'));

  useEffect(() => {
    localStorage.setItem('themeId', themeId);
  }, [themeId]);

  useEffect(() => {
    localStorage.setItem('textSize', textSize.toString());
  }, [textSize]);

  useEffect(() => {
    localStorage.setItem('arabicTextSize', arabicTextSize.toString());
  }, [arabicTextSize]);

  useEffect(() => {
    localStorage.setItem('language', language);
    document.documentElement.dir = 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    if (dailyAlertTime) {
      localStorage.setItem('dailyAlertTime', dailyAlertTime);
    } else {
      localStorage.removeItem('dailyAlertTime');
    }
  }, [dailyAlertTime]);

  useEffect(() => {
    const theme = THEMES.find(t => t.id === themeId) || THEMES[0];
    
    if (themeId === 'dark' || (themeId !== 'light' && theme.isDark)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    document.documentElement.style.setProperty('--theme-bg', theme.bgHex);
    document.documentElement.style.setProperty('--theme-text', theme.textHex);
  }, [themeId]);

  useEffect(() => {
    document.documentElement.style.setProperty('--base-text-size', `${textSize}px`);
  }, [textSize]);

  useEffect(() => {
    document.documentElement.style.setProperty('--arabic-text-size', `${arabicTextSize}px`);
  }, [arabicTextSize]);

  const theme = THEMES.find(t => t.id === themeId) || THEMES[0];

  return (
    <SettingsContext.Provider value={{ theme, setThemeId, themes: THEMES, textSize, setTextSize, arabicTextSize, setArabicTextSize, language, setLanguage, dailyAlertTime, setDailyAlertTime }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
