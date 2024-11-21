'use client';

import { Col, Container, Row } from 'react-bootstrap';
import './landingpage.css';

/** The Home page. */
const Home = () => (
  <main>
    {/* Title Section */}
    <Container fluid className="title-container">
      <Row>
        <Col>
          <h1 className="title"><span>Manoa Menu</span></h1>
          <hr id="title-border" />
          <h5 className="title-subheader">
            <span>Menu Translations for International Students at the University of Hawaiʻi at Mānoa</span>
          </h5>
        </Col>
      </Row>
    </Container>

    {/* Language Section */}
    <Container fluid className="language-container">
      <Row>
        <Col>
          <h2 className="language-title"><span>Choose a language</span></h2>
          <p className="language-subheader"><span>Translate menu items from a UH eatery</span></p>
        </Col>
      </Row>
    </Container>

    {/* Currency Section */}
    <Container fluid className="currency-container">
      <Row>
        <Col>
          <h2 className="currency-title"><span>Choose a currency</span></h2>
          <p className="currency-subheader"><span>Have a currency display alongside the dollar value</span></p>
        </Col>
      </Row>
    </Container>
  </main>
);

export default Home;
