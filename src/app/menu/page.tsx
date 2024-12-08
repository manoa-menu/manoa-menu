/* eslint-disable @typescript-eslint/no-unused-vars */

'use client';

import '@/styles/Menu.css';
import '@/styles/Scrollbar.css';

import CCMenuList from '@/components/CCMenuList';
import { Translate, TypeH1 } from 'react-bootstrap-icons';
import { FaUtensils } from 'react-icons/fa';

import { Container, Dropdown, DropdownButton } from 'react-bootstrap';
import { DayMenu, FilteredSodexoMeal, SdxAPIResponse } from '@/types/menuTypes';
import { useSession } from 'next-auth/react';
import { getUserLanguage } from '@/lib/dbActions';
import { useState, useEffect, useRef } from 'react';
import BlackSpinner from '@/components/BlackSpinner';
import { fixDayNames } from '@/lib/menuHelper';
import SdxMenu from '@/components/SdxMenu';
import { Box, Stack, Typography } from '@mui/material';

interface MenuNameArrProps {
  name: string;
  displayName: string;
}

const Page = () => {
  const languages = [
    { name: 'English', displayName: 'English' },
    { name: 'Japanese', displayName: '日本語' },
    { name: 'Korean', displayName: '한국어' },
    { name: 'Spanish', displayName: 'Español' },
  ];

  const getMenuNames = (language: string): MenuNameArrProps[] => {
    switch (language) {
      case 'English':
        return [
          { name: 'cc', displayName: 'Campus Center Food Court' },
          { name: 'gw', displayName: 'Gateway Cafe' },
          { name: 'ha', displayName: 'Hale Aloha Cafe' },
        ];
      case 'Japanese':
        return [
          { name: 'cc', displayName: 'キャンパスセンター' },
          { name: 'gw', displayName: 'ゲートウェイカフェ' },
          { name: 'ha', displayName: 'ハレアロハカフェ' },
        ];
      default:
        return [
          { name: 'cc', displayName: 'Campus Center Food Court' },
          { name: 'gw', displayName: 'Gateway Cafe' },
          { name: 'ha', displayName: 'Hale Aloha Cafe' },
        ];
    }
  };

  const displayLanguages = new Map<string, string>([
    ['English', 'English'],
    ['Japanese', '日本語'],
    ['Korean', '한국어'],
    ['Spanish', 'Español'],
  ]);

  const getDisplayMenuNames = (menuName: string, language: string): string => {
    switch (menuName) {
      case 'cc':
        if (language === 'English') {
          return 'Campus Center Food Court';
        }
        return 'キャンパスセンター';
      case 'gw':
        if (language === 'English') {
          return 'Gateway Cafe';
        }
        return 'ゲートウェイカフェ';
      case 'ha':
        if (language === 'English') {
          return 'Hale Aloha Cafe';
        }
        return 'ハレアロハカフェ';
      default:
        return '';
    }
  };

  const { data: session } = useSession();
  const userId = (session?.user as { id: number })?.id;

  const [menuState, setMenuState] = useState<string>('cc');

  const [ccMenu, setCCMenu] = useState<DayMenu[]>([]);
  const [gwMenu, setGWMenu] = useState<SdxAPIResponse[]>([]);
  const [haMenu, setHAMenu] = useState<SdxAPIResponse[]>([]);

  const [isCCLoading, setCCLoading] = useState(false);
  const [isGWLoading, setGWLoading] = useState(false);
  const [isHALoading, setHALoading] = useState(false);

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

    if (menuState === 'cc') {
      fetchMenu(menuState, language, setCCMenu, setCCLoading);
    } else if (menuState === 'gw') {
      fetchMenu('sdx', language, setGWMenu, setGWLoading, menuState);
    } else if (menuState === 'ha') {
      fetchMenu('sdx', language, setHAMenu, setHALoading, menuState);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, menuState]);

  const renderMenu = () => {
    switch (menuState) {
      case 'cc':
        return (ccMenu === undefined || ccMenu.length === 0)
          ? <h2>Menu Unavailable</h2>
          : <CCMenuList menu={ccMenu} language={language} userId={userId} />;
      case 'gw':
        return (gwMenu === undefined || gwMenu.length === 0)
          ? <h2>Menu Unavailable</h2>
          : <SdxMenu weekMenu={gwMenu} language={language} />;
      case 'ha':
        return (haMenu === undefined || haMenu.length === 0)
          ? <h2>Menu Unavailable</h2>
          : <SdxMenu weekMenu={haMenu} language={language} />;
      default:
        return null;
    }
  };

  return (
    <Container fluid className="my-4 menu-container" style={{ paddingTop: '120px' }}>
      <Stack
        spacing={2}
        sx={{
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Typography variant="h3" className="text-center">
          {getDisplayMenuNames(menuState, language)}
          {(language === 'English') ? ' Menu' : 'のメニュー'}
        </Typography>
        <Stack direction="row">
          <DropdownButton
            className="mx-2 p-1"
            ref={menuDropdownRef}
            id="dropdown-basic-button"
            title={(
              <span className="align-items-center">
                <FaUtensils className="" />
                {' '}
                {getDisplayMenuNames(menuState, language)}
              </span>
            )}
          >
            {getMenuNames(language).map((menuName) => (
              <Dropdown.Item
                key={menuName.name}
                onClick={() => menuNameItemClick(menuName.name)}
                disabled={menuName.name === 'Korean' || menuName.name === 'Spanish'}
              >
                {menuName.displayName}
              </Dropdown.Item>
            ))}
          </DropdownButton>
          <DropdownButton
            className="mx-2 p-1"
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
        </Stack>
      </Stack>

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
