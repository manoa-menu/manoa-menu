'use client';

import { Container, Row } from 'react-bootstrap';
import Calendar from '@/components/Calendar';

const DashboardPage = () => (
  <Container>
    <Row className="py-4 my-4">
      <Calendar />
    </Row>
    <Row>
      <h1>Recommended:</h1>
    </Row>
  </Container>
);

export default DashboardPage;
