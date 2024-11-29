/* eslint-disable react/jsx-indent, @typescript-eslint/indent */

'use client';

import { useEffect, useState } from 'react';
import '@/styles/Menu.css';
import getCheckCCMenu from '@/lib/menuActions';
import MenuList from '@/components/MenuList';
import { Container } from 'react-bootstrap';
import { DayMenu } from '@/types/menuTypes';
import { getUserLanguage } from '@/lib/dbActions';
import LanguageDropdown from '@/components/LanguageDropdown';

const Page = () => {
  const { data: session } = useSession();
  const [parsedMenu, setParsedMenu] = useState<DayMenu[] | null>(null);
  const [language, setLanguage] = useState<string>('English');

  useEffect(() => {
    if (session?.user?.email) {
      const fetchLanguage = async () => {
        const userLanguage = await getUserLanguage(session.user.email);
        setLanguage(userLanguage);
      };
      fetchLanguage();
    }
  }, [session]);

  useEffect(() => {
    const fetchMenu = async () => {
      const menu = await getCheckCCMenu(language, 'Japan');
      setParsedMenu(menu);
    };

    fetchMenu();
  }, [language]);

  return (
    parsedMenu !== null && parsedMenu !== undefined ? (
      <Container fluid className="my-5 menu-container">
        <h1>Menu</h1>
        <MenuList menu={parsedMenu} />
      </Container>
    ) : (
      <Container fluid className="my-5 menu-container">
        <h1>Menu</h1>
        <p>Menu not available</p>
      </Container>
    )
  );
};

export default Page;
