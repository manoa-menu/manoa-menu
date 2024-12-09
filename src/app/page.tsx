'use client';

import { Col, Container, Row, Card } from 'react-bootstrap';

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
            <span id="subheader-styling">
              Menu Translations for International Students at the University of Hawaiʻi at Mānoa
            </span>
          </h5>
        </Col>
      </Row>
    </Container>

    <Container className="language-content">
      <h2 id="features-title"><span>Features</span></h2>
      <Row>
        <Col>
          <Card className="language-card">
            <h5>Choose a language</h5>
            <p>Choose from English, Japanese, Korean, or Spanish</p>
          </Card>
        </Col>
        <Col>
          <Card className="language-card">
            <h5>Favorite an item</h5>
            <p>Favorite items to save for later</p>
          </Card>
        </Col>
        <Col>
          <Card className="language-card">
            <h5>Recommended feed</h5>
            <p>See a curated list of recommended foods</p>
          </Card>
        </Col>
        <Col>
          <Card className="language-card">
            <h5>See what&apos;s popular</h5>
            <p>See what foods are currently popular on campus</p>
          </Card>
        </Col>
      </Row>
    </Container>
  </main>
);

export default Home;
