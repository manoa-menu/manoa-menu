/* eslint-disable react-hooks/exhaustive-deps */

'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Container, Row, Form, Col } from 'react-bootstrap';
import { useSession } from 'next-auth/react';
import Calendar from '@/components/Calendar';
// import FoodItemSlider from '@/components/FoodItemSlider';
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
// interface RecommendedItem {
//   name: string;
//   image: string;
//   label: string[];
// }

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

const SdxFilter = [
  'White Rice',
  'Brown Rice',
  'Sour Cream',
  'Steamed White Rice',
  'Steamed Brown Rice',
  "Lay's Potato Chips",
];

const DashboardPage = () => {
  const { data: session } = useSession();
  const userId = (session?.user as { id: number })?.id || null;

  // Ensure arrays are not null or undefined
  const safeArray = (arr: any[]) => arr || [];

  // Fetching data
  const [userFavoriteItems, setUserFavoriteItems] = useState<string[]>([]);
  const [latestMenu, setLatestMenu] = useState<MenuItem[]>([]);
  const [gatewayMenu, setGatewayMenu] = useState<DayMenu[]>([]);
  const [alohaMenu, setAlohaMenu] = useState<DayMenu[]>([]);
  const [foodTable, setFoodTable] = useState<FoodTableEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filteredWeeklyItems, setFilteredWeeklyItems] = useState<string[][]>([]);

  // Location filter
  const [selectedOption, setSelectedOption] = useState('All');
  const [secondaryOptions, setSecondaryOptions] = useState<string[]>([]);
  const [selectedSecondaryOption, setSelectedSecondaryOption] = useState('All');

  // Language
  const [language, setLanguage] = useState('English');
  const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(event.target.value);
  };

  // FETCHING AND STORAGE
  // FETCHING AND STORAGE
  // Fetch Data from API endpoints
  const fetchData = async () => {
    try {
      const [menuResult, gatewayResult, alohaResult, foodTableResult] = await Promise.allSettled([
        fetch('/api/latestMenuCheck?language=English'), // Campus Center Food Court
        fetch('/api/latestGatewayMenuCheck?language=English'), // Gateway Café
        fetch('/api/latestAlohaMenuCheck?language=English'), // Hale Aloha Café
        fetch('/api/getFoodTable'),
      ]);

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
    const fetchAndCompareUserFavorites = async () => {
      try {
        const response = await fetch(`/api/userFavorites?userId=${userId}`);
        if (response.ok) {
          const userFavoriteItemsData = await response.json();
          const storedUserFavoriteItems = localStorage.getItem('userFavoriteItems');

          if (storedUserFavoriteItems) {
            const parsedStoredUserFavoriteItems = JSON.parse(storedUserFavoriteItems);
            if (JSON.stringify(parsedStoredUserFavoriteItems) !== JSON.stringify(userFavoriteItemsData)) {
              localStorage.setItem('userFavoriteItems', JSON.stringify(userFavoriteItemsData));
              setUserFavoriteItems(userFavoriteItemsData);
            } else {
              setUserFavoriteItems(parsedStoredUserFavoriteItems);
            }
          } else {
            localStorage.setItem('userFavoriteItems', JSON.stringify(userFavoriteItemsData));
            setUserFavoriteItems(userFavoriteItemsData);
          }
        } else {
          console.error('Failed to fetch user favorite items');
        }
      } catch (error) {
        console.error('Error fetching user favorite items:', error);
      }
    };

    const storedUserFavoriteItems = localStorage.getItem('userFavoriteItems');
    const storedLatestMenu = localStorage.getItem('latestMenu');
    const storedGatewayMenu = localStorage.getItem('gatewayMenu');
    const storedAlohaMenu = localStorage.getItem('alohaMenu');
    const storedFoodTable = localStorage.getItem('foodTable');

    if (storedUserFavoriteItems && storedLatestMenu && storedGatewayMenu && storedAlohaMenu && storedFoodTable) {
      setUserFavoriteItems(JSON.parse(storedUserFavoriteItems));
      setLatestMenu(JSON.parse(storedLatestMenu));
      setGatewayMenu(JSON.parse(storedGatewayMenu));
      setAlohaMenu(JSON.parse(storedAlohaMenu));
      setFoodTable(JSON.parse(storedFoodTable));
      setLoading(false);
      fetchAndCompareUserFavorites();
    } else {
      fetchData();
    }
  }, [userId]);

  const handleToggle = async (item: string) => {
    setUserFavoriteItems((prevStarredItems) => {
      if (prevStarredItems.includes(item)) {
        return prevStarredItems.filter((starredItem) => starredItem !== item);
      }
      return [...prevStarredItems, item];
    });
    await fetchData();
  };
  // FETCHING AND STORAGE
  // FETCHING AND STORAGE

  // HELPER FUNCTION
  // Filtered Menu for Sodexy Menu
  const getFilteredSdxMenu = (menu: DayMenu[], mealType: string, userFavorites: string[]) => {
    const sdxFilteredMenu = menu.map((day: DayMenu) =>
      day.menu
        .map((group: SdxGroup) =>
          group.groups
            .map((subGroup: SdxSubGroup) =>
              subGroup.items
                .filter((item: SdxMenuItem) => item.meal === mealType && !SdxFilter.includes(item.formalName))
                .map((item: SdxMenuItem) => item.formalName),
            )
            .flat(),
        )
        .flat(),
    );
    return sdxFilteredMenu.map((day) => day.filter((item) => userFavorites.includes(item)));
  };
  const getFilteredMenuLanguage = (menu: string[][], languageIndex: number) =>
    menu.map((day) =>
      day
        .map((item) => foodTable.find((entry) => entry.name === item))
        .filter(Boolean)
        .map((name) => name?.translation[languageIndex] || ''),
    );
  const getWeeklyItems = (breakfastMenu: string[][], lunchMenu: string[][], dinnerMenu: string[][]) =>
    breakfastMenu.map((breakfastItems, index) => [
      ...breakfastItems,
      ...(lunchMenu[index] || []),
      ...(dinnerMenu[index] || []),
    ]);
  const combineWeeklyItems = (
    weeklyItems1: string[][],
    weeklyItems2: string[][],
    weeklyItems3: string[][],
  ): string[][] => {
    const combined = [];
    for (let i = 0; i < 7; i++) {
      combined.push([...safeArray(weeklyItems1[i]), ...safeArray(weeklyItems2[i]), ...safeArray(weeklyItems3[i])]);
    }
    return combined;
  };

  // HELPER FUNCTION
  // HELPER FUNCTION

  // Filtered Menu for Sodexy Menu
  // Weekly and Recommended for Campus Center Food Court
  const flattenedMenu = latestMenu.map((day) => [...day.grabAndGo, ...day.plateLunch]);
  const filteredMenu = flattenedMenu.map((day) => day.filter((item) => userFavoriteItems.includes(item)));
  const campusCenterWeeklyItems: string[][] = useMemo(() => [[], ...filteredMenu, []], [filteredMenu]);
  const campusCenterWeeklyItemsJP = getFilteredMenuLanguage(campusCenterWeeklyItems, 0);
  // END OF WEEKLY ITEMS FOR CAMPUS CENTER FOOD COURT

  // WEEKLY ITEMS FOR GATEWAY CAFE
  const gatewayBreakfastFiltered = getFilteredSdxMenu(gatewayMenu, 'BREAKFAST', userFavoriteItems);
  const gatewayLunchFiltered = getFilteredSdxMenu(gatewayMenu, 'LUNCH', userFavoriteItems);
  const gatewayDinnerFiltered = getFilteredSdxMenu(gatewayMenu, 'DINNER', userFavoriteItems);
  const gatewayBreakfastMenuJP = getFilteredMenuLanguage(gatewayBreakfastFiltered, 0);
  const gatewayLunchMenuJP = getFilteredMenuLanguage(gatewayLunchFiltered, 0);
  const gatewayDinnerMenuJP = getFilteredMenuLanguage(gatewayDinnerFiltered, 0);
  const gatewayCafeWeeklyItems = getWeeklyItems(gatewayBreakfastFiltered, gatewayLunchFiltered, gatewayDinnerFiltered);
  const gatewayCafeWeeklyItemsJP = getWeeklyItems(gatewayBreakfastMenuJP, gatewayLunchMenuJP, gatewayDinnerMenuJP);
  // WEEKLY ITEMS FOR GATEWAY CAFE

  // WEEKLY ITEMS FOR HALE ALOHA CAFE
  const alohaBrunchFiltered = getFilteredSdxMenu(alohaMenu, 'BRUNCH', userFavoriteItems);
  const alohaDinnerFiltered = getFilteredSdxMenu(alohaMenu, 'DINNER', userFavoriteItems);
  const alohaBrunchMenuJP = getFilteredMenuLanguage(alohaBrunchFiltered, 0);
  const alohaDinnerMenuJP = getFilteredMenuLanguage(alohaDinnerFiltered, 0);
  const haleAlohaWeeklyItems = getWeeklyItems(alohaBrunchFiltered, [], alohaDinnerFiltered);
  const haleAlohaWeeklyItemsJP = getWeeklyItems(alohaBrunchMenuJP, [], alohaDinnerMenuJP);
  // WEEKLY ITEMS FOR HALE ALOHA CAFE

  // RECOMMENDED ITEMS
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
      case 'ゲートウェイカフェ':
        setSecondaryOptions(['全部', '朝食', '昼食', '夕食']);
        setSelectedSecondaryOption('全部');
        break;
      case 'Hale Aloha Café':
        setSecondaryOptions(['All', 'Brunch', 'Dinner']);
        setSelectedSecondaryOption('All');
        break;
      case 'ハレアロハカフェ':
        setSecondaryOptions(['全部', 'ブランチ', '夕食']);
        setSelectedSecondaryOption('全部');
        break;
      default:
        setSecondaryOptions([]);
        setSelectedSecondaryOption('All');
        break;
    }
  };
  const handleSecondarySelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSecondaryOption(event.target.value);
  };

  // Calendar Display
  // Weekly Items
  const combinedWeeklyItems = useMemo(
    () => combineWeeklyItems(campusCenterWeeklyItems, gatewayCafeWeeklyItems, haleAlohaWeeklyItems),
    [campusCenterWeeklyItems, combineWeeklyItems, gatewayCafeWeeklyItems, haleAlohaWeeklyItems],
  );

  const combinedWeeklyItemsJP = useMemo(
    () => combineWeeklyItems(campusCenterWeeklyItemsJP, gatewayCafeWeeklyItemsJP, haleAlohaWeeklyItemsJP),
    [campusCenterWeeklyItemsJP, gatewayCafeWeeklyItemsJP, haleAlohaWeeklyItemsJP, combineWeeklyItems],
  );
  useEffect(() => {
    const getFilteredWeeklyItems = (): string[][] => {
      switch (selectedOption) {
        case 'キャンパスセンター':
        case 'Campus Center Food Court':
          return language === 'Japanese' ? campusCenterWeeklyItemsJP : campusCenterWeeklyItems;
        case 'ゲートウェイカフェ':
        case 'Gateway Café':
          switch (selectedSecondaryOption) {
            case '朝食':
              return language === 'Japanese' ? gatewayBreakfastMenuJP : gatewayBreakfastFiltered;
            case '昼食':
              return language === 'Japanese' ? gatewayLunchMenuJP : gatewayLunchFiltered;
            case '夕食':
              return language === 'Japanese' ? gatewayDinnerMenuJP : gatewayDinnerFiltered;
            default:
              return language === 'Japanese' ? gatewayCafeWeeklyItemsJP : gatewayCafeWeeklyItems;
          }
        case 'ハレアロハカフェ':
        case 'Hale Aloha Café':
          switch (selectedSecondaryOption) {
            case 'ブランチ':
              return language === 'Japanese' ? alohaBrunchMenuJP : alohaBrunchFiltered;
            case '夕食':
              return language === 'Japanese' ? alohaDinnerMenuJP : alohaDinnerFiltered;
            default:
              return language === 'Japanese' ? haleAlohaWeeklyItemsJP : haleAlohaWeeklyItems;
          }
        default:
          return language === 'Japanese' ? combinedWeeklyItemsJP : combinedWeeklyItems;
      }
    };

    setFilteredWeeklyItems(getFilteredWeeklyItems());
  }, [language, selectedOption, selectedSecondaryOption, combinedWeeklyItems, combinedWeeklyItemsJP]);

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
      <Row className="my-2">
        <Col>
          <Form.Select style={{ width: '260px' }} onChange={handleSelectChange}>
            <option>{language === 'English' ? 'All' : '全部'}</option>
            <option>{language === 'English' ? 'Campus Center Food Court' : 'キャンパスセンター'}</option>
            <option>{language === 'English' ? 'Gateway Café' : 'ゲートウェイカフェ'}</option>
            <option>{language === 'English' ? 'Hale Aloha Café' : 'ハレアロハカフェ'}</option>
          </Form.Select>
        </Col>
        <Col>
          <Form.Select className="d-flex ms-auto" style={{ width: '110px' }} onChange={handleLanguageChange}>
            <option value="English">English</option>
            <option value="Japanese">日本語</option>
          </Form.Select>
        </Col>
      </Row>
      <Row>
        <Container>
          <Form.Select style={{ width: '200px' }} onChange={handleSecondarySelectChange}>
            {secondaryOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </Form.Select>
        </Container>
      </Row>
      <Row className="py-2 mb-4">
        <Calendar weeklyItems={filteredWeeklyItems} onToggle={handleToggle} language={language} />
      </Row>
      <Row className="pt-4 mt-4">{language === 'English' ? <h1>Recommended</h1> : <h1>おすすめ</h1>}</Row>
      <Row className="mb-4">
        {/* <FoodItemSlider foodItem={} userFavoriteItems={userFavoriteItems} onToggle={handleToggle} /> */}
      </Row>
    </Container>
  );
};

export default DashboardPage;
