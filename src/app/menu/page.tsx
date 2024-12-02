'use client';

import '@/styles/Menu.css';

import MenuList from '@/components/MenuList';
import { Translate } from 'react-bootstrap-icons';
import { Container, Dropdown, DropdownButton } from 'react-bootstrap';
import { DayMenu } from '@/types/menuTypes';
import { useSession } from 'next-auth/react';
import { getUserLanguage } from '@/lib/dbActions';
import { useState, useEffect, useRef } from 'react';

const getWeekdayDates = (language: string): string[] => {
  const weekdays = [];
  const today = new Date();
  const dayOfWeek = today.getDay();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - dayOfWeek + 1); // Monday

  for (let i = 0; i < 5; i++) {
    const weekday = new Date(startOfWeek);
    weekday.setDate(startOfWeek.getDate() + i);
    weekdays.push({ month: weekday.getMonth() + 1, day: weekday.getDate() });
  }
  let monthSymbol = '';
  let daySymbol = '';

  switch (language) {
    case 'Japanese':
      monthSymbol = '月';
      daySymbol = '日';
      break;
    case 'Korean':
      monthSymbol = '월';
      daySymbol = '일';
      break;
    case 'Spanish':
      monthSymbol = '/';
      daySymbol = '';
      break;
    default:
      monthSymbol = '/';
      daySymbol = '';
      break;
  }

  const weekdayDates = weekdays.map((day) => `${day.month}${monthSymbol}${day.day}${daySymbol}`);

  return weekdayDates;
};

const fixDayNames = (menu: DayMenu[], language: string) => {
  const weekdayDates = getWeekdayDates(language);

  const englishWeekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const japaneseWeekDays = ['月曜日', '火曜日', '水曜日', '木曜日', '金曜日'];
  const koreanWeekDays = ['월요일', '화요일', '수요일', '목요일', '금요일'];
  const spanishWeekDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

  if (language === 'English') {
    return menu.map((day: DayMenu, index: number) => ({
      ...day,
      name: `${englishWeekDays[index % 5]} (${weekdayDates[index % 5]})`,
    }));
  }
  if (language === 'Japanese') {
    return menu.map((day: DayMenu, index: number) => ({
      ...day,
      name: `${japaneseWeekDays[index % 5]} (${weekdayDates[index % 5]})`,
    }));
  }
  if (language === 'Korean') {
    return menu.map((day: DayMenu, index: number) => ({
      ...day,
      name: koreanWeekDays[index % 5],
    }));
  }
  if (language === 'Spanish') {
    return menu.map((day: DayMenu, index: number) => ({
      ...day,
      name: spanishWeekDays[index % 5],
    }));
  }
  return menu;
};

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
        const fixedMenu = fixDayNames(data, language);

        setMenu(fixedMenu);
        // console.log(`Menu: ${JSON.stringify(fixedMenu)}`);
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

        {(loading) ? (
          <div className="d-flex justify-content-center my-5">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : <MenuList menu={menu} language={language} />}
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
