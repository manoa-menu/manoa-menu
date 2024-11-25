/* eslint-disable react/jsx-indent, @typescript-eslint/indent */

'use client';

import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { Container, Nav, Navbar, NavDropdown } from 'react-bootstrap';
import { BoxArrowRight, Lock, PersonFill, PersonPlusFill } from 'react-bootstrap-icons';
import Image from 'next/image';

const NavBar: React.FC = () => {
  const { data: session } = useSession();
  const currentUser = session?.user?.email;
  const userWithRole = session?.user as { email: string; randomKey: string };
  const role = userWithRole?.randomKey;
  const pathName = usePathname();
  return (
    <Navbar bg="light" expand="lg">
      <Container fluid className="px-5">

        <div className="d-flex align-items-center">
          <Navbar.Brand>
            <Image
              src="/manoa-menu-logo.jpg"
              alt="Manoa Menu Logo"
              width={50}
              height={50}
              className="d-inline-block align-top"
            />
          </Navbar.Brand>

          <Navbar.Brand className="me-auto justify-content-start px-2" href="/">
            Manoa Menu
          </Navbar.Brand>
        </div>

      <div className="ms-auto">
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">

          <Nav className="me-auto justify-content-start px-2">
            <Nav.Link id="menu-nav" className="mx-2" href="/menu" key="menu" active={pathName === '/menu'}>
              Menu
            </Nav.Link>

            <Nav.Link
              id="campus-cravings-nav"
              className="mx-2"
              href="/campus-cravings"
              key="favs"
              active={pathName === '/campus-cravings'}
            >
              Campus Cravings
            </Nav.Link>
            {currentUser
              ? [
                  <Nav.Link id="dashboard" href="/dashboard" key="dashboard" active={pathName === '/dashboard'}>
                    Dashboard
                  </Nav.Link>,
                ]
              : ''}
            {currentUser && role === 'ADMIN' ? (
              <Nav.Link id="admin-nav" href="/admin" key="admin" active={pathName === '/admin'}>
                Admin
              </Nav.Link>
            ) : (
              ''
            )}
          </Nav>
          <Nav>
            {session ? (
              <NavDropdown id="login-dropdown" title={currentUser}>
                <NavDropdown.Item id="login-dropdown-sign-out" href="/api/auth/signout">
                  <BoxArrowRight />
                  Sign Out
                </NavDropdown.Item>
                <NavDropdown.Item id="login-dropdown-change-password" href="/auth/change-password">
                  <Lock />
                  Change Password
                </NavDropdown.Item>
              </NavDropdown>
            ) : (
              <NavDropdown id="login-dropdown" title="Login">
                <NavDropdown.Item id="login-dropdown-sign-in" href="/auth/signin">
                  <PersonFill />
                  Sign in
                </NavDropdown.Item>
                <NavDropdown.Item id="login-dropdown-sign-up" href="/auth/signup">
                  <PersonPlusFill />
                  Sign up
                </NavDropdown.Item>
              </NavDropdown>
            )}
          </Nav>
        </Navbar.Collapse>
      </div>
      </Container>
    </Navbar>
  );
};

export default NavBar;
