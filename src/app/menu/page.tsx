/* eslint-disable react/jsx-indent, @typescript-eslint/indent */

import React from 'react';
import { Container } from 'react-bootstrap';
import '@/styles/Menu.css';

import parseCampusCenterMenu from '@/lib/menuParse';
import MenuList from '@/components/MenuList';

const Page = async () => {
  const menu = await parseCampusCenterMenu('menu2');

  return (
    <Container fluid className="my-5 menu-container">
      <h1>Menu</h1>
      <MenuList menu={menu} />
    </Container>
  );
};

export default Page;
