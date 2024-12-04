import { getServerSession } from 'next-auth';
import { Container, Row, Col } from 'react-bootstrap';
import { prisma } from '@/lib/prisma';
import { User } from '@prisma/client';
import { adminProtectedPage } from '@/lib/page-protection';
import authOptions from '@/lib/authOptions';

const AdminPage = async () => {
  const session = await getServerSession(authOptions);
  adminProtectedPage(
    session as {
      user: { email: string; id: string; randomKey: string };
    } | null,
  );
  const users: User[] = await prisma.user.findMany({});
  return (
    <main>
      <Container id="list" fluid className="py-3">
        <Row xs={1} md={2} lg={3} className="g-4">
          {users.map((user) => (
            <Col key={user.id}>
              <Row>
                <h1>{user.email}</h1>
                <h1>{user.id}</h1>
              </Row>
            </Col>
          ))}
        </Row>
      </Container>
    </main>
  );
};

export default AdminPage;
