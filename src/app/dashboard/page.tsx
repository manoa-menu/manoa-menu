'use client';

import React, { useEffect, useState, useMemo } from 'react';
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

interface SdxMenuItem {
  meal: string;
  formalName: string;
  [key: string]: any;
}

interface SdxSubGroup {
  items: SdxMenuItem[];
}
interface SdxGroup {
  groups: SdxSubGroup[];
}
interface DayMenu {
  menu: SdxGroup[];
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

export const SdxFilter = [
  'White Rice',
  'Brown Rice',
  'Sour Cream',
  'Steamed White Rice',
  'Steamed Brown Rice',
  "Lay's Potato Chips",
];

// Ensure arrays are not null or undefined
const safeArray = (arr: any[]) => arr || [];

const DashboardPage = () => {
  const { data: session } = useSession();
  const userId = (session?.user as { id: number })?.id || null;
  const language: string = 'English';

  // Fetching data
  const [userFavoriteItems, setUserFavoriteItems] = useState<string[]>([]);
  const [latestMenu, setLatestMenu] = useState<MenuItem[]>([]);
  const [gatewayMenu, setGatewayMenu] = useState<DayMenu[]>([]);
  const [alohaMenu, setAlohaMenu] = useState<DayMenu[]>([]);
  const [foodTable, setFoodTable] = useState<FoodTableEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Location filter
  const [selectedOption, setSelectedOption] = useState('All');
  const [secondaryOptions, setSecondaryOptions] = useState<string[]>([]);
  const [selectedSecondaryOption, setSelectedSecondaryOption] = useState('All');

  const fetchData = async () => {
    try {
      const [favoriteResult, menuResult, gatewayResult, alohaResult, foodTableResult] = await Promise.allSettled([
        fetch(`/api/userFavorites?userId=${userId}`),
        fetch(`/api/latestMenuCheck?language=${language}`), // Campus Center Food Court
        fetch(`/api/latestGatewayMenuCheck?language=${language}`), // Gateway Café
        fetch(`/api/latestAlohaMenuCheck?language=${language}`), // Hale Aloha Café
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

      if (gatewayResult.status === 'fulfilled' && gatewayResult.value.ok) {
        const gatewayData = await gatewayResult.value.json();
        localStorage.setItem('gatewayMenu', JSON.stringify(gatewayData));
        setGatewayMenu(gatewayData);
      } else {
        console.error('Failed to fetch gateway menu');
      }

      if (alohaResult.status === 'fulfilled' && alohaResult.value.ok) {
        const alohaData = await alohaResult.value.json();
        localStorage.setItem('alohaMenu', JSON.stringify(alohaData));
        setAlohaMenu(alohaData);
      } else {
        console.error('Failed to fetch aloha menu');
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
    const storedGatewayMenu = localStorage.getItem('gatewayMenu');
    const storedAlohaMenu = localStorage.getItem('alohaMenu');
    const storedFoodTable = localStorage.getItem('foodTable');

    if (storedUserFavoriteItems && storedLatestMenu && storedFoodTable && storedGatewayMenu && storedAlohaMenu) {
      setUserFavoriteItems(JSON.parse(storedUserFavoriteItems));
      setLatestMenu(JSON.parse(storedLatestMenu));
      setGatewayMenu(JSON.parse(storedGatewayMenu));
      setAlohaMenu(JSON.parse(storedAlohaMenu));
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

  // Weekly and Recommended for Campus Center Food Court
  const flattenedMenu = latestMenu.map((day) => [...day.grabAndGo, ...day.plateLunch]);
  const filteredMenu = flattenedMenu.map((day) => day.filter((item) => userFavoriteItems.includes(item)));
  const campusCenterWeeklyItems: string[][] = useMemo(() => [[], ...filteredMenu, []], [filteredMenu]);
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

  // Weekly and Recommended for Gateway Café
  const gatewayBreakfastMenu = gatewayMenu.map((day: DayMenu) =>
    day.menu
      .map((group: SdxGroup) =>
        group.groups
          .map((subGroup: SdxSubGroup) =>
            subGroup.items
              .filter((item: SdxMenuItem) => item.meal === 'BREAKFAST' && !SdxFilter.includes(item.formalName))
              .map((item: SdxMenuItem) => item.formalName),
          )
          .flat(),
      )
      .flat(),
  );
  const gatewayBreakfastFiltered = gatewayBreakfastMenu.map((day) =>
    day.filter((item) => userFavoriteItems.includes(item)),
  );
  const gatewayBreakfastRecommendedItems: RecommendedItem[] = foodTable
    .map((entry) => ({
      name: entry.name,
      image: entry.url,
      label: entry.label,
    }))
    .filter((entry) =>
      gatewayBreakfastMenu
        .flatMap((day) => day)
        .filter((item) => !userFavoriteItems.includes(item))
        .includes(entry.name),
    );
  const gatewayLunchMenu = gatewayMenu.map((day: DayMenu) =>
    day.menu
      .map((group: SdxGroup) =>
        group.groups
          .map((subGroup: SdxSubGroup) =>
            subGroup.items
              .filter((item: SdxMenuItem) => item.meal === 'LUNCH' && !SdxFilter.includes(item.formalName))
              .map((item: SdxMenuItem) => item.formalName),
          )
          .flat(),
      )
      .flat(),
  );
  const gatewayLunchFiltered = gatewayLunchMenu.map((day) => day.filter((item) => userFavoriteItems.includes(item)));
  const gatewayLunchRecommendedItems: RecommendedItem[] = foodTable
    .map((entry) => ({
      name: entry.name,
      image: entry.url,
      label: entry.label,
    }))
    .filter((entry) =>
      gatewayLunchMenu
        .flatMap((day) => day)
        .filter((item) => !userFavoriteItems.includes(item))
        .includes(entry.name),
    );
  const gatewayDinnerMenu = gatewayMenu.map((day: DayMenu) =>
    day.menu
      .map((group: SdxGroup) =>
        group.groups
          .map((subGroup: SdxSubGroup) =>
            subGroup.items
              .filter((item: SdxMenuItem) => item.meal === 'DINNER' && !SdxFilter.includes(item.formalName))
              .map((item: SdxMenuItem) => item.formalName),
          )
          .flat(),
      )
      .flat(),
  );
  const gatewayDinnerFiltered = gatewayDinnerMenu.map((day) => day.filter((item) => userFavoriteItems.includes(item)));
  const gatewayDinnerRecommendedItems: RecommendedItem[] = foodTable
    .map((entry) => ({
      name: entry.name,
      image: entry.url,
      label: entry.label,
    }))
    .filter((entry) =>
      gatewayDinnerMenu
        .flatMap((day) => day)
        .filter((item) => !userFavoriteItems.includes(item))
        .includes(entry.name),
    );
  const gatewayCafeWeeklyItems: string[][] = gatewayBreakfastFiltered.map((breakfastItems, index) => [
    ...breakfastItems,
    ...(gatewayLunchFiltered[index] || []),
    ...(gatewayDinnerFiltered[index] || []),
  ]);
  const gatewayCafeRecommendedItems: RecommendedItem[] = useMemo(
    () => [...gatewayBreakfastRecommendedItems, ...gatewayLunchRecommendedItems, ...gatewayDinnerRecommendedItems],
    [gatewayBreakfastRecommendedItems, gatewayLunchRecommendedItems, gatewayDinnerRecommendedItems],
  );

  // Weekly and Recommended for Aloha Cafe
  const alohaBrunchMenu = alohaMenu.map((day: DayMenu) =>
    day.menu
      .map((group: SdxGroup) =>
        group.groups
          .map((subGroup: SdxSubGroup) =>
            subGroup.items
              .filter((item: SdxMenuItem) => item.meal === 'BRUNCH' && !SdxFilter.includes(item.formalName))
              .map((item: SdxMenuItem) => item.formalName),
          )
          .flat(),
      )
      .flat(),
  );
  const alohaBrunchFiltered = alohaBrunchMenu.map((day) => day.filter((item) => userFavoriteItems.includes(item)));
  const alohaBrunchRecommendedItems: RecommendedItem[] = foodTable
    .map((entry) => ({
      name: entry.name,
      image: entry.url,
      label: entry.label,
    }))
    .filter((entry) =>
      alohaBrunchMenu
        .flatMap((day) => day)
        .filter((item) => !userFavoriteItems.includes(item))
        .includes(entry.name),
    );
  const alohaDinnerMenu = alohaMenu.map((day: DayMenu) =>
    day.menu
      .map((group: SdxGroup) =>
        group.groups
          .map((subGroup: SdxSubGroup) =>
            subGroup.items
              .filter((item: SdxMenuItem) => item.meal === 'DINNER' && !SdxFilter.includes(item.formalName))
              .map((item: SdxMenuItem) => item.formalName),
          )
          .flat(),
      )
      .flat(),
  );
  const alohaDinnerFiltered = alohaDinnerMenu.map((day) => day.filter((item) => userFavoriteItems.includes(item)));
  const alohaDinnerRecommendedItems: RecommendedItem[] = foodTable
    .map((entry) => ({
      name: entry.name,
      image: entry.url,
      label: entry.label,
    }))
    .filter((entry) =>
      alohaDinnerMenu
        .flatMap((day) => day)
        .filter((item) => !userFavoriteItems.includes(item))
        .includes(entry.name),
    );
  const haleAlohaWeeklyItems: string[][] = alohaBrunchFiltered.map((brunchItems, index) => [
    ...brunchItems,
    ...(alohaDinnerFiltered[index] || []),
  ]);
  const haleAlohaRecommendedItems: RecommendedItem[] = useMemo(
    () => [...alohaBrunchRecommendedItems, ...alohaDinnerRecommendedItems],
    [alohaBrunchRecommendedItems, alohaDinnerRecommendedItems],
  );
  console.log(haleAlohaRecommendedItems);

  // Filter by location
  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const { value }: { value: string } = event.target;
    setSelectedOption(value);

    // Update secondary options based on the selected primary option
    switch (value) {
      case 'Gateway Café':
        setSecondaryOptions(['All', 'Breakfast', 'Lunch', 'Dinner']);
        setSelectedSecondaryOption('All');
        break;
      case 'Hale Aloha Café':
        setSecondaryOptions(['All', 'Brunch', 'Dinner']);
        setSelectedSecondaryOption('All');
        break;
      default:
        break;
    }
  };
  const handleSecondarySelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSecondaryOption(event.target.value);
  };

  // Calendar Display
  // Weekly Items
  const combinedWeeklyItems = useMemo(() => {
    const combined = [];
    for (let i = 0; i < 7; i++) {
      combined.push([
        ...safeArray(campusCenterWeeklyItems[i]),
        ...safeArray(gatewayCafeWeeklyItems[i]),
        ...safeArray(haleAlohaWeeklyItems[i]),
      ]);
    }
    return combined;
  }, [campusCenterWeeklyItems, gatewayCafeWeeklyItems, haleAlohaWeeklyItems]);

  const getFilteredWeeklyItems = () => {
    switch (selectedOption) {
      case 'Campus Center Food Court':
        return campusCenterWeeklyItems;
      case 'Gateway Café':
        switch (selectedSecondaryOption) {
          case 'Breakfast':
            return gatewayBreakfastFiltered;
          case 'Lunch':
            return gatewayLunchFiltered;
          case 'Dinner':
            return gatewayDinnerFiltered;
          default:
            return gatewayCafeWeeklyItems;
        }
      case 'Hale Aloha Café':
        switch (selectedSecondaryOption) {
          case 'Brunch':
            return alohaBrunchFiltered;
          case 'Dinner':
            return alohaDinnerFiltered;
          default:
            return haleAlohaWeeklyItems;
        }
      default:
        return combinedWeeklyItems;
    }
  };

  // Recommended Items
  // eslint-disable-next-line arrow-body-style
  const combinedRecommendedItems = useMemo(() => {
    return [
      ...safeArray(campusCenterRecommendedItems),
      ...safeArray(gatewayCafeRecommendedItems),
      ...safeArray(haleAlohaRecommendedItems),
    ];
  }, [campusCenterRecommendedItems, gatewayCafeRecommendedItems, haleAlohaRecommendedItems]);

  const getFilteredRecommendedItems = () => {
    switch (selectedOption) {
      case 'Campus Center Food Court':
        return campusCenterRecommendedItems;
      case 'Gateway Café':
        switch (selectedSecondaryOption) {
          case 'Breakfast':
            return gatewayBreakfastRecommendedItems;
          case 'Lunch':
            return gatewayLunchRecommendedItems;
          case 'Dinner':
            return gatewayDinnerRecommendedItems;
          default:
            return gatewayCafeRecommendedItems;
        }
      case 'Hale Aloha Café':
        switch (selectedSecondaryOption) {
          case 'Brunch':
            return alohaBrunchRecommendedItems;
          case 'Dinner':
            return alohaDinnerRecommendedItems;
          default:
            return haleAlohaRecommendedItems;
        }
      default:
        return combinedRecommendedItems;
    }
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
      <Row className="mt-4 mb-2">
        <Container>
          <Form.Select className="d-flex ms-auto" style={{ width: '260px' }} onChange={handleSelectChange}>
            <option>All</option>
            <option>Campus Center Food Court</option>
            <option>Gateway Café</option>
            <option>Hale Aloha Café</option>
          </Form.Select>
        </Container>
      </Row>
      <Row>
        <Container>
          <Form.Select className="d-flex ms-auto" style={{ width: '200px' }} onChange={handleSecondarySelectChange}>
            {secondaryOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
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
