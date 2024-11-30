/* eslint-disable max-len */

'use client';

import { Container, Form, Row } from 'react-bootstrap';
import Calendar from '@/components/Calendar';
import FoodItemSlider from '@/components/FoodItemSlider';
import type { FoodItemType } from '@/components/FoodItemSlider';

const testSample: string[][] = [
  [''],
  ['Chicken Alfredo'],
  [''],
  [''],
  ['BBQ Beef Brisket', 'Shrimp Caesar Salad', 'Mini or Bowl: Mochiko Chicken or Roast Pork'],
  [''],
  ['Surf and Turf'],
];

const testFoodItem: FoodItemType[] = [
  {
    name: 'Chicken Sandwich',
    image: '/images/gettyimages-1442136071-612x612.jpg',
    label: ['Chicken', 'Bread'],
  },
  {
    name: 'Chicken Sandwich',
    image: '/images/gettyimages-1442136071-612x612.jpg',
    label: ['Chicken', 'Bread'],
  },
  {
    name: 'Chicken Sandwich',
    image: '/images/gettyimages-1442136071-612x612.jpg',
    label: ['Chicken', 'Bread'],
  },
  {
    name: 'Chicken Sandwich',
    image: '/images/gettyimages-1442136071-612x612.jpg',
    label: ['Chicken', 'Bread'],
  },
  {
    name: 'Loco Moco',
    image: 'https://www.billyparisi.com/wp-content/uploads/2020/03/loco-moco-3-1.jpg',
    label: ['Beef', 'Rice', 'Egg'],
  },
  {
    name: 'Loco Moco',
    image:
      'https://cdn.apartmenttherapy.info/image/upload/f_auto,q_auto:eco,c_fill,g_auto,w_1456,h_1092/k%2FPhoto%2FRecipes%2F2024-03-loco-moco%2Floco-moco-342',
    label: ['Beef', 'Rice', 'Egg'],
  },
  {
    name: 'Loco Moco',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Loco_Moco.jpg/500px-Loco_Moco.jpg',
    label: ['Beef', 'Rice', 'Egg'],
  },

  {
    name: 'Loco Moco',
    image: 'https://i0.wp.com/www.farmgirlgourmet.com/wp-content/uploads/2012/08/DSC_0367.jpg?w=2236&ssl=1',
    label: ['Beef', 'Rice', 'Egg'],
  },
];

const DashboardPage = () => (
  <Container>
    <Row className="mt-4">
      <Container>
        <Form.Select className="d-flex ms-auto" style={{ width: '260px' }}>
          <option>All</option>
          <option>Campus Center Food Court</option>
          <option>Gateway Café</option>
          <option>Hale Aloha Café</option>
        </Form.Select>
      </Container>
    </Row>
    <Row className="py-2 mb-4">
      <Calendar weeklyItems={testSample} />
    </Row>
    <Row>
      <h1>Recommended:</h1>
    </Row>
    <Row>
      <FoodItemSlider foodItem={testFoodItem} />
    </Row>
  </Container>
);

export default DashboardPage;
