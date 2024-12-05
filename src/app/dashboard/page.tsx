'use client';

import React, { useEffect, useState } from 'react';
import { Container, Row, Form } from 'react-bootstrap';
import { useSession } from 'next-auth/react';
import Calendar from '@/components/Calendar';
import FoodItemSlider from '@/components/FoodItemSlider';
import LoadingSpinner from '@/components/LoadingSpinner';
import './dashboard.css';

/* eslint-disable function-paren-newline */
/* eslint-disable implicit-arrow-linebreak */

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
  const userId = (session?.user as { id: number })?.id || null;
  const language: string = 'English';
  const [userFavoriteItems, setUserFavoriteItems] = useState<string[]>([]);
  const [latestMenu, setLatestMenu] = useState<MenuItem[]>([]);
  const [foodTable, setFoodTable] = useState<FoodTableEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchData = async () => {
    try {
      const [favoriteResult, menuResult, foodTableResult] = await Promise.allSettled([
        fetch(`/api/userFavorites?userId=${userId}`),
        fetch(`/api/latestMenuCheck?language=${language}`),
        fetch('/api/getFoodTable'),
      ]);

      if (favoriteResult.status === 'fulfilled' && favoriteResult.value.ok) {
        const favoriteData = await favoriteResult.value.json();
        localStorage.setItem('userFavoriteItems', JSON.stringify(favoriteData));
        setUserFavoriteItems(favoriteData);
      } else {
        console.error('Failed to fetch user favorite items');
      }

      if (menuResult.status === 'fulfilled' && menuResult.value.ok) {
        const menuData = await menuResult.value.json();
        localStorage.setItem('latestMenu', JSON.stringify(menuData.menu));
        setLatestMenu(menuData.menu);
      } else {
        console.error('Failed to fetch latest menu');
      }

      if (foodTableResult.status === 'fulfilled' && foodTableResult.value.ok) {
        const foodTableData = await foodTableResult.value.json();
        localStorage.setItem('foodTable', JSON.stringify(foodTableData));
        setFoodTable(foodTableData);
      } else {
        console.error('Failed to fetch food table');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const storedUserFavoriteItems = localStorage.getItem('userFavoriteItems');
    const storedLatestMenu = localStorage.getItem('latestMenu');
    const storedFoodTable = localStorage.getItem('foodTable');

    if (storedUserFavoriteItems && storedLatestMenu && storedFoodTable) {
      setUserFavoriteItems(JSON.parse(storedUserFavoriteItems));
      setLatestMenu(JSON.parse(storedLatestMenu));
      setFoodTable(JSON.parse(storedFoodTable));
      setLoading(false);
    } else {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, language]);

  const handleToggle = async (item: string) => {
    setUserFavoriteItems((prevStarredItems) => {
      if (prevStarredItems.includes(item)) {
        return prevStarredItems.filter((starredItem) => starredItem !== item);
      }
      return [...prevStarredItems, item];
    });
    await fetchData();
  };

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
    .filter((entry) =>
      flattenedMenu
        .flatMap((day) => day)
        .filter((item) => !userFavoriteItems.includes(item))
        .includes(entry.name),
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
        <Calendar weeklyItems={fullFilteredMenu} userFavoriteItems={userFavoriteItems} onToggle={handleToggle} />
      </Row>
      <Row className="pt-4 mt-4">
        <h1>Recommended:</h1>
      </Row>
      <Row className="mb-4">
        <FoodItemSlider foodItem={recommendedFoodItems} userFavoriteItems={userFavoriteItems} onToggle={handleToggle} />
      </Row>
    </Container>
  );
}

export default DashboardPage;
