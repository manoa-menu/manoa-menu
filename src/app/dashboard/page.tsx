'use client';

import React, { useEffect, useState } from 'react';
import { Container, Row, Form } from 'react-bootstrap';
import { useSession } from 'next-auth/react';
import Calendar from '@/components/Calendar';
import FoodItemSlider from '@/components/FoodItemSlider';
import './dashboard.css';
import LoadingSpinner from '@/components/LoadingSpinner';

interface MenuItem {
  grabAndGo: string[];
  plateLunch: string[];
}

interface FoodTableEntry {
  id: number;
  name: string;
  url: string;
  label: string[];
  translation: string[];
}

function DashboardPage() {
  const { data: session } = useSession();
  const userId: number = (session?.user as { id: number })?.id;
  const language: string = 'English';
  const [userFavoriteItems, setUserFavoriteItems] = useState<string[]>([]);
  const [latestMenu, setLatestMenu] = useState<MenuItem[]>([]);
  const [foodTable, setFoodTable] = useState<FoodTableEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const cachedFavoriteItems = localStorage.getItem('favoriteItems');
        const cachedMenu = localStorage.getItem('latestMenu');
        const cachedFoodTable = localStorage.getItem('foodTable');

        if (cachedFavoriteItems && cachedMenu && cachedFoodTable) {
          setUserFavoriteItems(JSON.parse(cachedFavoriteItems));
          setLatestMenu(JSON.parse(cachedMenu));
          setFoodTable(JSON.parse(cachedFoodTable));
          setLoading(false);
          return;
        }

        const [favoriteResponse, menuResponse, foodTableResponse] = await Promise.allSettled([
          fetch(`/api/userFavorites?userId=${userId}`),
          fetch(`/api/latestMenuCheck?language=${language}`),
          fetch('/api/getFoodTable'),
        ]);

        if (favoriteResponse.status === 'fulfilled') {
          const favoriteData = await favoriteResponse.value.json();
          setUserFavoriteItems(favoriteData);
          localStorage.setItem('favoriteItems', JSON.stringify(favoriteData));
        } else {
          console.error('Failed to fetch user favorite items:', favoriteResponse.reason);
        }

        if (menuResponse.status === 'fulfilled') {
          const menuData = await menuResponse.value.json();
          setLatestMenu(menuData.menu);
          localStorage.setItem('latestMenu', JSON.stringify(menuData.menu));
        } else {
          console.error('Failed to fetch latest menu:', menuResponse.reason);
        }

        if (foodTableResponse.status === 'fulfilled') {
          const foodTableData = await foodTableResponse.value.json();
          setFoodTable(foodTableData);
          localStorage.setItem('foodTable', JSON.stringify(foodTableData));
        } else {
          console.error('Failed to fetch food table:', foodTableResponse.reason);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchData();
    }
  }, [userId, language]);

  const flattenedMenu = latestMenu.map((day) => [...day.grabAndGo, ...day.plateLunch]);

  // For Calendar component
  const filteredMenu = flattenedMenu.map((day) => day.filter((item) => userFavoriteItems.includes(item)));
  // REMINDER
  // For locations that aren't avaiable on the weekends, the logic will need to be adjusted
  // REMINDER
  const fullFilteredMenu: string[][] = [[], ...filteredMenu, []];

  // For Recommended FoodItemSlider
  const recommendedFoodItems = foodTable
    .map((entry) => ({
      name: entry.name,
      image: entry.url,
      label: entry.label,
    }))
    .filter(
      (entry) =>
        // eslint-disable-next-line implicit-arrow-linebreak
        flattenedMenu
          .flatMap((day) => day)
          .filter((item) => !userFavoriteItems.includes(item))
          .includes(entry.name),
      // eslint-disable-next-line function-paren-newline
    );

  // Render a loading state while fetching data
  if (loading) {
    return (
      <Container className="body-loading">
        <LoadingSpinner />
      </Container>
    );
  }

  return (
    <Container className="body">
      <Row className="my-4">
        <Container>
          <Form.Select className="d-flex ms-auto" style={{ width: '260px' }}>
            <option>All</option>
            <option>Campus Center Food Court</option>
            <option>Gateway Café</option>
            <option>Hale Aloha Café</option>
          </Form.Select>
        </Container>
      </Row>
      <Row className="py-2 mb-4">
        <Calendar weeklyItems={fullFilteredMenu} />
      </Row>
      <Row className="pt-4 mt-4">
        <h1>Recommended:</h1>
      </Row>
      <Row className="mb-4">
        <FoodItemSlider foodItem={recommendedFoodItems} />
      </Row>
    </Container>
  );
}

export default DashboardPage;
