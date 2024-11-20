'use client';

import { useState } from 'react';
import { Container, Card, Col, Button } from 'react-bootstrap';
import { StarFill, Star } from 'react-bootstrap-icons';
import { useSession } from 'next-auth/react';

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

  return (
    <Container className="my-5">
      <h1 className="p-4">Popular Food Choices at UH Manoa</h1>
      <div className="overflow-auto" style={{ maxHeight: '500px', border: '3px solid', borderRadius: '5px' }}>
        <Col>
          <Card className="my-3">
            <Card.Header>Food Item 1</Card.Header>
            <Card.Body>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Card.Title>Food Item 1</Card.Title>
                <Button
                  variant="link"
                  onClick={() => toggleStar('item1')}
                  style={{ color: starredItems.item1 ? 'gold' : 'gray' }}
                >
                  {starredItems.item1 ? <StarFill /> : <Star />}
                </Button>
              </div>
              <Card.Text>Food Item 1 Description</Card.Text>
              {session && <Card.Text>Additional Info for Food Item 1</Card.Text>}
            </Card.Body>
          </Card>
          <Card className="my-3">
            <Card.Header>Food Item 2</Card.Header>
            <Card.Body>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Card.Title>Food Item 2</Card.Title>
                <Button
                  variant="link"
                  onClick={() => toggleStar('item2')}
                  style={{ color: starredItems.item2 ? 'gold' : 'gray' }}
                >
                  {starredItems.item2 ? <StarFill /> : <Star />}
                </Button>
              </div>
              <Card.Text>Food Item 2 Description</Card.Text>
              {session && <Card.Text>Additional Info for Food Item 2</Card.Text>}
            </Card.Body>
          </Card>
          <Card className="my-3">
            <Card.Header>Food Item 3</Card.Header>
            <Card.Body>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Card.Title>Food Item 3</Card.Title>
                <Button
                  variant="link"
                  onClick={() => toggleStar('item3')}
                  style={{ color: starredItems.item3 ? 'gold' : 'gray' }}
                >
                  {starredItems.item3 ? <StarFill /> : <Star />}
                </Button>
              </div>
              <Card.Text>Food Item 3 Description</Card.Text>
              {currentUser && <Card.Text>Additional Info for Food Item 3</Card.Text>}
            </Card.Body>
          </Card>
          <Card className="my-3">
            <Card.Header>Food Item 4</Card.Header>
            <Card.Body>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Card.Title>Food Item 4</Card.Title>
                <Button
                  variant="link"
                  onClick={() => toggleStar('item3')}
                  style={{ color: starredItems.item3 ? 'gold' : 'gray' }}
                >
                  {starredItems.item3 ? <StarFill /> : <Star />}
                </Button>
              </div>
              <Card.Text>Food Item 4 Description</Card.Text>
              {currentUser && <Card.Text>Additional Info for Food Item 4</Card.Text>}
            </Card.Body>
          </Card>
        </Col>
      </div>
    </Container>
  );
};

export default CampusCravings;
