/* eslint-disable max-len */

'use client';

import { useEffect, useState } from 'react';
import { Container, Form, Row } from 'react-bootstrap';
import Calendar from '@/components/Calendar';
import FoodItemSlider from '@/components/FoodItemSlider';

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

const DashboardPage = () => {
  // const userId: number = 1;
  const language: string = 'English';
  const [userFavoriteItems] = useState<string[]>([]);
  const [latestMenu, setLatestMenu] = useState<MenuItem[]>([]);
  const [foodTable, setFoodTable] = useState<FoodTableEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch user's favorite food items
  // useEffect(() => {
  //   const fetchFavoriteItems = async () => {
  //     try {
  //       const response = await fetch(`/api/userFavorites?userId=${userId}`);
  //       if (!response.ok) {
  //         throw new Error('Failed to fetch user favorite items');
  //       }
  //       const data = await response.json();
  //       setUserFavoriteItems(data);
  //     } catch (error) {
  //       console.error('Error fetching favorite items:', error);
  //     }
  //   };
  //   fetchFavoriteItems();
  // }, [userId]);

  // Fetch the latest menu for comparison
  useEffect(() => {
    const fetchLatestMenu = async () => {
      try {
        const response = await fetch(`/api/latestMenuCheck?language=${language}`);
        if (!response.ok) {
          throw new Error('Failed to fetch latest menu');
        }
        const data = await response.json();
        setLatestMenu(data.menu);
      } catch (error) {
        console.error('Error fetching latest menu:', error);
        setLoading(false);
      }
    };
    fetchLatestMenu();
  }, [language]);

  // Fetch the entire food table
  useEffect(() => {
    const fetchFoodTable = async () => {
      try {
        const response = await fetch('/api/getFoodTable');
        if (!response.ok) {
          throw new Error('Failed to fetch food table');
        }
        const data = await response.json();
        setFoodTable(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching food table:', error);
      }
    };
    fetchFoodTable();
  }, []);

  // Render a loading state while fetching data
  if (loading) {
    return <Container className="loading">Loading...</Container>;
  }

  // For Calendar component
  const flattenedMenu = latestMenu.map((day) => [...day.grabAndGo, ...day.plateLunch]);
  // const filteredMenu = flattenedMenu.map((day) => day.filter((item) => userFavoriteItems.includes(item)));
  // REMINDER
  // For locations that aren't avaiable on the weekends, the logic will need to be adjusted
  // REMINDER
  // const fullFilteredMenu: string[][] = [[], ...filteredMenu, []];

  // For Recommended FoodItemSlider
  const nonFavoriteMenu = flattenedMenu.flatMap((day) => day.filter((item) => !userFavoriteItems.includes(item)));
  const combinedFoodTable = foodTable.map((entry) => ({
    name: entry.name,
    image: entry.url,
    label: entry.label,
  }));

  const recommendedFoodItems = combinedFoodTable.filter((entry) => nonFavoriteMenu.includes(entry.name));

  const fullFilteredMenu: string[][] = [[], ...flattenedMenu, []];
  return (
    <Container>
      <Row className="mt-4">
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
      <Row className="mt-4">
        <h1>Recommended:</h1>
      </Row>
      <Row className="mb-4">
        <FoodItemSlider foodItem={recommendedFoodItems} />
      </Row>
    </Container>
  );
};

export default DashboardPage;
