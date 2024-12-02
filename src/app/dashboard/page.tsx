/* eslint-disable max-len */

'use client';

import { useEffect, useState } from 'react';
import { Container, Form, Row } from 'react-bootstrap';
import Calendar from '@/components/Calendar';
import FoodItemSlider from '@/components/FoodItemSlider';
import type { FoodItemType } from '@/components/FoodItemSlider';

interface MenuItem {
  grabAndGo: string[];
  plateLunch: string[];
}

const testFoodItem: FoodItemType[] = [
  {
    name: 'Chicken Sandwich',
    image:
      'https://www.simplyrecipes.com/thmb/eNeZK5vnEFJhq3fqk8HJhxltowg=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/Simply-Recipes-One-Pot-Mac-Cheese-LEAD-4-b54f2372ddcc49ab9ad09a193df66f20.jpg',
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
    image: 'https://www.billyparisi.com/wp-content/uploads/2020/03/loco-moco-3-1.jpg',
    label: ['Beef', 'Rice', 'Egg'],
  },
  {
    name: 'Loco Moco',
    image:
      'https://cdn.apartmenttherapy.info/image/upload/f_auto,q_auto:eco,c_fill,g_auto,w_1456,h_1092/k%2FPhoto%2FRecipes%2F2024-03-loco-moco%2Floco-moco-342',
    label: ['Beef', 'Rice', 'Egg'],
  },
  {
    name: 'Loco Moco',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Loco_Moco.jpg/500px-Loco_Moco.jpg',
    label: ['Beef', 'Rice', 'Egg'],
  },

  {
    name: 'Loco Moco',
    image: 'https://i0.wp.com/www.farmgirlgourmet.com/wp-content/uploads/2012/08/DSC_0367.jpg?w=2236&ssl=1',
    label: ['Beef', 'Rice', 'Egg'],
  },
];

const DashboardPage = () => {
  const userId: number = 1;
  const language: string = 'English';
  const [userFavoriteItems, setUserFavoriteItems] = useState<string[]>([]);
  const [latestMenu, setLatestMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch user's favorite food items
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
        setLoading(false);
      } catch (error) {
        console.error('Error fetching latest menu:', error);
        setLoading(false);
      }
    };
    fetchLatestMenu();
  }, [language]);
  // Render a loading state while fetching data
  if (loading) {
    return <Container className="loading">Loading...</Container>;
  }

  // Filter the latest menu based on the user's favorite items
  const flattenedMenu = latestMenu.map((day) => [...day.grabAndGo, ...day.plateLunch]);
  const filteredMenu = flattenedMenu.map((day) => day.filter((item) => userFavoriteItems.includes(item)));
  console.log(flattenedMenu);
  // REMINDER
  // For locations that aren't avaiable on the weekends, the logic will need to be adjusted
  // REMINDER
  const fullFilteredMenu: string[][] = [[], ...filteredMenu, []];

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
