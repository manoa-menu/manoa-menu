/* eslint-disable react/jsx-indent, @typescript-eslint/indent */

import '@/styles/Menu.css';
import getCheckCCMenu from '@/lib/menuActions';
import MenuList from '@/components/MenuList';
import { Container } from 'react-bootstrap';
import { DayMenu } from '@/types/menuTypes';
import { getUserLanguage } from '@/lib/dbActions';
import LanguageDropdown from '@/components/LanguageDropdown';

const Page = async () => {
  const parsedMenu = await getCheckCCMenu('English', 'USA');
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
