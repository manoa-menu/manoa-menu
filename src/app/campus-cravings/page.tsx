'use client';

import { useState } from 'react';
import { Container, Col, Row, Form } from 'react-bootstrap';
import { useSession } from 'next-auth/react';
import CravingsFoodCard from '../../components/CravingsFoodCard';

const CampusCravings: React.FC = () => {
  const { data: session } = useSession();
  const currentUser = session?.user?.email ?? null;
  const [starredItems, setStarredItems] = useState<{ [key: string]: boolean }>({});
  const [selectedOption, setSelectedOption] = useState<string>('All');

  const foodItems = [
    { id: 'item1', name: 'Food Item 1', description: 'Description', location: 'Campus Center Food Court', likes: 5 },
    { id: 'item2', name: 'Food Item 2', description: 'Description', location: 'Gateway Café', likes: 0 },
    { id: 'item3', name: 'Food Item 3', description: 'Description', location: 'Hale Aloha Café', likes: 2 },
    { id: 'item4', name: 'Food Item 4', description: 'Description', location: 'Campus Center Food Court', likes: 3 },
  ];

  // Handle dropdown selection change
  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedOption(event.target.value);
  };

  // Filter the food items based on the selected option
  const filteredFoodItems = foodItems.filter((foodItem) => {
    if (selectedOption === 'All') return true;
    return foodItem.location === selectedOption;
  });

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
            value={selectedOption}
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
      <div className="overflow-auto" style={{ maxHeight: '500px', border: '2px solid', borderRadius: '5px' }}>
        <Col>
          {filteredFoodItems.map((foodItem) => (
            <CravingsFoodCard
              key={foodItem.id}
              id={foodItem.id}
              name={foodItem.name}
              description={foodItem.description}
              location={foodItem.location}
              likes={foodItem.likes}
              isStarred={starredItems[foodItem.id]}
              onToggle={toggleStar}
              currentUser={currentUser}
            />
          ))}
        </Col>
      </div>
    </Container>
  );
};

export default CampusCravings;
