import { Col, Container, Row } from 'react-bootstrap';
import { FaGithub, FaEnvelope } from 'react-icons/fa';

/** The Footer appears at the bottom of every page. Rendered by the App Layout component. */
const Footer = () => (
  <footer className="mt-auto py-5 bg-dark text-light">
    <Container>
      <Row className="align-items-center">
        {/* Left section with logo and GitHub links */}
        <Col md={4} className="d-flex flex-column align-items-center">
          <h4 className="text-center mb-3" style={{ color: '#1ea468' }}>Follow Us</h4>
          <Row className="d-flex align-items-center">
            <Col className="ps-1">
              <a
                className="text-light text-decoration-none d-block mb-3"
                href="https://github.com/manoa-menu/manoa-menu"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaGithub size={24} />
                <span className="ms-2">GitHub Repo</span>
              </a>
              <a
                className="text-light text-decoration-none"
                href="https://github.com/manoa-menu"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaGithub size={24} />
                <span className="ms-2">GitHub Organization</span>
              </a>
            </Col>
          </Row>
        </Col>

        {/* Center section with team info */}
        <Col md={4} className="text-center my-3 my-md-0">
          <p>
            Maintained by
            <br />
            <strong>Brendan Kuwabara, Adam Graham, Eric Kim, Dat Truong, and Justin Sumiye</strong>
            <br />
            University of Hawaii at Manoa
          </p>
          <a
            className="text-light text-decoration-none"
            href="https://manoa-menu.github.io/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Documentation
          </a>
        </Col>

        {/* Right section with support and contact */}
        <Col md={4} className="text-center">
          <h4 style={{ color: '#1ea468' }}>Here to Help</h4>
          <p>If you run into any issues, we&apos;re here to make your experience smoother.</p>
          <a
            className="text-light text-decoration-none"
            href="https://forms.gle/9PpZQAKeNpWkX4NNA"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FaEnvelope size={19} />
            <span className="ms-2">Contact Us</span>
          </a>
        </Col>
      </Row>
      <hr className="border-light" />
      <Row className="text-center mt-3">
        <Col>
          <small>
            ©
            {new Date().getFullYear()}
            <span className="ms-1">All Rights Reserved.</span>
          </small>
        </Col>
      </Row>
    </Container>
  </footer>
);

export default Footer;
