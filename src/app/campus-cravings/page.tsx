'use client';

import { useState, useEffect } from 'react';
import { Container, Col, Row, Form } from 'react-bootstrap';
import { useSession } from 'next-auth/react';
import CravingsFoodCard from '../../components/CravingsFoodCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import './CampusCravings.css';

interface FoodTableEntry {
  id: number;
  name: string;
  url: string;
  likes: number;
  label: string[];
  translation: string[];
  location?: string;
}

function CampusCravings() {
  const { data: session } = useSession();
  const currentUser = session?.user?.email ?? null;
  const [starredItems, setStarredItems] = useState<{ [key: string]: boolean }>({});
  const [selectedOption, setSelectedOption] = useState<string>('All');
  const [foodTable, setFoodTable] = useState<FoodTableEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/getFoodTable');
        if (response.ok) {
          const data = await response.json();
          setFoodTable(data);
        } else {
          console.error('Failed to fetch food table:', response.statusText);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Transform labels into location strings
  const updatedFoodItems = foodTable.map((foodItem) => {
    const location = foodItem.label.includes('grabAndGo') || foodItem.label.includes('plateLunch')
      ? 'Campus Center Food Court'
      : foodItem.label.join(', '); // Join labels into a single string if not 'grabandgo' or 'plate lunch'
    return { ...foodItem, location };
  });

  // Mapping display names to location values
  const locationMapping: { [key: string]: string } = {
    'Campus Center Food Court': 'Campus Center Food Court',
    'Gateway Café': 'Gateway',
    'Hale Aloha Café': 'Hale Aloha',
  };

  // Reverse mapping for display names
  const reverseLocationMapping: { [key: string]: string } = {
    'Campus Center Food Court': 'Campus Center Food Court',
    Gateway: 'Gateway Café',
    'Hale Aloha': 'Hale Aloha Café',
  };

  // Handle dropdown selection change
  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = event.target.value;
    const mappedValue = locationMapping[selectedValue] || selectedValue;
    setSelectedOption(mappedValue);
  };

  // Filter the food items based on the selected option
  const filteredFoodItems = updatedFoodItems
    .filter((foodItem) => {
      if (selectedOption === 'All') return true;
      return foodItem.location.includes(selectedOption);
    })
    .map((entry) => ({
      id: entry.id,
      name: entry.name,
      image: entry.url,
      likes: entry.likes,
      label: entry.label,
      location: entry.location, // Include location property
      isStarred: false, // Add logic for starring if needed
      onToggle: () => {}, // Placeholder for toggle functionality
    }));

  if (loading) {
    return (
      <Container className="body-loading">
        <LoadingSpinner />
      </Container>
    );
  }

  const toggleStar = (item: string) => {
    setStarredItems((prev) => ({
      ...prev,
      [item]: !prev[item],
    }));
  };

  return (
    <Container className="my-5" style={{ paddingTop: '120px' }}>
      <Row>
        <h1>Popular Food Choices</h1>
        <Container>
          {/* Dropdown for selecting food court location */}
          <Form.Select
            className="my-2"
            style={{ width: '150px', border: '2px solid' }}
            value={reverseLocationMapping[selectedOption] || selectedOption}
            onChange={handleSelectChange}
          >
            <option>All</option>
            <option>Campus Center Food Court</option>
            <option>Gateway Café</option>
            <option>Hale Aloha Café</option>
          </Form.Select>

          {currentUser && (
            <Form.Select className="my-2" style={{ width: '150px', border: '2px solid' }}>
              <option>All Favorites</option>
              <option>My Favorites</option>
            </Form.Select>
          )}
        </Container>
      </Row>

      {/* Displaying filtered food items */}
      <div className="foodCardHolder">
        <Col>
          <CravingsFoodCard
            foodItems={filteredFoodItems.map((foodItem) => ({
              ...foodItem,
              isStarred: starredItems[foodItem.id] || false,
              onToggle: toggleStar,
            }))}
            currentUser={currentUser} // Pass currentUser prop
          />
        </Col>
      </div>
    </Container>
  );
}

export default CampusCravings;
