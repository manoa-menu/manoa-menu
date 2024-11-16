import { Col, Container, Row } from 'react-bootstrap';

/** The Home page. */
const Home = () => (
  <main>
    <Container id="landing-page" fluid className="py-3">
      <Row className="align-middle">
        <Col xs={8} className="d-flex flex-column justify-content-center">
          <h1>On-demand menu translations</h1>
          <p>Translate any menu item and select any currency you want</p>
        </Col>
      </Row>
    </Container>
  </main>
);

export default Home;
