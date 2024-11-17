/* eslint-disable react/jsx-indent, @typescript-eslint/indent */

'use client';

import React from 'react';
import { Container, Row, Card, Col } from 'react-bootstrap';

const CampusCravings = () => (
  <Container className="my-5">
    <h1>Popular Food Choices at UH Manoa</h1>
    <Row>
      <Col>
        <Card className="my-3">
          <Card.Header>Food Item 1</Card.Header>
          <Card.Body>
            <Card.Title>Food Item 1</Card.Title>
            <Card.Text>Food Item 1 Description</Card.Text>
          </Card.Body>
        </Card>
        <Card className="my-3">
          <Card.Header>Food Item 2</Card.Header>
          <Card.Body>
            <Card.Title>Food Item 2</Card.Title>
            <Card.Text>Food Item 2 Description</Card.Text>
          </Card.Body>
        </Card>
        <Card className="my-3">
          <Card.Header>Food Item 3</Card.Header>
          <Card.Body>
            <Card.Title>Food Item 3</Card.Title>
            <Card.Text>Food Item 3 Description</Card.Text>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  </Container>
);

export default CampusCravings;
