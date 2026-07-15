'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
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

const menuListeners = new Set<() => void>();
const languageListeners = new Set<() => void>();

function subscribeMenu(listener: () => void) {
  menuListeners.add(listener);
  return () => {
    menuListeners.delete(listener);
  };
}

function subscribeLanguage(listener: () => void) {
  languageListeners.add(listener);
  return () => {
    languageListeners.delete(listener);
  };
}

function emitMenuChange() {
  menuListeners.forEach((listener) => listener());
}

function emitLanguageChange() {
  languageListeners.forEach((listener) => listener());
}

export const MenuProvider = ({ children }: { children: ReactNode }) => {
  const menuState = useSyncExternalStore(
    subscribeMenu,
    getStoredMenuState,
    (): MenuState => 'cc',
  );
  const language = useSyncExternalStore(
    subscribeLanguage,
    getStoredLanguage,
    () => 'English',
  );
  const preferencesReady = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const setMenuState = useCallback((menu: MenuState) => {
    localStorage.setItem(MENU_STORAGE_KEY, menu);
    emitMenuChange();
  }, []);

  const setLanguage = useCallback((lang: string) => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    emitLanguageChange();
  }, []);

  const value = useMemo(
    () => ({ menuState, setMenuState, language, setLanguage, preferencesReady }),
    [menuState, setMenuState, language, setLanguage, preferencesReady],
  );

  return (
    <MenuContext.Provider value={value}>
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
