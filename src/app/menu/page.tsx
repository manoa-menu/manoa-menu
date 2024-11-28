/* eslint-disable react/jsx-indent, @typescript-eslint/indent */

import '@/styles/Menu.css';

import getCheckCCMenu from '@/lib/menuActions';
import MenuList from '@/components/MenuList';
import { Container } from 'react-bootstrap';
import { DayMenu } from '@/types/menuTypes';

const Page = async () => {
  const parsedMenu: DayMenu[] = await getCheckCCMenu('Japanese', 'Japan');
  return (
    (parsedMenu !== null && parsedMenu !== undefined) ? (
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
