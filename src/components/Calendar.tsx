'use client';

import { useState } from 'react';
import { Card, Col, Container, ListGroup, Row, Modal } from 'react-bootstrap';
import './calendar.css';

const daysOfTheWeek: string[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const Calendar = ({ weeklyItems }: { weeklyItems: string[][] }) => {
  const [show, setShow] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const handleClose = () => setShow(false);
  const handleShow = (dayIndex: number) => {
    setSelectedDay(dayIndex);
    setShow(true);
  };

  return (
    <Container>
      <Row>
        {daysOfTheWeek.map((dayTitle, dayIndex) => (
          <Col key={daysOfTheWeek[dayIndex]}>
            <Card className="calendar-card" onClick={() => handleShow(dayIndex)}>
              <Card.Header style={{ fontWeight: 'bold', fontSize: '18px' }}>{dayTitle}</Card.Header>
              <Card.Body className="calendar-scroll p-0">
                <ListGroup className="list-group-flush d-flex flex-column h-100">
                  {weeklyItems[dayIndex]
                    .filter((item) => item !== '')
                    .map((foodInDay, index, array) => (
                      <ListGroup.Item
                        key={foodInDay}
                        className={`
                          ${index % 2 === 0 ? 'backg-light' : 'backg-dark'}
                          ${index === array.length - 1 ? 'flex-fill' : ''}
                          `}
                      >
                        {foodInDay}
                      </ListGroup.Item>
                    ))}
                </ListGroup>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Modal dialogClassName="modal-custom" show={show} onHide={handleClose} top>
        {selectedDay !== null && (
          <Card className="calendar-card-expanded">
            <Card.Header style={{ fontWeight: 'bold', fontSize: '18px' }}>{daysOfTheWeek[selectedDay]}</Card.Header>
            <Card.Body className="calendar-scroll p-0">
              <ListGroup className="list-group-flush d-flex flex-column h-100">
                {weeklyItems[selectedDay]
                  .filter((item) => item !== '')
                  .map((foodInDay, index, array) => (
                    <ListGroup.Item
                      key={foodInDay}
                      className={`
                          ${index % 2 === 0 ? 'backg-light' : 'backg-dark'}
                          ${index === array.length - 1 ? 'flex-fill' : ''}
                          `}
                    >
                      {foodInDay}
                    </ListGroup.Item>
                  ))}
              </ListGroup>
            </Card.Body>
          </Card>
        )}
      </Modal>
    </Container>
  );
};

export default Calendar;
