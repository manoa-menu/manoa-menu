'use client';

import { useState, useEffect } from 'react';
import { Container, Card, Col, Row, Form } from 'react-bootstrap';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import StarButton from './StarButton';

const CampusCravings: React.FC = () => {
  const { data: session } = useSession();
  const currentUser = session?.user?.email;
  const [starredItems, setStarredItems] = useState<{ [key: string]: boolean }>({});
  const [favoriteCounts, setFavoriteCounts] = useState<{ [key: string]: number }>({});
  const [selectedOption, setSelectedOption] = useState<string>('All');

  const foodItems = [
    { id: 'item1', name: 'Food Item 1', description: 'Food Item 1 Description', location: 'Campus Center Food Court' },
    { id: 'item2', name: 'Food Item 2', description: 'Food Item 2 Description', location: 'Gateway Café' },
    { id: 'item3', name: 'Food Item 3', description: 'Food Item 3 Description', location: 'Hale Aloha Café' },
    { id: 'item4', name: 'Food Item 4', description: 'Food Item 4 Description', location: 'Campus Center Food Court' },
  ];

  useEffect(() => {
    foodItems.forEach(async (item) => {
      const response = await axios.get(`/api/likes/${item.id}`);
      setFavoriteCounts((prev) => ({ ...prev, [item.id]: response.data.likes }));
    });
  }, []);

  // Handle dropdown selection change
  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedOption(event.target.value);
  };

  // Filter the food items based on the selected option
  const filteredFoodItems = foodItems.filter((foodItem) => {
    if (selectedOption === 'All') return true;
    return foodItem.location === selectedOption;
  });

  const toggleStar = async (item: string) => {
    const response = await axios.post('/api/likes/toggle', { foodItemId: item });
    setFavoriteCounts((prev) => ({ ...prev, [item]: response.data.likes }));
    setStarredItems((prev) => ({
      ...prev,
      [item]: !prev[item],
    }));
  };

  return (
    <Container className="my-5">
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
      <div className="overflow-auto" style={{ maxHeight: '500px', border: '3px solid', borderRadius: '5px' }}>
        <Col>
          {filteredFoodItems.map((foodItem) => (
            <Card className="my-3" key={foodItem.id}>
              <Card.Header>{foodItem.name}</Card.Header>
              <Card.Body>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Card.Title>{foodItem.name}</Card.Title>
                  {session && (
                  <StarButton
                    item={foodItem.id}
                    isStarred={starredItems[foodItem.id] || false}
                    onToggle={toggleStar}
                  />
                  )}
                </div>
                <Card.Text>{foodItem.description}</Card.Text>
                <Card.Text>
                  Likes:
                  {favoriteCounts[foodItem.id] || 0}
                </Card.Text>
                {session && (
                  <div>
                    <Card.Text>
                      Additional info for&nbsp;
                      {foodItem.name}
                    </Card.Text>
                  </div>
                )}
              </Card.Body>
            </Card>
          ))}
        </Col>
      </div>
    </Container>
  );
};

export default CampusCravings;
