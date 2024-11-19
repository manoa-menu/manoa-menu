/* eslint-disable react/jsx-indent, @typescript-eslint/indent */

'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { Container, Card, Col } from 'react-bootstrap';

const CampusCravings: React.FC = () => {
  const { data: session } = useSession();
  const currentUser = session?.user?.email;

  return (
    <Container className="my-5">
      <h1>Popular Food Choices at UH Manoa</h1>
      <div className="overflow-auto" style={{ maxHeight: '500px', border: '3px solid', borderRadius: '5px' }}>
        <Col>
          <Card className="my-3">
            <Card.Header>Food Item 1</Card.Header>
            <Card.Body>
              <Card.Title>Food Item 1</Card.Title>
              <Card.Text>Food Item 1 Description</Card.Text>
              {session && <Card.Text>Additional Info for Food Item 1</Card.Text>}
            </Card.Body>
          </Card>
          <Card className="my-3">
            <Card.Header>Food Item 2</Card.Header>
            <Card.Body>
              <Card.Title>Food Item 2</Card.Title>
              <Card.Text>Food Item 2 Description</Card.Text>
              {session && <Card.Text>Additional Info for Food Item 2</Card.Text>}
            </Card.Body>
          </Card>
          <Card className="my-3">
            <Card.Header>Food Item 3</Card.Header>
            <Card.Body>
              <Card.Title>Food Item 3</Card.Title>
              <Card.Text>Food Item 3 Description</Card.Text>
              {currentUser && <Card.Text>Additional Info for Food Item 3</Card.Text>}
            </Card.Body>
          </Card>
        </Col>
      </div>
    </Container>
  );
};
export default CampusCravings;
