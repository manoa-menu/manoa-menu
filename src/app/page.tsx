'use client';

import { Col, Container, Row, Card } from 'react-bootstrap';
import { BsTranslate } from 'react-icons/bs';
import { FaMapMarkedAlt, FaChartLine, FaStar } from 'react-icons/fa';
import { AiOutlineLike } from 'react-icons/ai';
import { RiDashboardFill } from 'react-icons/ri';

import './landingpage.css';

/** The Home page. */
const Home = () => (
  <main>
    <div>
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

      <Container className="language-content" fluid>
        <h2 id="features-title"><span>Features</span></h2>
        <Row className="container d-flex justify-content-center flex-wrap">
          <Col className="col-12 col-sm-6 col-md-6 col-lg-4 mb-3">
            <Card className="language-card">
              <BsTranslate className="mb-1" style={{ width: 48, height: 48, color: '#1ea468' }} />
              <h3 className="my-2">Multiligual Options</h3>
              <p>View UHM&apos;s menus in English or Japanese, with Korean, Chinese, and Spanish coming soon!</p>
            </Card>
          </Col>
          <Col className="col-12 col-sm-6 col-md-6 col-lg-4 mb-3">
            <Card className="language-card">
              <FaMapMarkedAlt className="mb-1" style={{ width: 48, height: 48, color: '#1ea468' }} />
              <h3 className="my-2">Find Food</h3>
              <p>Find dining locations on campus with an interactive map.</p>
            </Card>
          </Col>
          <Col className="col-12 col-sm-6 col-md-6 col-lg-4 mb-3">
            <Card className="language-card">
              <FaChartLine className="mb-1" style={{ width: 48, height: 48, color: '#1ea468' }} />
              <h3 className="my-2">See what&apos;s popular</h3>
              <p>See what foods are currently popular on campus.</p>
            </Card>
          </Col>
          <Col className="col-12 col-sm-6 col-md-6 col-lg-4 mb-3">
            <Card className="language-card">
              <AiOutlineLike className="mb-1" style={{ width: 48, height: 48, color: '#1ea468' }} />
              <h3 className="my-2">Recommendations</h3>
              <p>See a curated list of recommended foods based on your favorites!</p>
            </Card>
          </Col>
          <Col className="col-12 col-sm-6 col-md-6 col-lg-4 mb-3">
            <Card className="language-card">
              <FaStar className="mb-1" style={{ width: 48, height: 48, color: '#1ea468' }} />
              <h3 className="my-2">Favorite Items</h3>
              <p>Easily manage and view your favorite menu items.</p>
            </Card>
          </Col>
          <Col className="col-12 col-sm-6 col-md-6 col-lg-4 mb-3">
            <Card className="language-card">
              <RiDashboardFill className="mb-1" style={{ width: 48, height: 48, color: '#1ea468' }} />
              <h3 className="my-2">Dashboard Page</h3>
              <p>Quickly check if your favorite items are on the menu.</p>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  </main>
);

export default Home;
