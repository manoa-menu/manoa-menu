'use client';

import { useState } from 'react';
import { Container, Card, Col, Row, Form } from 'react-bootstrap';
import { useSession } from 'next-auth/react';
import StarButton from './StarButton';

const CampusCravings: React.FC = () => {
  const { data: session } = useSession();
  const currentUser = session?.user?.email;
  const [starredItems, setStarredItems] = useState<{ [key: string]: boolean }>({});

  const toggleStar = (item: string) => {
    setStarredItems((prev) => ({
      ...prev,
      [item]: !prev[item],
    }));
  };

  const foodItems = [
    { id: 'item1', name: 'Food Item 1', description: 'Food Item 1 Description' },
    { id: 'item2', name: 'Food Item 2', description: 'Food Item 2 Description' },
    { id: 'item3', name: 'Food Item 3', description: 'Food Item 3 Description' },
    { id: 'item4', name: 'Food Item 4', description: 'Food Item 4 Description' },
  ];

  return (
    <Container className="my-5">
      <Row>
        <h1>Popular Food Choices</h1>
        <Container>
          <Form.Select className="my-2" style={{ width: '150px', border: '2px solid' }}>
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
      <div className="overflow-auto" style={{ maxHeight: '500px', border: '3px solid', borderRadius: '5px' }}>
        <Col>
          {foodItems.map((foodItem) => (
            <Card className="my-3" key={foodItem.id}>
              <Card.Header>{foodItem.name}</Card.Header>
              <Card.Body>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Card.Title>{foodItem.name}</Card.Title>
                  <StarButton
                    item={foodItem.id}
                    isStarred={starredItems[foodItem.id] || false}
                    onToggle={toggleStar}
                  />
                </div>
                <Card.Text>{foodItem.description}</Card.Text>
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
