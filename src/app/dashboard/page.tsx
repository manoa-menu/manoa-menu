'use client';

import { useEffect, useState } from 'react';
import { Container, Form, Row } from 'react-bootstrap';
import Calendar from '@/components/Calendar';
import FoodItemSlider from '@/components/FoodItemSlider';
import type { FoodItemType } from '@/components/FoodItemSlider';

const testFoodItem: FoodItemType[] = [
  {
    name: 'Chicken Sandwich',
    image: '/images/gettyimages-1442136071-612x612.jpg',
    label: ['Chicken', 'Bread'],
  },
  {
    name: 'Chicken Sandwich',
    image: '/images/gettyimages-1442136071-612x612.jpg',
    label: ['Chicken', 'Bread'],
  },
  {
    name: 'Chicken Sandwich',
    image: '/images/gettyimages-1442136071-612x612.jpg',
    label: ['Chicken', 'Bread'],
  },
  {
    name: 'Chicken Sandwich',
    image: '/images/gettyimages-1442136071-612x612.jpg',
    label: ['Chicken', 'Bread'],
  },
  {
    name: 'Loco Moco',
    image: '/images/gettyimages-1386914868-612x612.jpg',
    label: ['Beef', 'Rice', 'Egg'],
  },
  {
    name: 'Loco Moco',
    image: '/images/gettyimages-1386914868-612x612.jpg',
    label: ['Beef', 'Rice', 'Egg'],
  },
  {
    name: 'Loco Moco',
    image: '/images/gettyimages-1386914868-612x612.jpg',
    label: ['Beef', 'Rice', 'Egg'],
  },

  {
    name: 'Loco Moco',
    image: '/images/gettyimages-1386914868-612x612.jpg',
    label: ['Beef', 'Rice', 'Egg'],
  },
];

const DashboardPage = () => {
  const userId: number = 1;
  const language: string = 'English';
  const [userFavoriteItems, setUserFavoriteItems] = useState<string[]>([]);
  const [latestMenu, setLatestMenu] = useState<string[]>([]);

  useEffect(() => {
    const fetchFavoriteItems = async () => {
      try {
        const response = await fetch(`/api/userFavorites?userId=${userId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch user favorite items');
        }
        const data = await response.json();
        setUserFavoriteItems(data);
      } catch (error) {
        console.error('Error fetching favorite items:', error);
      }
    };
    fetchFavoriteItems();
  }, [userId]);

  useEffect(() => {
    const fetchLatestMenu = async () => {
      try {
        const response = await fetch(`/api/latestMenuCheck?language=${language}`);
        if (!response.ok) {
          throw new Error('Failed to fetch latest menu');
        }
        const data = await response.json();
        setLatestMenu(data);
      } catch (error) {
        console.error('Error fetching latest menu:', error);
      }
    };
    fetchLatestMenu();
  }, [language]);

  console.log(userFavoriteItems);
  console.log(latestMenu);

  const testString: string[][] = [userFavoriteItems, [], [], [], [], [], []];

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
        <Calendar weeklyItems={testString} />
      </Row>
      <Row>
        <h1>Recommended:</h1>
      </Row>
      <Row>
        <FoodItemSlider foodItem={testFoodItem} />
      </Row>
    </Container>
  );
};

export default DashboardPage;
