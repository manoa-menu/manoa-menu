/* eslint-disable @typescript-eslint/no-unused-vars */

'use client';

import '@/styles/Menu.css';

import CCMenuList from '@/components/CCMenuList';
import { Translate, TypeH1 } from 'react-bootstrap-icons';
import { FaUtensils } from 'react-icons/fa';

import { Container, Dropdown, DropdownButton } from 'react-bootstrap';
import { DayMenu, FilteredSodexoMeal } from '@/types/menuTypes';
import { useSession } from 'next-auth/react';
import { getUserLanguage } from '@/lib/dbActions';
import { useState, useEffect, useRef } from 'react';
import BlackSpinner from '@/components/BlackSpinner';
import fixDayNames from '@/lib/menuHelper';
import GatewayMenu from '@/components/GatewayMenu';

const Page = () => {
  const languages = [
    { name: 'English', displayName: 'English' },
    { name: 'Japanese', displayName: '日本語' },
    { name: 'Korean', displayName: '한국어' },
    { name: 'Spanish', displayName: 'Español' },
  ];

  const menuNames = [
    { name: 'cc', displayName: 'Campus Center Food Court' },
    { name: 'gw', displayName: 'Gateway Cafe' },
    { name: 'ha', displayName: 'Hale Aloha Cafe' },
  ];

  const displayLanguages = new Map<string, string>([
    ['English', 'English'],
    ['Japanese', '日本語'],
    ['Korean', '한국어'],
    ['Spanish', 'Español'],
  ]);

  const displayMenuNames = new Map<string, string>([
    ['cc', 'Campus Center Food Court'],
    ['gw', 'Gateway Cafe'],
    ['ha', 'Hale Aloha Cafe'],
  ]);

  const { data: session } = useSession();

  const [menuState, setMenuState] = useState<string>('cc');

  const [ccMenu, setCCMenu] = useState<DayMenu[]>([]);
  const [gwMenu, setGWMenu] = useState<FilteredSodexoMeal[]>([]);
  const [haMenu, setHAMenu] = useState<FilteredSodexoMeal[]>([]);

  const [isCCLoading, setCCLoading] = useState(true);
  const [isGWLoading, setGWLoading] = useState(true);
  const [isHALoading, setHALoading] = useState(true);

  const [language, setLanguage] = useState<string>('English');

  const langDropdownRef = useRef(null);
  const menuDropdownRef = useRef(null);

  const langItemClick = (lang: string) => {
    setLanguage(lang);
  };

  const menuNameItemClick = (menuName: string) => {
    setMenuState(menuName);
  };

  const isBroken = (menuArr: FilteredSodexoMeal[] | DayMenu[]): boolean => (
    (menuArr === null || menuArr === undefined || menuArr.length === 0)
  );

  useEffect(() => {
    if (session?.user?.email) {
      const fetchLanguage = async () => {
        if (session?.user?.email) {
          const userLanguage = await getUserLanguage(session.user.email);
          setLanguage(userLanguage);
          console.log(`User language: ${userLanguage}`);
        }
      };
      fetchLanguage();
    }
  }, [session]);

  useEffect(() => {

  }, [menuState]);

  useEffect(() => {
    const fetchMenu = async (
      menuType: string,
      lang: string,
      setMenu: React.Dispatch<React.SetStateAction<any>>,
      setLoading: React.Dispatch<React.SetStateAction<boolean>>,
      location?: string,
    ) => {
      try {
        const locationQuery = location ? `&location=${location}` : '';
        setLoading(true);
        const response = await fetch(`/api/${menuType}-menu?language=${lang}${locationQuery}`);
        if (!response.ok) {
          throw new Error(`Error: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        const fixedMenu = fixDayNames(data, lang);

        setMenu(fixedMenu);
      } catch (error) {
        console.error(`Failed to fetch ${menuType} menu:`, error);
      } finally {
        setLoading(false);
      }
    };

    fetchMenu('cc', language, setCCMenu, setCCLoading);
    fetchMenu('sdx', 'Japanese', setGWMenu, setGWLoading, 'gw');
    fetchMenu('sdx', 'Japanese', setGWMenu, setGWLoading, 'ha');

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  const renderMenu = () => {
    switch (menuState) {
      case 'cc':
        return (ccMenu === undefined || ccMenu.length === 0)
          ? <h2>Menu Unavailable</h2>
          : <CCMenuList menu={ccMenu} language={language} />;
      case 'gw':
        return (gwMenu === undefined || gwMenu. === 0);
      case 'ha':
        return <GatewayMenu menu={haMenu} language={language} />;
      default:
        return null;
    }
  };

  return (
    <Container fluid className="my-5 menu-container" style={{ paddingTop: '120px' }}>
      <div className="d-flex justify-content-center">
        <h1 className="text-center">Campus Center Menu</h1>
        <DropdownButton
          className="mx-3 p-1"
          ref={langDropdownRef}
          id="dropdown-basic-button"
          title={(
            <span className="align-items-center">
              <Translate className="me-1 mb-1" />
              {' '}
              {displayLanguages.get(language)}
            </span>
            )}
        >
          {languages.map((lang) => (
            <Dropdown.Item
              key={lang.name}
              onClick={() => langItemClick(lang.name)}
              disabled={lang.name === 'Korean' || lang.name === 'Spanish'}
            >
              {lang.displayName}
            </Dropdown.Item>
          ))}
        </DropdownButton>
        <DropdownButton
          className="mx-3 p-1"
          ref={menuDropdownRef}
          id="dropdown-basic-button"
          title={(
            <span className="align-items-center">
              <FaUtensils className="" />
              {' '}
              {displayMenuNames.get(menuState)}
            </span>
            )}
        >
          {menuNames.map((menuName) => (
            <Dropdown.Item
              key={menuName.name}
              onClick={() => menuNameItemClick(menuName.name)}
              disabled={menuName.name === 'Korean' || menuName.name === 'Spanish'}
            >
              {menuName.displayName}
            </Dropdown.Item>
          ))}
        </DropdownButton>
      </div>

      <div className="d-flex flex-column">
        {(isCCLoading || isGWLoading || isHALoading) ? (
          <BlackSpinner />
        ) : (
          <div className="m-2">
            {renderMenu()}
          </div>
        )}
      </div>

    </Container>
  );
};

export default Page;
