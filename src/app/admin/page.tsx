import { prisma } from '@/lib/prisma';
import { Container, Row, Col, Table } from 'react-bootstrap';
import { getServerSession } from 'next-auth';
import { adminProtectedPage } from '@/lib/page-protection';
import authOptions from '@/lib/authOptions';
import AdminFoodList from '@/components/AdminFoodList';

import './admin.css';

const AdminPage = async () => {
  const session = await getServerSession(authOptions);
  adminProtectedPage(session as { user: { email: string; id: string; randomKey: string } } | null);

  // Fetching data from the database
  const users = await prisma.user.findMany({});
  const foods = await prisma.foodTable.findMany({});
  const locations = Object.values({
    CAMPUS_CENTER: 'CAMPUS_CENTER',
    GATEWAY: 'GATEWAY',
    HALE_ALOHA: 'HALE_ALOHA',
  });

  return (
    <main>
      <Container id="list" fluid className="py-3">
        <Row className="data-row">
          <Col>
            <h1>Locations Supported</h1>
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>Locations</th>
                </tr>
              </thead>
              <tbody>
                {locations.map((location) => (
                  <tr key={location}>
                    <td>{location}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Col>
        </Row>
        <Row className="data-row">
          <Col>
            <h1>Food Information</h1>
            <AdminFoodList foods={foods} />
          </Col>
        </Row>
        <Row className="data-row">
          <Col>
            <h1>Users</h1>
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Role</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.email}</td>
                    <td>{user.role}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Col>
        </Row>
      </Container>
    </main>
  );
};

export default AdminPage;
