/* eslint-disable react/jsx-indent, @typescript-eslint/indent */

'use client';

import React from 'react';
import { Container } from 'react-bootstrap';

import MenuList from '@/components/MenuList';

const Page = () => {
  const [menu, setMenu] = React.useState([]);

  const fetchMenu = async () => {
    try {
      const response = await fetch('/api/parseCampusCenterMenu?fileName=menu.pdf');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      setMenu(data);
    } catch (error) {
      console.error('Error fetching menu:', error);
    }
  };

  React.useEffect(() => {
    fetchMenu();
  }, []);

  return (
    <Container className="my-5">
      <h1>Menu</h1>
      <MenuList menu={menu} />
    </Container>
  );
};

export default Page;
