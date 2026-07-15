'use client';

import {
  createContext,
  useContext,
  useLayoutEffect,
  useState,
  type ReactNode,
} from 'react';

export type MenuState = 'cc' | 'gw' | 'ha';

export const menuOptions: { name: MenuState }[] = [
  { name: 'cc' },
  { name: 'gw' },
  { name: 'ha' },
];

export const languageOptions = [
  { name: 'English', displayName: 'English' },
  { name: 'Japanese', displayName: '日本語' },
  { name: 'Korean', displayName: '한국어' },
  { name: 'Chinese', displayName: '中文' },
] as const;

const LANGUAGE_STORAGE_KEY = 'manoa-menu-language';
const MENU_STORAGE_KEY = 'manoa-menu-location';

function getStoredLanguage(): string {
  if (typeof window === 'undefined') return 'English';
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (stored && languageOptions.some((lang) => lang.name === stored)) {
    return stored;
  }
  return 'English';
}

function getStoredMenuState(): MenuState {
  if (typeof window === 'undefined') return 'cc';
  const stored = localStorage.getItem(MENU_STORAGE_KEY);
  if (stored && menuOptions.some((menu) => menu.name === stored)) {
    return stored as MenuState;
  }
  return 'cc';
}

type MenuContextType = {
  menuState: MenuState;
  setMenuState: (menu: MenuState) => void;
  language: string;
  setLanguage: (language: string) => void;
  /** False until localStorage prefs are applied (avoids wrong-language flash). */
  preferencesReady: boolean;
};

const MenuContext = createContext<MenuContextType | undefined>(undefined);

export const MenuProvider = ({ children }: { children: ReactNode }) => {
  // Defaults match the server render; localStorage is applied before first paint.
  const [menuState, setMenuStateValue] = useState<MenuState>('cc');
  const [language, setLanguageState] = useState<string>('English');
  const [preferencesReady, setPreferencesReady] = useState(false);

  useLayoutEffect(() => {
    setMenuStateValue(getStoredMenuState());
    setLanguageState(getStoredLanguage());
    setPreferencesReady(true);
  }, []);

  const setMenuState = (menu: MenuState) => {
    setMenuStateValue(menu);
    localStorage.setItem(MENU_STORAGE_KEY, menu);
  };

  const setLanguage = (lang: string) => {
    setLanguageState(lang);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  };

  return (
    <MenuContext.Provider value={{
      menuState, setMenuState, language, setLanguage, preferencesReady,
    }}
    >
      {children}
    </MenuContext.Provider>
  );
};

export const useMenu = (): MenuContextType => {
  const context = useContext(MenuContext);
  if (!context) {
    throw new Error('useMenu must be used within a MenuProvider');
  }
  return context;
};
