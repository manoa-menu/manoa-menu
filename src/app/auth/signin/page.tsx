'use client';

import { signIn } from 'next-auth/react';
import { Button, Card, Col, Container, Form, Row } from 'react-bootstrap';
import 'bootstrap-icons/font/bootstrap-icons.css';

/** The sign in page. */
const SignIn = () => {
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const target = e.target as typeof e.target & {
      email: { value: string };
      password: { value: string };
    };
    const email = target.email.value;
    const password = target.password.value;
    const result = await signIn('credentials', {
      callbackUrl: '/dashboard',
      email,
      password,
    });

    if (result?.error) {
      console.error('Sign in failed: ', result.error);
    }
  };

  return (
    <main>
      <div className="main-container">
        <Container>
          <Row className="w-100 justify-content-center">
            <Col xs={12} md={6} lg={4}>
              <Card className="card-custom">
                <Card.Body className="p-4">
                  <div className="text-center mb-4">
                    <div className="icon-container">
                      <i className="bi bi-person-fill" />
                    </div>
                    <h2 className="mt-2 mb-0">Sign In!</h2>
                  </div>
                  <Form method="post" onSubmit={handleSubmit}>
                    <Form.Group controlId="formBasicEmail" className="mb-3">
                      <Form.Label className="visually-hidden">Email</Form.Label>
                      <div className="input-group">
                        <span className="input-group-text bg-light border-0">
                          <i className="bi bi-envelope" />
                        </span>
                        <input
                          name="email"
                          type="text"
                          className="form-control"
                          placeholder="E-mail"
                        />
                      </div>
                    </Form.Group>
                    <Form.Group controlId="formBasicPassword" className="mb-3">
                      <Form.Label className="visually-hidden">Password</Form.Label>
                      <div className="input-group">
                        <span className="input-group-text bg-light border-0">
                          <i className="bi bi-lock" />
                        </span>
                        <input
                          name="password"
                          type="password"
                          className="form-control"
                          placeholder="Password"
                        />
                      </div>
                    </Form.Group>
                    <Button
                      type="submit"
                      className="w-100 btn-primary mt-3 d-flex align-items-center justify-content-center"
                    >
                      Login
                      {' '}
                      <i className="bi bi-arrow-right ms-2" />
                    </Button>
                  </Form>
                </Card.Body>
                <Card.Footer className="text-center bg-light">
                  <span>Or </span>
                  <a href="/auth/signup" className="text-primary text-decoration-none fw-bold">
                    create a new account
                  </a>
                </Card.Footer>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </main>
  );
};

export default SignIn;
