'use client';

import { useState } from 'react';
import { Card, Col, Container, ListGroup, Row, Modal } from 'react-bootstrap';
import { XLg } from 'react-bootstrap-icons';
import StarButton from '@/app/campus-cravings/StarButton';
import './calendar.css';

const daysOfTheWeek: string[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const daysofTheWeekJP: string[] = ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'];

const Calendar = ({
  weeklyItems,
  userFavoriteItems,
  onToggle,
  language,
}: {
  weeklyItems: string[][];
  userFavoriteItems: string[];
  onToggle: (item: string) => void;
  language: string;
}) => {
  const [show, setShow] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const handleClose = () => setShow(false);
  const handleShow = (dayIndex: number) => {
    setSelectedDay(dayIndex);
    setShow(true);
  };
  const daysToDisplay = language === 'English' ? daysOfTheWeek : daysofTheWeekJP;
  return (
    <Container>
      <Row>
        {daysToDisplay.map((dayTitle, dayIndex) => (
          <Col key={daysToDisplay[dayIndex]}>
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

      <Modal dialogClassName="modal-custom" show={show} onHide={handleClose} centered>
        {selectedDay !== null && (
          <Card className="calendar-card-expanded">
            <Card.Header className="d-flex justify-content-between" style={{ fontWeight: 'bold', fontSize: '18px' }}>
              {daysToDisplay[selectedDay]}
              <XLg className="pt-2" onClick={handleClose} />
            </Card.Header>
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
                      <Container>
                        <Row>
                          {foodInDay}
                          <Col className="star-button">
                            <StarButton
                              item={foodInDay}
                              isStarred={userFavoriteItems.includes(foodInDay)}
                              onToggle={onToggle}
                            />
                          </Col>
                        </Row>
                      </Container>
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
