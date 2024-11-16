import { Col, Container, Row, Image } from 'react-bootstrap';

/** The Footer appears at the bottom of every page. Rendered by the App Layout component. */
const Footer = () => (
  <footer className="mt-auto py-3 bg-light">
    <Container>
      <Row>
        <Col className="text-center">
          <hr />
          <Image src="manoa-menu-logo.jpg" alt="Manoa Menu Logo" width="100px" />
        </Col>
        <Col className="text-center">
          <hr />
          Maintained by
          <br />
          Brendan Kuwabara, Adam Graham, Eric Kim, Dat Truong, and Justin Sumiye
          <br />
          University of Hawaii at Manoa
          <br />
          Honolulu, HI 96822
          <br />
          <a href="https://manoa-menu.github.io/">Documentation</a>
        </Col>
        <Col className="text-center">
          <hr />
          <h5>Here to help</h5>
          <p>If you run into any issues, were here to help make the experience smoother</p>
          <a href="https://forms.gle/9PpZQAKeNpWkX4NNA">Contact Us</a>
          <br />
        </Col>
      </Row>
    </Container>
  </footer>
);

export default Footer;
