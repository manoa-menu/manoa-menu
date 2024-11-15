'use client';

import { Card, Col, Container, Row } from 'react-bootstrap';

const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const Calendar = () => (
  <Container>
    <Row>
      {daysOfWeek.map((day) => (
        <Col>
          <Card>
            <Card.Header style={{ fontWeight: 'bold', fontSize: '18px' }}>{day}</Card.Header>
            <Card.Body>sample text &nbsp; sample text</Card.Body>
          </Card>
        </Col>
      ))}
    </Row>
  </Container>
);

export default Calendar;
