'use client';

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from 'react';

export type MenuState = 'cc' | 'gw' | 'ha';

export const menuOptions: { name: MenuState; label: string; shortLabel: string }[] = [
  { name: 'cc', label: 'Campus Center', shortLabel: 'Campus Center' },
  { name: 'gw', label: 'Gateway Cafe', shortLabel: 'Gateway' },
  { name: 'ha', label: 'Hale Aloha Cafe', shortLabel: 'Hale Aloha' },
];

type MenuContextType = {
  menuState: MenuState;
  setMenuState: (menu: MenuState) => void;
};

const MenuContext = createContext<MenuContextType | undefined>(undefined);

export const MenuProvider = ({ children }: { children: ReactNode }) => {
  const [menuState, setMenuState] = useState<MenuState>('cc');

  return (
    <MenuContext.Provider value={{ menuState, setMenuState }}>
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
