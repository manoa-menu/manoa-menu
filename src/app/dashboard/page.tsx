'use client';

import React, { useEffect, useState } from 'react';
import { Container, Row, Form } from 'react-bootstrap';
import { useSession } from 'next-auth/react';
import Calendar from '@/components/Calendar';
import FoodItemSlider from '@/components/FoodItemSlider';
import './dashboard.css';

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
        const [favoriteResponse, menuResponse, foodTableResponse] = await Promise.all([
          fetch(`/api/userFavorites?userId=${userId}`),
          fetch(`/api/latestMenuCheck?language=${language}`),
          fetch('/api/getFoodTable'),
        ]);

        if (!favoriteResponse.ok) {
          throw new Error('Failed to fetch user favorite items');
        }
        if (!menuResponse.ok) {
          throw new Error('Failed to fetch latest menu');
        }
        if (!foodTableResponse.ok) {
          throw new Error('Failed to fetch food table');
        }

        const favoriteData = await favoriteResponse.json();
        const menuData = await menuResponse.json();
        const foodTableData = await foodTableResponse.json();

        setUserFavoriteItems(favoriteData);
        setLatestMenu(menuData.menu);
        setFoodTable(foodTableData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, language]);

  // Render a loading state while fetching data
  if (loading) {
    return <Container className="loading">Loading...</Container>;
  }

  // For Calendar component
  const flattenedMenu = latestMenu.map((day) => [...day.grabAndGo, ...day.plateLunch]);
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

  // const fullFilteredMenu: string[][] = [[], ...flattenedMenu, []];
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
