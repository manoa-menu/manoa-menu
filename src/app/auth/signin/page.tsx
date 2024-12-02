'use client';

import { signIn } from 'next-auth/react';
import { Button, Card, Col, Container, Form, Row } from 'react-bootstrap';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './signin-style.css';

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
    <main className="main-container">
      <Container>
        <Row className="justify-content-center">
          <Col xs={12} md={6} lg={4}>
            <Card className="card-custom">
              <Card.Body>
                <div className="text-center mb-4">
                  <div className="icon-container">
                    <i className="bi bi-person-fill fs-4" />
                  </div>
                  <h2 className="mt-2">Sign In</h2>
                </div>
                <Form method="post" onSubmit={handleSubmit}>
                  <Form.Group controlId="formBasicEmail" className="mb-3">
                    <div className="input-group">
                      <span className="input-group-text">
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
                    <div className="input-group">
                      <span className="input-group-text">
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
                    className="btn btn-primary w-100"
                  >
                    Login
                    {' '}
                    <i className="bi bi-arrow-right ms-2" />
                  </Button>
                </Form>
              </Card.Body>
              <Card.Footer>
                <span>Don&apos;t have an account? </span>
                <a href="/auth/signup">Sign Up</a>
              </Card.Footer>
            </Card>
          </Col>
        </Row>
      </Container>
    </main>
  );
};

export default SignIn;
