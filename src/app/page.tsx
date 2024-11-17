import { Col, Container, Row } from 'react-bootstrap';

/** The Home page. */
const Home = () => (
  <main>
    <Container id="landing-page-translation" fluid className="py-5">
      <Row className="align-middle">
        <Col xs={8} className="d-flex flex-column justify-content-center">
          <h2>On-demand menu translations</h2>
          <p>Translate any menu item you want</p>
        </Col>
      </Row>
    </Container>
    <Container id="landing-page-currency" fluid className="py-5">
      <Row className="align-middle">
        <Col xs={8} className="d-flex flex-column justify-content-center ms-auto">
          <h2>Choose any currency</h2>
          <p>Pick a currency to display alongside the dollar value of an item</p>
        </Col>
      </Row>
    </Container>
  </main>
);

export default Home;
