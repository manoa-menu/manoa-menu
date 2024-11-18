'use client';

import { Container, Row } from 'react-bootstrap';
import Calendar from '@/components/Calendar';
import FoodItem from '@/components/FoodItem';

const DashboardPage = () => (
  <Container>
    <Row className="py-4 my-4">
      <Calendar />
    </Row>
    <Row>
      <h1>Recommended:</h1>
      <FoodItem
        name="Chicken Sandwich"
        picture="/images/gettyimages-1442136071-612x612.jpg"
        label={['Chicken', 'Sandwich']}
      />
      <FoodItem name="Loco Moco" picture="/images/gettyimages-1386914868-612x612.jpg" label={['Beef', 'Rice', 'Egg']} />
    </Row>
  </Container>
);

export default DashboardPage;
