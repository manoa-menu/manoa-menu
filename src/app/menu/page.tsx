'use client';

import '@/styles/Menu.css';

import MenuList from '@/components/MenuList';
import { Container, Dropdown, DropdownButton } from 'react-bootstrap';
import { DayMenu } from '@/types/menuTypes';
import { useSession } from 'next-auth/react';
import { getUserLanguage } from '@/lib/dbActions';
import { useState, useEffect, useRef } from 'react';

const Page = () => {
  const languages = [
    { name: 'English', code: 'en' },
    { name: 'Japanese', code: 'jp' },
    { name: 'Korean', code: 'kr' },
    { name: 'Spanish', code: 'es' },
  ];
  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  const { data: session } = useSession();
  const [menu, setMenu] = useState<DayMenu[]>([]);
  const [loading, setLoading] = useState(true);
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
    const fetchMenu = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/menu?language=${language}`);
        if (!response.ok) {
          throw new Error(`Error: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        const fixedMenu = (language === 'English') ? data.map((day: DayMenu, index: number) => ({
          name: weekDays[index % 5],
          grabAndGo: day.grabAndGo,
          plateLunch: day.plateLunch,
          specialMessage: day.specialMessage,
        })) : data;

        setMenu(fixedMenu);
        console.log(`Menu: ${JSON.stringify(fixedMenu)}`);
      } catch (error) {
        console.error('Failed to fetch menu:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);
  return (
    menu !== null && menu !== undefined ? (
      <Container fluid className="my-5 menu-container" style={{ paddingTop: '120px' }}>
        <div className="d-flex justify-content-center">
          <h1 className="text-center">Campus Center Menu</h1>
          <DropdownButton className="mx-3 p-1" ref={dropdownRef} id="dropdown-basic-button" title={language}>
            {languages.map((lang) => (
              <Dropdown.Item
                key={lang.name}
                onClick={() => langItemClick(lang.name)}
                disabled={lang.name === 'Korean' || lang.name === 'Spanish'}
              >
                {lang.name}
              </Dropdown.Item>
            ))}
          </DropdownButton>
        </div>

        {(loading) ? (
          <div className="d-flex justify-content-center my-5">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : <MenuList menu={menu} />}
      </Container>
    ) : (
      <Container fluid className="my-5 menu-container">
        <div className="justify-content-center">
          <h1 className="text-center">Campus Center Menu</h1>
          <DropdownButton className="mx-3 p-1" ref={dropdownRef} id="dropdown-basic-button" title={language}>
            {languages.map((lang) => (
              <Dropdown.Item
                key={lang.name}
                onClick={() => langItemClick(lang.name)}
                disabled={lang.name === 'Korean' || lang.name === 'Spanish'}
              >
                {lang.name}
              </Dropdown.Item>
            ))}
          </DropdownButton>
        </div>

        {(loading)
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
