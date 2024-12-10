'use client';

import { signOut } from 'next-auth/react';
import { Button, Col, Row, Container } from 'react-bootstrap';
import './signout-style.css';

/** After the user clicks the "SignOut" link in the NavBar, log them out and display this page. */
const SignOut = () => (
  <Container id="signout-container" className="d-flex align-items-center justify-content-center">
    <Col id="signout-page" className="text-center p-5 rounded-shadow">
      <h2 className="mb-4">Do you want to sign out?</h2>
      <Row className="justify-content-center">
        <Col xs="auto">
          <Button
            variant="danger"
            className="me-3 btn-large"
            onClick={() => signOut({ callbackUrl: '/', redirect: true })}
          >
            Sign Out
          </Button>
        </Col>

        <Col xs="auto">
          <Button
            variant="secondary"
            className="btn-large"
            href="/"
          >
            Cancel
          </Button>
        </Col>
      </Row>
    </Col>
  </Container>
);

export default SignOut;
