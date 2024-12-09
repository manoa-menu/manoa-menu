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

interface RecommendedItem {
  name: string;
  image: string;
  label: string[];
}

const DashboardPage = () => {
  const { data: session } = useSession();
  const userId = (session?.user as { id: number })?.id || null;
  const language: string = 'English';
  // Fetching data
  const [userFavoriteItems, setUserFavoriteItems] = useState<string[]>([]);
  const [latestMenu, setLatestMenu] = useState<MenuItem[]>([]);
  const [foodTable, setFoodTable] = useState<FoodTableEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Location filter
  const [selectedOption, setSelectedOption] = useState('All');

  // Weekly Items
  const gatewayCafeWeeklyItems: string[][] = [['1'], ['2'], ['3'], ['4'], ['5'], ['6'], ['7']];
  const haleAlohaWeeklyItems: string[][] = [['a'], ['b'], ['c'], ['d'], ['e'], ['f'], ['g']];
  // Recommended Items
  const gatewayCafeRecommendedItems: RecommendedItem[] = [];
  const haleAlohaRecommendedItems: RecommendedItem[] = [];

  const fetchData = async () => {
    try {
      const [favoriteResult, menuResult, foodTableResult] = await Promise.allSettled([
        fetch(`/api/userFavorites?userId=${userId}`),
        fetch(`/api/latestMenuCheck?language=${language}`), // Campus Center Food Court
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

  // Local storage
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

  // Weekly and Recommended
  const flattenedMenu = latestMenu.map((day) => [...day.grabAndGo, ...day.plateLunch]);
  const filteredMenu = flattenedMenu.map((day) => day.filter((item) => userFavoriteItems.includes(item)));
  const campusCenterWeeklyItems: string[][] = [[], ...filteredMenu, []];
  const campusCenterRecommendedItems: RecommendedItem[] = foodTable
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

  // Filter by location
  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedOption(event.target.value);
  };

  // Weekly Items
  const combinedWeeklyItems = () => {
    const combined = [];
    for (let i = 0; i < 7; i++) {
      combined.push([...campusCenterWeeklyItems[i], ...gatewayCafeWeeklyItems[i], ...haleAlohaWeeklyItems[i]]);
    }
    return combined;
  };

  const getFilteredWeeklyItems = () => {
    if (selectedOption === 'All') {
      return combinedWeeklyItems();
    }
    if (selectedOption === 'Campus Center Food Court') {
      return campusCenterWeeklyItems;
    }
    if (selectedOption === 'Gateway Café') {
      return gatewayCafeWeeklyItems;
    }
    if (selectedOption === 'Hale Aloha Café') {
      return haleAlohaWeeklyItems;
    }
    return [];
  };

  // Recommended Items
  const combinedRecommendedItems = () => {
    const combined: RecommendedItem[] = [];
    return combined.concat(campusCenterRecommendedItems, gatewayCafeRecommendedItems, haleAlohaRecommendedItems);
  };

  const getFilteredRecommendedItems = () => {
    if (selectedOption === 'All') {
      return combinedRecommendedItems();
    }
    if (selectedOption === 'Campus Center Food Court') {
      return campusCenterRecommendedItems;
    }
    if (selectedOption === 'Gateway Café') {
      return gatewayCafeRecommendedItems;
    }
    if (selectedOption === 'Hale Aloha Café') {
      return haleAlohaRecommendedItems;
    }
    return [];
  };

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
          <Form.Select className="d-flex ms-auto" style={{ width: '260px' }} onChange={handleSelectChange}>
            <option>All</option>
            <option>Campus Center Food Court</option>
            <option>Gateway Café</option>
            <option>Hale Aloha Café</option>
          </Form.Select>
        </Container>
      </Row>
      <Row className="py-2 mb-4">
        <Calendar
          weeklyItems={getFilteredWeeklyItems()}
          userFavoriteItems={userFavoriteItems}
          onToggle={handleToggle}
        />
      </Row>
      <Row className="pt-4 mt-4">
        <h1>Recommended:</h1>
      </Row>
      <Row className="mb-4">
        <FoodItemSlider
          foodItem={getFilteredRecommendedItems()}
          userFavoriteItems={userFavoriteItems}
          onToggle={handleToggle}
        />
      </Row>
    </Container>
  );
};

export default DashboardPage;
