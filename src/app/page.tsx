'use client';

import { Col, Container, Row, Image } from 'react-bootstrap';
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
      <Container className="logo-slider-language">
        <Container>
          <Image
            src="https://cdn.prod.website-files.com/6034c69970fc1de43a4bcbc0/656a0b222e79ee994e012ca7_England.png"
          />
          <Image
            src="https://cdn.prod.website-files.com/6034c69970fc1de43a4bcbc0/656a0b259f872fdcb8a7c3af_Spain.png"
          />
          <Image
            src="https://cdn.prod.website-files.com/6034c69970fc1de43a4bcbc0/656a0b236291951495107905_France.png"
          />
          <Image
            src="https://cdn.prod.website-files.com/6034c69970fc1de43a4bcbc0/656a0b23776b00b1f125bf55_Germany.png"
          />
          <Image
            src="https://cdn.prod.website-files.com/6034c69970fc1de43a4bcbc0/656a0c4b149588661b4440e4_Flags.png"
          />
          <Image
            src="https://cdn.prod.website-files.com/6034c69970fc1de43a4bcbc0/656a0b2219f9c81f54469eeb_Chinese.png"
          />
          <Image
            src="https://cdn.prod.website-files.com/6034c69970fc1de43a4bcbc0/656a0b24f69d4c07c7d88ada_Italian.png"
          />
          <Image
            src="https://cdn.prod.website-files.com/6034c69970fc1de43a4bcbc0/656a0b2380edc120c4301935_Portuguese.png"
          />
        </Container>

        <Container>
          <Image
            src="https://cdn.prod.website-files.com/6034c69970fc1de43a4bcbc0/656a0b222e79ee994e012ca7_England.png"
          />
          <Image
            src="https://cdn.prod.website-files.com/6034c69970fc1de43a4bcbc0/656a0b259f872fdcb8a7c3af_Spain.png"
          />
          <Image
            src="https://cdn.prod.website-files.com/6034c69970fc1de43a4bcbc0/656a0b236291951495107905_France.png"
          />
          <Image
            src="https://cdn.prod.website-files.com/6034c69970fc1de43a4bcbc0/656a0b23776b00b1f125bf55_Germany.png"
          />
          <Image
            src="https://cdn.prod.website-files.com/6034c69970fc1de43a4bcbc0/656a0c4b149588661b4440e4_Flags.png"
          />
          <Image
            src="https://cdn.prod.website-files.com/6034c69970fc1de43a4bcbc0/656a0b2219f9c81f54469eeb_Chinese.png"
          />
          <Image
            src="https://cdn.prod.website-files.com/6034c69970fc1de43a4bcbc0/656a0b24f69d4c07c7d88ada_Italian.png"
          />
          <Image
            src="https://cdn.prod.website-files.com/6034c69970fc1de43a4bcbc0/656a0b2380edc120c4301935_Portuguese.png"
          />
        </Container>

        <Container>
          <Image
            src="https://cdn.prod.website-files.com/6034c69970fc1de43a4bcbc0/656a0b222e79ee994e012ca7_England.png"
          />
          <Image
            src="https://cdn.prod.website-files.com/6034c69970fc1de43a4bcbc0/656a0b259f872fdcb8a7c3af_Spain.png"
          />
          <Image
            src="https://cdn.prod.website-files.com/6034c69970fc1de43a4bcbc0/656a0b236291951495107905_France.png"
          />
          <Image
            src="https://cdn.prod.website-files.com/6034c69970fc1de43a4bcbc0/656a0b23776b00b1f125bf55_Germany.png"
          />
          <Image
            src="https://cdn.prod.website-files.com/6034c69970fc1de43a4bcbc0/656a0c4b149588661b4440e4_Flags.png"
          />
          <Image
            src="https://cdn.prod.website-files.com/6034c69970fc1de43a4bcbc0/656a0b2219f9c81f54469eeb_Chinese.png"
          />
          <Image
            src="https://cdn.prod.website-files.com/6034c69970fc1de43a4bcbc0/656a0b24f69d4c07c7d88ada_Italian.png"
          />
          <Image
            src="https://cdn.prod.website-files.com/6034c69970fc1de43a4bcbc0/656a0b2380edc120c4301935_Portuguese.png"
          />
        </Container>
      </Container>
    </Container>

    {/* Currency Section */}
    <Container fluid className="currency-container">
      <Row>
        <Col>
          <h2 className="currency-title"><span>Choose a currency</span></h2>
          <p className="currency-subheader"><span>Have a currency display alongside the dollar value</span></p>
        </Col>
      </Row>
      <Container className="logo-slider-currency">
        <Container>
          <h5 className="currency"><span>USD $</span></h5>
          <h5 className="currency"><span>EUR €</span></h5>
          <h5 className="currency"><span>JPY ¥</span></h5>
          <h5 className="currency"><span>GBP £</span></h5>
          <h5 className="currency"><span>CNY ¥</span></h5>
          <h5 className="currency"><span>AUD $</span></h5>
          <h5 className="currency"><span>CAD $</span></h5>
          <h5 className="currency"><span>CHF Fr</span></h5>
        </Container>

        <Container>
          <h5 className="currency"><span>USD $</span></h5>
          <h5 className="currency"><span>EUR €</span></h5>
          <h5 className="currency"><span>JPY ¥</span></h5>
          <h5 className="currency"><span>GBP £</span></h5>
          <h5 className="currency"><span>CNY ¥</span></h5>
          <h5 className="currency"><span>AUD $</span></h5>
          <h5 className="currency"><span>CAD $</span></h5>
          <h5 className="currency"><span>CHF Fr</span></h5>
        </Container>

        <Container>
          <h5 className="currency"><span>USD $</span></h5>
          <h5 className="currency"><span>EUR €</span></h5>
          <h5 className="currency"><span>JPY ¥</span></h5>
          <h5 className="currency"><span>GBP £</span></h5>
          <h5 className="currency"><span>CNY ¥</span></h5>
          <h5 className="currency"><span>AUD $</span></h5>
          <h5 className="currency"><span>CAD $</span></h5>
          <h5 className="currency"><span>CHF Fr</span></h5>
        </Container>
      </Container>
    </Container>
  </main>
);

export default Home;
