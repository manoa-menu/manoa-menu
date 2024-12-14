/* eslint-disable react-hooks/exhaustive-deps */

'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Container, Row, Form, Col } from 'react-bootstrap';
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
  name: string;
  url: string;
  label: string[];
  translation: string[];
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

const SdxFilter = [
  'White Rice',
  'Brown Rice',
  'Sour Cream',
  'Steamed White Rice',
  'Steamed Brown Rice',
  "Lay's Potato Chips",
  'Cheeseburger',
];

const DashboardPage = () => {
  const { data: session } = useSession();
  const [userId, setUserId] = useState<number>(-21);
  useEffect(() => {
    const fetchData = async () => {
      if (session?.user?.email) {
        setUserId((session?.user as { id: number })?.id);
      }
    };
    fetchData();
  }, [session]);
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
  const [location, setLocation] = useState<number>(0);
  const [meal, setMeal] = useState<string[]>([]);
  const [currentType, setCurrentType] = useState<number>(0);
  const [recommendedItems, setRecommendedItems] = useState<FoodTableEntry[]>([]);

  // Language
  const [language, setLanguage] = useState('English');
  const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(event.target.value);
  };

  console.log('userId:', userId);

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
  const getSdxMenu = (menu: DayMenu[], mealType: string) => {
    const sdxMenu = menu.map((day: DayMenu) =>
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
    return sdxMenu;
  };
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
  const combineWeeklyItems = useCallback(
    (weeklyItems1: string[][], weeklyItems2: string[][], weeklyItems3: string[][]): string[][] => {
      const combined = [];
      for (let i = 0; i < 7; i++) {
        combined.push([...safeArray(weeklyItems1[i]), ...safeArray(weeklyItems2[i]), ...safeArray(weeklyItems3[i])]);
      }
      return combined;
    },
    [],
  );
  const getRecommendedItems = (menu: string[][], userFavorites: string[]): FoodTableEntry[] => {
    const nonUserFavorites = menu.flat().filter((item) => !userFavorites.includes(item));
    const uniqueItems = Array.from(new Set(nonUserFavorites));
    return uniqueItems
      .map((item) => foodTable.find((entry) => entry.name === item))
      .filter(Boolean)
      .map((entry) => entry as FoodTableEntry);
  };
  const combineRecommendedItems = (
    menu1: FoodTableEntry[],
    menu2: FoodTableEntry[],
    menu3: FoodTableEntry[],
  ): FoodTableEntry[] => Array.from(new Set([...menu1, ...menu2, ...menu3]));
  const recommendedToLanguage = useCallback(
    (recommended: FoodTableEntry[], languageIndex: number): FoodTableEntry[] =>
      recommended.map((entry) => ({
        ...entry,
        name: entry.translation[languageIndex],
      })),
    [],
  );
  // HELPER FUNCTION
  // HELPER FUNCTION

  // Filtered Menu for Sodexy Menu
  // WEEKLY ITEMS FOR CAMPUS CENTER FOOD COURT
  const flattenedMenu = useMemo(() => latestMenu.map((day) => [...day.grabAndGo, ...day.plateLunch]), [latestMenu]);
  const filteredMenu = useMemo(
    () => flattenedMenu.map((day) => day.filter((item) => userFavoriteItems.includes(item))),
    [flattenedMenu, userFavoriteItems],
  );
  const campusCenterWeeklyItems: string[][] = useMemo(() => [[], ...filteredMenu, []], [filteredMenu]);
  const campusCenterWeeklyItemsJP = useMemo(
    () => getFilteredMenuLanguage(campusCenterWeeklyItems, 0),
    [campusCenterWeeklyItems],
  );
  // WEEKLY ITEMS FOR GATEWAY CAFE
  const gatewayBreakfastFiltered = useMemo(
    () => getFilteredSdxMenu(gatewayMenu, 'BREAKFAST', userFavoriteItems),
    [gatewayMenu, userFavoriteItems],
  );
  const gatewayLunchFiltered = useMemo(
    () => getFilteredSdxMenu(gatewayMenu, 'LUNCH', userFavoriteItems),
    [gatewayMenu, userFavoriteItems],
  );
  const gatewayDinnerFiltered = useMemo(
    () => getFilteredSdxMenu(gatewayMenu, 'DINNER', userFavoriteItems),
    [gatewayMenu, userFavoriteItems],
  );
  const gatewayBreakfastMenuJP = useMemo(
    () => getFilteredMenuLanguage(gatewayBreakfastFiltered, 0),
    [gatewayBreakfastFiltered],
  );
  const gatewayLunchMenuJP = useMemo(() => getFilteredMenuLanguage(gatewayLunchFiltered, 0), [gatewayLunchFiltered]);
  const gatewayDinnerMenuJP = useMemo(() => getFilteredMenuLanguage(gatewayDinnerFiltered, 0), [gatewayDinnerFiltered]);
  const gatewayCafeWeeklyItems = useMemo(
    () => getWeeklyItems(gatewayBreakfastFiltered, gatewayLunchFiltered, gatewayDinnerFiltered),
    [gatewayBreakfastFiltered, gatewayLunchFiltered, gatewayDinnerFiltered],
  );
  const gatewayCafeWeeklyItemsJP = useMemo(
    () => getWeeklyItems(gatewayBreakfastMenuJP, gatewayLunchMenuJP, gatewayDinnerMenuJP),
    [gatewayBreakfastMenuJP, gatewayLunchMenuJP, gatewayDinnerMenuJP],
  );
  // WEEKLY ITEMS FOR HALE ALOHA CAFE
  const alohaBrunchFiltered = useMemo(
    () => getFilteredSdxMenu(alohaMenu, 'BRUNCH', userFavoriteItems),
    [alohaMenu, userFavoriteItems],
  );
  const alohaDinnerFiltered = useMemo(
    () => getFilteredSdxMenu(alohaMenu, 'DINNER', userFavoriteItems),
    [alohaMenu, userFavoriteItems],
  );
  const alohaBrunchMenuJP = useMemo(() => getFilteredMenuLanguage(alohaBrunchFiltered, 0), [alohaBrunchFiltered]);
  const alohaDinnerMenuJP = useMemo(() => getFilteredMenuLanguage(alohaDinnerFiltered, 0), [alohaDinnerFiltered]);
  const haleAlohaWeeklyItems = useMemo(
    () => getWeeklyItems(alohaBrunchFiltered, [], alohaDinnerFiltered),
    [alohaBrunchFiltered, alohaDinnerFiltered],
  );
  const haleAlohaWeeklyItemsJP = useMemo(
    () => getWeeklyItems(alohaBrunchMenuJP, [], alohaDinnerMenuJP),
    [alohaBrunchMenuJP, alohaDinnerMenuJP],
  );
  // RECOMMENDED ITEMS FOR ALL
  const campusCenterRecommendedItems = useMemo(
    () => getRecommendedItems(flattenedMenu, userFavoriteItems),
    [filteredMenu, userFavoriteItems],
  );
  const gatewayBreakfastRecommendedItems = useMemo(
    () => getRecommendedItems(getSdxMenu(gatewayMenu, 'BREAKFAST'), userFavoriteItems),
    [gatewayMenu, userFavoriteItems],
  );
  const gatewayLunchRecommendedItems = useMemo(
    () => getRecommendedItems(getSdxMenu(gatewayMenu, 'LUNCH'), userFavoriteItems),
    [gatewayMenu, userFavoriteItems],
  );
  const gatewayDinnerRecommendedItems = useMemo(
    () => getRecommendedItems(getSdxMenu(gatewayMenu, 'DINNER'), userFavoriteItems),
    [gatewayMenu, userFavoriteItems],
  );
  const alohaBrunchRecommendedItems = useMemo(
    () => getRecommendedItems(getSdxMenu(alohaMenu, 'BRUNCH'), userFavoriteItems),
    [alohaMenu, userFavoriteItems],
  );
  const alohaDinnerRecommendedItems = useMemo(
    () => getRecommendedItems(getSdxMenu(alohaMenu, 'DINNER'), userFavoriteItems),
    [alohaMenu, userFavoriteItems],
  );
  const alohaDinnerRecommendedItemsJP = useMemo(
    () =>
      alohaDinnerRecommendedItems.map((entry) => ({
        ...entry,
        name: entry.translation[0],
      })),
    [alohaDinnerRecommendedItems],
  );
  const gatewayCafeRecommendedItems = useMemo(
    () =>
      combineRecommendedItems(
        gatewayBreakfastRecommendedItems,
        gatewayLunchRecommendedItems,
        gatewayDinnerRecommendedItems,
      ),
    [gatewayBreakfastRecommendedItems, gatewayLunchRecommendedItems, gatewayDinnerRecommendedItems],
  );
  const haleAlohaRecommendedItems = useMemo(
    () => combineRecommendedItems(alohaBrunchRecommendedItems, [], alohaDinnerRecommendedItems),
    [alohaBrunchRecommendedItems, alohaDinnerRecommendedItems],
  );
  const combinedRecommendedItems = useMemo(
    () => combineRecommendedItems(campusCenterRecommendedItems, gatewayCafeRecommendedItems, haleAlohaRecommendedItems),
    [campusCenterRecommendedItems, gatewayCafeRecommendedItems, haleAlohaRecommendedItems],
  );

  // Filter by location
  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setLocation(event.target.selectedIndex);
  };
  const handleMealTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentType(event.target.selectedIndex);
  };
  useEffect(() => {
    const updateSecondaryOptions = () => {
      switch (location) {
        case 2:
          if (language === 'English') {
            setMeal(['All', 'Breakfast', 'Lunch', 'Dinner']);
          } else if (language === 'Japanese') {
            setMeal(['全部', '朝食', '昼食', '夕食']);
          }
          break;
        case 3:
          if (language === 'English') {
            setMeal(['All', 'Brunch', 'Dinner']);
          } else if (language === 'Japanese') {
            setMeal(['全部', 'ブランチ', '夕食']);
          }
          break;
        default:
          setMeal([]);
          break;
      }
    };

    updateSecondaryOptions();
  }, [language, location]);
  // Calendar Display
  // Weekly Items
  const combinedWeeklyItems = useMemo(
    () => combineWeeklyItems(campusCenterWeeklyItems, gatewayCafeWeeklyItems, haleAlohaWeeklyItems),
    [campusCenterWeeklyItems, combineWeeklyItems, gatewayCafeWeeklyItems, haleAlohaWeeklyItems],
  );

  const combinedWeeklyItemsJP = useMemo(
    () => combineWeeklyItems(campusCenterWeeklyItemsJP, gatewayCafeWeeklyItemsJP, haleAlohaWeeklyItemsJP),
    [campusCenterWeeklyItemsJP, gatewayCafeWeeklyItemsJP, haleAlohaWeeklyItemsJP],
  );

  useEffect(() => {
    const getFilteredWeeklyItems = (): string[][] => {
      switch (location) {
        case 1:
          return language === 'Japanese' ? campusCenterWeeklyItemsJP : campusCenterWeeklyItems;
        case 2:
          switch (currentType) {
            case 1:
              return language === 'Japanese' ? gatewayBreakfastMenuJP : gatewayBreakfastFiltered;
            case 2:
              return language === 'Japanese' ? gatewayLunchMenuJP : gatewayLunchFiltered;
            case 3:
              return language === 'Japanese' ? gatewayDinnerMenuJP : gatewayDinnerFiltered;
            default:
              return language === 'Japanese' ? gatewayCafeWeeklyItemsJP : gatewayCafeWeeklyItems;
          }
        case 3:
          switch (currentType) {
            case 1:
              return language === 'Japanese' ? alohaBrunchMenuJP : alohaBrunchFiltered;
            case 2:
              return language === 'Japanese' ? alohaDinnerMenuJP : alohaDinnerFiltered;
            default:
              return language === 'Japanese' ? haleAlohaWeeklyItemsJP : haleAlohaWeeklyItems;
          }
        default:
          return language === 'Japanese' ? combinedWeeklyItemsJP : combinedWeeklyItems;
      }
    };
    setFilteredWeeklyItems(getFilteredWeeklyItems());
  }, [language, location, currentType, combinedWeeklyItems]);
  // Recommended Items
  useEffect(() => {
    const getRecommended = (): FoodTableEntry[] => {
      switch (location) {
        case 1:
          return language === 'Japanese'
            ? recommendedToLanguage(campusCenterRecommendedItems, 0)
            : campusCenterRecommendedItems;
        case 2:
          switch (currentType) {
            case 1:
              return language === 'Japanese'
                ? recommendedToLanguage(gatewayBreakfastRecommendedItems, 0)
                : gatewayBreakfastRecommendedItems;
            case 2:
              return language === 'Japanese'
                ? recommendedToLanguage(gatewayLunchRecommendedItems, 0)
                : gatewayLunchRecommendedItems;
            case 3:
              return language === 'Japanese'
                ? recommendedToLanguage(gatewayDinnerRecommendedItems, 0)
                : gatewayDinnerRecommendedItems;
            default:
              return language === 'Japanese'
                ? recommendedToLanguage(gatewayCafeRecommendedItems, 0)
                : gatewayCafeRecommendedItems;
          }
        case 3:
          switch (currentType) {
            case 1:
              return language === 'Japanese'
                ? recommendedToLanguage(alohaBrunchRecommendedItems, 0)
                : alohaBrunchRecommendedItems;
            case 2:
              return language === 'Japanese' ? alohaDinnerRecommendedItemsJP : alohaDinnerRecommendedItems;
            default:
              return language === 'Japanese'
                ? recommendedToLanguage(haleAlohaRecommendedItems, 0)
                : haleAlohaRecommendedItems;
          }
        default:
          return language === 'Japanese'
            ? recommendedToLanguage(combinedRecommendedItems, 0)
            : combinedRecommendedItems;
      }
    };

    setRecommendedItems(getRecommended());
  }, [language, location, currentType, combinedRecommendedItems, alohaDinnerRecommendedItemsJP]);

  // Render a loading state while fetching data
  if (loading) {
    return (
      <Container className="body-loading">
        <LoadingSpinner />
      </Container>
    );
  }

  return (
    <div className="body">
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
          <Form.Select
            style={{ width: '200px' }}
            onChange={handleMealTypeChange}
            disabled={location === 0 || location === 1}
          >
            {meal.map((option) => (
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
        <FoodItemSlider foodItem={recommendedItems} onToggle={handleToggle} language={language} />
      </Row>
    </div>
  );
};

export default DashboardPage;
