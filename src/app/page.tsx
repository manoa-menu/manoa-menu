'use client';

import { Col, Container, Row, Carousel, Image } from 'react-bootstrap';
import './landingpage.css';

/** The Home page. */
const Home = () => (
  <main>
    {/* Title Section */}
    <Container id="title" fluid className="section-container py-5">
      <Row>
        <Col>
          <h1 className="text-center mt-5"><span>Manoa Menu</span></h1>
          <h5 className="title-subheader">
            <span>Menu Translations for International Students at UH Manoa</span>
          </h5>
        </Col>
      </Row>
    </Container>
    <Container id="landing-page-translation" fluid className="section-container py-5">
      <Row className="align-items-center">
        <Col xs={8} className="d-flex flex-column justify-content-center">
          <h2><span>Choose a language</span></h2>
          <p className="header-description">Translate a menu item from a UH eatery</p>
        </Col>
        <Col xs={4}>
          <Col xs={12} className="currency-container">
            <Row className="scrolling-banner">
              <Col xs="auto" className="currency-item">
                <Image
                  src="https://cdn.prod.website-files.com/6034c69970fc1de43a4bcbc0/656a0b222e79ee994e012ca7_England.png"
                  alt="English Flag"
                  className="currency-flag"
                />
                <h3>English</h3>
              </Col>
              <Col xs="auto" className="currency-item">
                <Image
                  src="https://cdn.prod.website-files.com/6034c69970fc1de43a4bcbc0/656a0b259f872fdcb8a7c3af_Spain.png"
                  alt="Spanish Flag"
                  className="currency-flag"
                />
                <h3>Spanish</h3>
              </Col>
              <Col xs="auto" className="currency-item">
                <Image
                  src="https://cdn.prod.website-files.com/6034c69970fc1de43a4bcbc0/656a0b236291951495107905_France.png"
                  alt="French Flag"
                  className="currency-flag"
                />
                <h3>French</h3>
              </Col>
              <Col xs="auto" className="currency-item">
                <Image
                  src="https://cdn.prod.website-files.com/6034c69970fc1de43a4bcbc0/656a0b23776b00b1f125bf55_Germany.png"
                  alt="German Flag"
                  className="currency-flag"
                />
                <h3>German</h3>
              </Col>
              <Col xs="auto" className="currency-item">
                <Image
                  src="https://cdn.prod.website-files.com/6034c69970fc1de43a4bcbc0/656a0b2501d250a3c9d51dc8_Russia.png"
                  alt="Russian Flag"
                  className="currency-flag"
                />
                <h3>Russian</h3>
              </Col>

              {/* Duplicate the items for infinite scrolling effect, starting from second flag */}
              <Col xs="auto" className="currency-item">
                <Image
                  src="https://cdn.prod.website-files.com/6034c69970fc1de43a4bcbc0/656a0b259f872fdcb8a7c3af_Spain.png"
                  alt="Spanish Flag"
                  className="currency-flag"
                />
                <h3>Spanish</h3>
              </Col>
              <Col xs="auto" className="currency-item">
                <Image
                  src="https://cdn.prod.website-files.com/6034c69970fc1de43a4bcbc0/656a0b236291951495107905_France.png"
                  alt="French Flag"
                  className="currency-flag"
                />
                <h3>French</h3>
              </Col>
              <Col xs="auto" className="currency-item">
                <Image
                  src="https://cdn.prod.website-files.com/6034c69970fc1de43a4bcbc0/656a0b23776b00b1f125bf55_Germany.png"
                  alt="German Flag"
                  className="currency-flag"
                />
                <h3>German</h3>
              </Col>
              <Col xs="auto" className="currency-item">
                <Image
                  src="https://cdn.prod.website-files.com/6034c69970fc1de43a4bcbc0/656a0b2501d250a3c9d51dc8_Russia.png"
                  alt="Russian Flag"
                  className="currency-flag"
                />
                <h3>Russian</h3>
              </Col>
            </Row>
          </Col>
        </Col>
      </Row>
    </Container>

    {/* Currency Section */}
    <Container id="landing-page-currency" fluid className="section-container py-5">
      <Row className="align-items-center">
        <Col xs={4}>
          <Col xs={12} className="currency-container">
            <Row className="scrolling-banner">
              <Col xs="auto" className="currency-item">
                <h3>U.S. dollar</h3>
                <h3>USD</h3>
              </Col>
              <Col xs="auto" className="currency-item">
                <h3>Pound sterling</h3>
                <h3>GBP</h3>
              </Col>
              <Col xs="auto" className="currency-item">
                <h3>Australian dollar</h3>
                <h3>AUD</h3>
              </Col>
              <Col xs="auto" className="currency-item">
                <h3>Swedish krona</h3>
                <h3>SEK</h3>
              </Col>
              <Col xs="auto" className="currency-item">
                <h3>Norwegian krone</h3>
                <h3>NOK</h3>
              </Col>
              <Col xs="auto" className="currency-item">
                <h3>Mexican peso</h3>
                <h3>MXN</h3>
              </Col>
              <Col xs="auto" className="currency-item">
                <h3>Hungarian forint</h3>
                <h3>HUF</h3>
              </Col>
              <Col xs="auto" className="currency-item">
                <h3>Euro</h3>
                <h3>EUR</h3>
              </Col>
              <Col xs="auto" className="currency-item">
                <h3>Canadian dollar</h3>
                <h3>CAD</h3>
              </Col>
              <Col xs="auto" className="currency-item">
                <h3>Swiss franc</h3>
                <h3>CHF</h3>
              </Col>
              <Col xs="auto" className="currency-item">
                <h3>Singapore dollar</h3>
                <h3>SGD</h3>
              </Col>
              <Col xs="auto" className="currency-item">
                <h3>New Zealand dollar</h3>
                <h3>NZD</h3>
              </Col>
              <Col xs="auto" className="currency-item">
                <h3>Japanese yen</h3>
                <h3>JPY</h3>
              </Col>

              {/* Duplicate the items for infinite scrolling effect, starting from second flag */}
              <Col xs="auto" className="currency-item">
                <h3>U.S. dollar</h3>
                <h3>USD</h3>
              </Col>
              <Col xs="auto" className="currency-item">
                <h3>Pound sterling</h3>
                <h3>GBP</h3>
              </Col>
              <Col xs="auto" className="currency-item">
                <h3>Australian dollar</h3>
                <h3>AUD</h3>
              </Col>
              <Col xs="auto" className="currency-item">
                <h3>Swedish krona</h3>
                <h3>SEK</h3>
              </Col>
              <Col xs="auto" className="currency-item">
                <h3>Norwegian krone</h3>
                <h3>NOK</h3>
              </Col>
              <Col xs="auto" className="currency-item">
                <h3>Mexican peso</h3>
                <h3>MXN</h3>
              </Col>
              <Col xs="auto" className="currency-item">
                <h3>Hungarian forint</h3>
                <h3>HUF</h3>
              </Col>
              <Col xs="auto" className="currency-item">
                <h3>Euro</h3>
                <h3>EUR</h3>
              </Col>
              <Col xs="auto" className="currency-item">
                <h3>Canadian dollar</h3>
                <h3>CAD</h3>
              </Col>
              <Col xs="auto" className="currency-item">
                <h3>Swiss franc</h3>
                <h3>CHF</h3>
              </Col>
              <Col xs="auto" className="currency-item">
                <h3>Singapore dollar</h3>
                <h3>SGD</h3>
              </Col>
              <Col xs="auto" className="currency-item">
                <h3>New Zealand dollar</h3>
                <h3>NZD</h3>
              </Col>
              <Col xs="auto" className="currency-item">
                <h3>Japanese yen</h3>
                <h3>JPY</h3>
              </Col>
            </Row>
          </Col>
        </Col>
        <Col xs={8} md={6} className="d-flex flex-column justify-content-center ms-auto">
          <h2><span>Pick a currency</span></h2>
          <p className="header-description">Have a currency to display alongside the dollar value of an item</p>
        </Col>
      </Row>
    </Container>

    {/* Get Started Section with Carousel */}
    <Container id="get-started" fluid className="section-container py-5">
      <Row>
        <Col className="text-center">
          <h1 className="mt-5"><span>Get Started</span></h1>
          <p>See what we currently have to offer and what we&apos;re working on</p>
        </Col>
      </Row>
      <Row className="justify-content-center">
        <Col xs={12} md={8} className="carousel-container">
          <Carousel id="carouselExampleIndicators" controls indicators interval={3000}>
            <Carousel.Item>
              <Image
                className="d-block w-100"
                src="https://via.placeholder.com/800x400?text=First+slide"
                alt="First slide"
              />
            </Carousel.Item>
            <Carousel.Item>
              <Image
                className="d-block w-100"
                src="https://via.placeholder.com/800x400?text=Second+slide"
                alt="Second slide"
              />
            </Carousel.Item>
            <Carousel.Item>
              <Image
                className="d-block w-100"
                src="https://via.placeholder.com/800x400?text=Third+slide"
                alt="Third slide"
              />
            </Carousel.Item>
          </Carousel>
        </Col>
      </Row>
    </Container>
  </main>
);

export default Home;
