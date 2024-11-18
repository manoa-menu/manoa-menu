import { getServerSession } from 'next-auth';
import { Container } from 'react-bootstrap';
// import { prisma } from '@/lib/prisma';
import { adminProtectedPage } from '@/lib/page-protection';
import authOptions from '@/lib/authOptions';

const AdminPage = async () => {
  const session = await getServerSession(authOptions);
  adminProtectedPage(
    session as {
      user: { email: string; id: string; randomKey: string };
    } | null,
  );
  // const users = await prisma.user.findMany({});

  return (
    <main>
      <Container id="list" fluid className="py-3">
        <h1>Cool Admin Page Here! :)</h1>
      </Container>
    </main>
  );
};

export default AdminPage;
