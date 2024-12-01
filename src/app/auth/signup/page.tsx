'use client';

import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import { Card, Col, Container, Button, Form, Row } from 'react-bootstrap';
import { createUser } from '@/lib/dbActions';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './signup-style.css';

type SignUpForm = {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
};

/** The sign up page. */
const SignUp = () => {
  const validationSchema = Yup.object().shape({
    email: Yup.string().required('Email is required').email('Email is invalid'),
    username: Yup.string().required('Username is required'),
    password: Yup.string()
      .required('Password is required')
      .min(6, 'Password must be at least 6 characters')
      .max(40, 'Password must not exceed 40 characters'),
    confirmPassword: Yup.string()
      .required('Confirm Password is required')
      .oneOf([Yup.ref('password'), ''], 'Confirm Password does not match'),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpForm>({
    resolver: yupResolver(validationSchema),
  });

  const onSubmit = async (data: SignUpForm) => {
    await createUser(data);
    await signIn('credentials', { callbackUrl: '/add', ...data });
  };

  return (
    <main className="auth-container">
      <Container>
        <Row className="justify-content-center">
          <Col xs={12} md={6} lg={4}>
            <Card className="card-custom">
              <Card.Body>
                <div className="text-center">
                  <div className="auth-header-icon">
                    <i className="bi bi-person-plus-fill fs-3" />
                  </div>
                  <h2>Sign Up</h2>
                </div>
                <Form onSubmit={handleSubmit(onSubmit)}>
                  <Form.Group className="form-group mb-3">
                    <Form.Label className="visually-hidden">Email</Form.Label>
                    <div className="input-group">
                      <span className="input-group-text">
                        <i className="bi bi-envelope" />
                      </span>
                      <input
                        type="text"
                        {...register('email')}
                        className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                        placeholder="E-mail"
                      />
                      <div className="invalid-feedback">{errors.email?.message}</div>
                    </div>
                  </Form.Group>
                  <Form.Group className="form-group mb-3">
                    <Form.Label className="visually-hidden">Username</Form.Label>
                    <div className="input-group">
                      <span className="input-group-text">
                        <i className="bi bi-person" />
                      </span>
                      <input
                        type="text"
                        {...register('username')}
                        className={`form-control ${errors.username ? 'is-invalid' : ''}`}
                        placeholder="Username"
                      />
                      <div className="invalid-feedback">{errors.username?.message}</div>
                    </div>
                  </Form.Group>
                  <Form.Group className="form-group mb-3">
                    <Form.Label className="visually-hidden">Password</Form.Label>
                    <div className="input-group">
                      <span className="input-group-text">
                        <i className="bi bi-lock" />
                      </span>
                      <input
                        type="password"
                        {...register('password')}
                        className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                        placeholder="Password"
                      />
                      <div className="invalid-feedback">{errors.password?.message}</div>
                    </div>
                  </Form.Group>
                  <Form.Group className="form-group mb-3">
                    <Form.Label className="visually-hidden">Confirm Password</Form.Label>
                    <div className="input-group">
                      <span className="input-group-text">
                        <i className="bi bi-lock" />
                      </span>
                      <input
                        type="password"
                        {...register('confirmPassword')}
                        className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
                        placeholder="Confirm Password"
                      />
                      <div className="invalid-feedback">{errors.confirmPassword?.message}</div>
                    </div>
                  </Form.Group>
                  <Button type="submit" className="btn btn-primary w-100">
                    Register
                  </Button>
                </Form>
              </Card.Body>
              <Card.Footer>
                <span>Already have an account? </span>
                <a href="/auth/signin">Sign In</a>
              </Card.Footer>
            </Card>
          </Col>
        </Row>
      </Container>
    </main>
  );
};

export default SignUp;
