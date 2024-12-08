/* eslint-disable @typescript-eslint/no-unused-vars */

'use client';

import '@/styles/Menu.css';

import CCMenuList from '@/components/CCMenuList';
import { Translate } from 'react-bootstrap-icons';
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

  const displayLanguages = new Map<string, string>([
    ['English', 'English'],
    ['Japanese', '日本語'],
    ['Korean', '한국어'],
    ['Spanish', 'Español'],
  ]);

  const { data: session } = useSession();

  const [ccMenu, setCCMenu] = useState<DayMenu[]>([]);
  const [gwMenu, setGWMenu] = useState<FilteredSodexoMeal[]>([]);
  const [haMenu, setHAMenu] = useState<FilteredSodexoMeal[]>([]);

  const [isCCLoading, setCCLoading] = useState(true);
  const [isGWLoading, setGWLoading] = useState(true);
  const [isHALoading, setHALoading] = useState(true);

  const [language, setLanguage] = useState<string>('English');
  const dropdownRef = useRef(null);
  const langItemClick = (lang: string) => {
    setLanguage(lang);
  };

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
    // fetchMenu('sdx', 'Japanese', setGWMenu, setGWLoading, 'gw');
    // fetchMenu('sdx', 'Japanese', setGWMenu, setGWLoading, 'ha');

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);
  return (
    ccMenu !== null && ccMenu !== undefined ? (
      <Container fluid className="my-5 menu-container" style={{ paddingTop: '120px' }}>
        <div className="d-flex justify-content-center">
          <h1 className="text-center">Campus Center Menu</h1>
          <DropdownButton
            className="mx-3 p-1"
            ref={dropdownRef}
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
        </div>

        <div className="d-flex flex-column">
          {(isCCLoading) ? (
            <BlackSpinner />
          ) : (
            <div className="m-2">
              <CCMenuList menu={ccMenu} language={language} />
            </div>
          )}
          {/* {(isGWLoading) ? (
            <BlackSpinner />
          ) : (
            <div className="m-2">
              <GatewayMenu menu={gwMenu} language={language} />
            </div>
          )} */}

        </div>

      </Container>
    ) : (
      <Container fluid className="my-5 menu-container">
        <div className="justify-content-center">
          <h1 className="text-center">Campus Center Menu</h1>
          <DropdownButton
            className="mx-3 p-1"
            ref={dropdownRef}
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
        </div>

        {(isCCLoading)
          ? (
            <div className="d-flex justify-content-center my-5">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : <h4>Menu not available</h4>}
      </Container>
    )
  );
};

export default Page;
