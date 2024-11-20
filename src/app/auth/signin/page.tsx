'use client';

import { signIn } from 'next-auth/react';
import { Button, Card, Col, Container, Form, Row } from 'react-bootstrap';

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
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col xs={12} md={6} lg={4}>
            <h1 className="text-center mb-4">Sign In</h1>
            <Card className="shadow-sm border-0 rounded">
              <Card.Body className="p-4">
                <Form method="post" onSubmit={handleSubmit}>
                  <Form.Group controlId="formBasicEmail" className="mb-3">
                    <Form.Label>Email</Form.Label>
                    <input name="email" type="text" className="form-control" placeholder="Enter your email" />
                  </Form.Group>
                  <Form.Group controlId="formBasicPassword" className="mb-3">
                    <Form.Label>Password</Form.Label>
                    <input
                      name="password"
                      type="password"
                      className="form-control"
                      placeholder="Enter your password"
                    />
                  </Form.Group>
                  <Button type="submit" className="w-100 btn-primary mt-3">
                    Sign In
                  </Button>
                </Form>
              </Card.Body>
              <Card.Footer className="text-center bg-light">
                <span>Don&apos;t have an account? </span>
                <a href="/auth/signup" className="text-primary text-decoration-none fw-bold">
                  Sign up
                </a>
              </Card.Footer>
            </Card>
          </Col>
        </Row>
      </Container>
    </main>
  );
};

export default SignIn;
