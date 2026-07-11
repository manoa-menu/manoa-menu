'use client';

import {
  createContext,
  useContext,
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

type MenuContextType = {
  menuState: MenuState;
  setMenuState: (menu: MenuState) => void;
  language: string;
  setLanguage: (language: string) => void;
};

const MenuContext = createContext<MenuContextType | undefined>(undefined);

export const MenuProvider = ({ children }: { children: ReactNode }) => {
  const [menuState, setMenuState] = useState<MenuState>('cc');
  const [language, setLanguage] = useState<string>('English');

  return (
    <MenuContext.Provider value={{
      menuState, setMenuState, language, setLanguage,
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
