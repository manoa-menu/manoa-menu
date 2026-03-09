import { Col, Container, Row } from 'react-bootstrap';
import { FaGithub } from 'react-icons/fa';

/** The Footer appears at the bottom of every page. Rendered by the App Layout component. */
const Footer = () => (
  <footer className="mt-auto py-5 bg-dark text-light">
    <Container>
      <Row className="align-items-center justify-content-center text-center">
        {/* GitHub link */}
        <Col md={4} className="mb-3 mb-md-0">
          <h5 style={{ color: '#1ea468' }}>Source Code</h5>
          <a
            className="text-light text-decoration-none"
            href="https://github.com/manoa-menu/manoa-menu"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FaGithub size={22} />
            <span className="ms-2">GitHub Repo</span>
          </a>
        </Col>

        {/* Team info */}
        <Col md={4} className="mb-3 mb-md-0">
          <p className="mb-1">
            Rebuilt and maintained by Justin Sumiye
          </p>
        </Col>

        {/* Documentation */}
        <Col md={4}>
          <h5 style={{ color: '#1ea468' }}>Resources</h5>
          <a
            className="text-light text-decoration-none"
            href="https://github.com/manoa-menu/manoa-menu/blob/main/README.md"
            target="_blank"
            rel="noopener noreferrer"
          >
            Documentation
          </a>
        </Col>
      </Row>
    </Container>
  </footer>
);

export default Footer;
