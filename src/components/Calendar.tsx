'use client';

import { Card, Col, Container, Row } from 'react-bootstrap';
import './calendar.css';

const daysOfTheWeek: string[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const Calendar = ({ weeklyItems }: { weeklyItems: string[][] }) => (
  <Container fluid>
    <Row>
      {daysOfTheWeek.map((dayTitle, dayIndex) => (
        <Col>
          <Card>
            <Card.Header style={{ fontWeight: 'bold', fontSize: '18px' }}>{dayTitle}</Card.Header>
            <Card.Body className="calendar-scroll">
              {weeklyItems[dayIndex]
                .filter((item) => item !== '')
                .map((foodInDay, index, arr) => (
                  <div className={index < arr.length - 1 ? 'mb-3' : ''}>{foodInDay}</div>
                ))}
            </Card.Body>
          </Card>
        </Col>
      ))}
    </Row>
  </Container>
);

export default Calendar;
