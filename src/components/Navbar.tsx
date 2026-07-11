'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Container, Navbar } from 'react-bootstrap';
import { Box, ButtonBase } from '@mui/material';
import { menuOptions, useMenu } from '@/lib/MenuContext';
import { getLocationSwitcherLabel } from '@/lib/menuHelper';
import '../app/navbar.css';

const NavBar: React.FC = () => {
  const pathName = usePathname();
  const { menuState, setMenuState, language } = useMenu();
  const showMenuSwitcher = pathName === '/';

  useEffect(() => {
    document.body.classList.toggle('has-menu-switcher', showMenuSwitcher);
    return () => document.body.classList.remove('has-menu-switcher');
  }, [showMenuSwitcher]);

  return (
    <Navbar fixed="top" className="custom-navbar">
      <Container
        fluid
        className={`px-3 px-md-4 d-flex ${showMenuSwitcher ? 'navbar-inner' : 'align-items-center'}`}
      >
        <Navbar.Brand
          id="manoa-menu"
          className="justify-content-start text-light mb-0"
          href="/"
        >
          Manoa Menu
        </Navbar.Brand>

        {showMenuSwitcher && (
          <Box
            className="menu-switcher"
            role="tablist"
            aria-label="Dining location"
            sx={{
              display: 'flex',
              alignItems: 'stretch',
              width: { xs: '100%', sm: 'auto' },
              ml: { xs: 0, sm: 'auto' },
              flexShrink: 1,
              minWidth: 0,
              borderBottom: '1px solid rgba(255, 255, 255, 0.14)',
              gap: { xs: 0, sm: 0.25 },
            }}
          >
            {menuOptions.map((menu) => {
              const isActive = menuState === menu.name;
              const label = getLocationSwitcherLabel(menu.name, language);

              return (
                <ButtonBase
                  key={menu.name}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setMenuState(menu.name)}
                  sx={{
                    flex: { xs: 1, sm: '0 0 auto' },
                    minWidth: 0,
                    px: { xs: 0.5, sm: 1.5, md: 2 },
                    py: { xs: 0.65, sm: 0.7 },
                    mb: '-1px',
                    borderRadius: '6px 6px 0 0',
                    borderBottom: '2px solid',
                    borderColor: isActive ? '#4ade80' : 'transparent',
                    fontSize: { xs: '0.82rem', sm: '0.9rem', md: '0.975rem' },
                    fontWeight: isActive ? 700 : 500,
                    letterSpacing: '0.01em',
                    lineHeight: 1.2,
                    color: isActive ? '#fff' : 'rgba(255, 255, 255, 0.55)',
                    backgroundColor: 'transparent',
                    transition: 'color 0.2s ease, border-color 0.2s ease, background-color 0.2s ease',
                    whiteSpace: 'nowrap',
                    '&:hover': {
                      color: '#fff',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    },
                  }}
                >
                  {label}
                </ButtonBase>
              );
            })}
          </Box>
        )}
      </Container>
    </Navbar>
  );
};

export default NavBar;
