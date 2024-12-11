/* eslint-disable @typescript-eslint/no-unused-vars */

'use client';

import '@/styles/Menu.css';
import '@/styles/Scrollbar.css';

import CCMenuList from '@/components/CCMenuList';
import { Translate } from 'react-bootstrap-icons';
import { FaUtensils } from 'react-icons/fa';

import { Container, Dropdown, DropdownButton } from 'react-bootstrap';
import { DayMenu, SdxAPIResponse } from '@/types/menuTypes';
import { useSession } from 'next-auth/react';
import { getUserLanguage } from '@/lib/dbActions';
import { useState, useEffect, useRef } from 'react';
import BlackSpinner from '@/components/BlackSpinner';
import { fixDayNames } from '@/lib/menuHelper';
import SdxMenu from '@/components/SdxMenu';
import { Stack, Typography, useMediaQuery, useTheme } from '@mui/material';

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

  const [userId, setUserId] = useState<number>(-21);

  const [favArr, setFavArr] = useState<string[]>([]);

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

  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));
  const isSmUp = useMediaQuery(theme.breakpoints.up('sm'));
  const isXsUp = useMediaQuery(theme.breakpoints.up('xs'));

  let typographyVariant: 'h3' | 'h4' | 'h5' = 'h3';
  if (isMdUp) {
    typographyVariant = 'h3';
  } else if (isSmUp) {
    typographyVariant = 'h3';
  } else if (isXsUp) {
    typographyVariant = 'h4';
  }

  const isXs = useMediaQuery(theme.breakpoints.only('xs'));

  const containerStyle = () => {
    if (isXs) {
      return { marginLeft: '0%', marginRight: '0%', paddingTop: '110px' };
    } if (isSmUp) {
      return { paddingTop: '110px' };
    }
    return { paddingTop: '110px' };
  };

  const langItemClick = (lang: string) => {
    setLanguage(lang);
  };

  const menuNameItemClick = (menuName: string) => {
    setMenuState(menuName);
  };

  useEffect(() => {
    const fetchData = async () => {
      if (session?.user?.email) {
        const userLanguage = await getUserLanguage(session.user.email);
        setUserId((session?.user as { id: number })?.id);
        setLanguage(userLanguage);
        console.log(`User language: ${userLanguage}`);
      }
    };
    fetchData();
  }, [session]);

  useEffect(() => {
    const fetchFav = async () => {
      const response = await fetch(`/api/userFavorites?userId=${userId}`);
      const data = await response.json() || [];
      setFavArr(data);
    };
    fetchFav();
  }, [userId]);

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
          ? <h2 className="text-center">Menu Unavailable</h2>
          : <CCMenuList menu={ccMenu} language={language} userId={userId} favArr={favArr} />;
      case 'gw':
        return (gwMenu === undefined || gwMenu.length === 0)
          ? <h2 className="text-center">Menu Unavailable</h2>
          : <SdxMenu weekMenu={gwMenu} language={language} favArr={favArr} userId={userId} />;
      case 'ha':
        return (haMenu === undefined || haMenu.length === 0)
          ? <h2 className="text-center">Menu Unavailable</h2>
          : <SdxMenu weekMenu={haMenu} language={language} favArr={favArr} userId={userId} />;
      default:
        return null;
    }
  };

  return (
    <Container
      fluid
      className="my-4 menu-container"
      style={containerStyle()}
    >
      <Stack
        spacing={2}
        sx={{
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Typography variant={typographyVariant} className="text-center">
          {getDisplayMenuNames(menuState, language)}
          {(language === 'English') ? ' Menu' : 'のメニュー'}
        </Typography>
        <Stack
          direction="row"
          sx={{ justifyContent: 'center',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
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
