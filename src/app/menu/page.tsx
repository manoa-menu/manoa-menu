/* eslint-disable react/jsx-indent, @typescript-eslint/indent */

import React from 'react';
import { Container } from 'react-bootstrap';

import parseCampusCenterMenu from '@/lib/menuParse';
import MenuList from '@/components/MenuList';

const Page = async () => {
  const menu = await parseCampusCenterMenu('menu');

  return (
    <Container className="my-5">
      <h1>Menu</h1>
      <MenuList menu={menu} />
    </Container>
  );
};

export default Page;
