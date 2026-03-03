'use client';

import { usePathname } from 'next/navigation';
import { Container, Nav, Navbar } from 'react-bootstrap';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import Image from 'next/image';
import '../app/navbar.css';

const NavBar: React.FC = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const pathName = usePathname();

  return (
    <Navbar className="custom-navbar fixed-top" style={{ height: '65px' }}>
      <Container fluid className="px-4">
        <div className="d-flex align-items-center">
          {/* <Navbar.Brand>
            <Image
              src="/manoa-menu-logo.jpg"
              alt="Manoa Menu Logo"
              width={50}
              height={50}
              className="rounded border border-secondary d-inline-block align-top"
            />
          </Navbar.Brand> */}

          <Navbar.Brand id="manoa-menu" className="justify-content-start text-light" href="/">
            Manoa Menu
          </Navbar.Brand>
        </div>

        <div className="ms-auto">
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto justify-content-start px-2">
              {/* <Nav.Link id="menu-nav" className="mx-2 text-light" href="/" key="menu" active={pathName === '/'}>
                Menu
              </Nav.Link> */}
               
              {/*<Nav.Link
                id="maps-nav"
                className="mx-2 text-light"
                href="/maps"
                key="maps"
                active={pathName === '/maps'}
              >
                Find a Location
              </Nav.Link> */}
            </Nav>
          </Navbar.Collapse>
        </div>
      </Container>
    </Navbar>
  );
};

export default NavBar;
