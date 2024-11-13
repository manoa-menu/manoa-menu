import { Col, Container, Row, Image } from 'react-bootstrap';

/** The Footer appears at the bottom of every page. Rendered by the App Layout component. */
const Footer = () => (
  <footer className="mt-auto py-3 bg-light">
    <Container>
      <Row>
        <Col className="text-center">
          <Image src="" alt="Manoa Menu Logo goes here along with other stuff" width="150px" />
        </Col>
        <Col className="text-center">
          Made with ♥ by Brendan Kuwabara, Adam Graham, Eric Kim, Dat Truong, and Justin Sumiye
          <br />
          University of Hawaii at Manoa
          <br />
          Honolulu, HI 96822
          <br />
          <a href="https://manoa-menu.github.io/">Documentation</a>
        </Col>
        <Col className="text-center mt-5">
          <a href="https://forms.gle/9PpZQAKeNpWkX4NNA">Contact Us</a>
          <br />
        </Col>
      </Row>
    </Container>
  </footer>
);

export default Footer;
