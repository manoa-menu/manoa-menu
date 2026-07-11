'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Container, Navbar } from 'react-bootstrap';
import { Box, ButtonBase } from '@mui/material';
import { languageOptions, useMenu } from '@/lib/MenuContext';
import '../app/navbar.css';

const NavBar: React.FC = () => {
  const pathName = usePathname();
  const { language, setLanguage } = useMenu();
  const showLangSwitcher = pathName === '/';

  const langTabListRef = useRef<HTMLDivElement>(null);
  const langTabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [langIndicator, setLangIndicator] = useState({ left: 0, width: 0 });

  const activeLangIndex = languageOptions.findIndex((lang) => lang.name === language);

  const updateLangIndicator = useCallback(() => {
    const activeEl = langTabRefs.current[activeLangIndex];
    const container = langTabListRef.current;
    if (!activeEl || !container) return;

    const containerRect = container.getBoundingClientRect();
    const activeRect = activeEl.getBoundingClientRect();
    setLangIndicator({
      left: activeRect.left - containerRect.left,
      width: activeRect.width,
    });
  }, [activeLangIndex]);

  useLayoutEffect(() => {
    if (!showLangSwitcher) return;
    updateLangIndicator();
  }, [updateLangIndicator, language, showLangSwitcher]);

  useEffect(() => {
    if (!showLangSwitcher) return undefined;

    window.addEventListener('resize', updateLangIndicator);
    const container = langTabListRef.current;
    const resizeObserver = typeof ResizeObserver !== 'undefined' && container
      ? new ResizeObserver(updateLangIndicator)
      : null;
    if (container) resizeObserver?.observe(container);

    return () => {
      window.removeEventListener('resize', updateLangIndicator);
      resizeObserver?.disconnect();
    };
  }, [updateLangIndicator, showLangSwitcher]);

  useEffect(() => {
    document.body.classList.toggle('has-lang-switcher', showLangSwitcher);
    return () => document.body.classList.remove('has-lang-switcher');
  }, [showLangSwitcher]);

  return (
    <Navbar fixed="top" className="custom-navbar">
      <Container
        fluid
        className={`px-3 px-md-4 d-flex ${showLangSwitcher ? 'navbar-inner' : 'align-items-center'}`}
        style={{ minWidth: 0, maxWidth: '100%', overflowX: 'clip' }}
      >
        <Navbar.Brand
          id="manoa-menu"
          className="justify-content-start text-light mb-0"
          href="/"
        >
          Manoa Menu
        </Navbar.Brand>

        {showLangSwitcher && (
          <Box
            ref={langTabListRef}
            className="lang-switcher"
            role="tablist"
            aria-label="Language"
            sx={{
              position: 'relative',
              display: 'flex',
              alignItems: 'stretch',
              width: { xs: '100%', sm: 'auto' },
              maxWidth: '100%',
              minWidth: 0,
              ml: { xs: 0, sm: 'auto' },
              flexShrink: 1,
              p: { xs: '4px', sm: '3px' },
              borderRadius: '999px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
            }}
          >
            {langIndicator.width > 0 && (
              <Box
                aria-hidden
                sx={{
                  position: 'absolute',
                  top: { xs: 4, sm: 3 },
                  left: langIndicator.left,
                  width: langIndicator.width,
                  height: { xs: 'calc(100% - 8px)', sm: 'calc(100% - 6px)' },
                  borderRadius: '999px',
                  backgroundColor: 'rgba(74, 222, 128, 0.22)',
                  boxShadow: 'inset 0 0 0 1px rgba(74, 222, 128, 0.45)',
                  transition: 'left 0.28s cubic-bezier(0.4, 0, 0.2, 1), width 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
                  zIndex: 0,
                }}
              />
            )}
            {languageOptions.map((lang, index) => {
              const isActive = language === lang.name;

              return (
                <ButtonBase
                  key={lang.name}
                  ref={(el) => { langTabRefs.current[index] = el; }}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setLanguage(lang.name)}
                  sx={{
                    position: 'relative',
                    zIndex: 1,
                    flex: { xs: '1 1 0', sm: '0 0 auto' },
                    minWidth: 0,
                    px: { xs: 0.75, sm: 1.5, md: 1.75 },
                    py: { xs: 0.8, sm: 0.6 },
                    borderRadius: '999px',
                    fontSize: { xs: '0.78rem', sm: '0.875rem' },
                    fontWeight: isActive ? 700 : 500,
                    letterSpacing: '0.01em',
                    lineHeight: 1.2,
                    color: isActive ? '#fff' : 'rgba(255, 255, 255, 0.55)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    transition: 'color 0.2s ease',
                    '&:hover': {
                      color: '#fff',
                      backgroundColor: isActive ? 'transparent' : 'rgba(255, 255, 255, 0.05)',
                    },
                  }}
                >
                  {lang.displayName}
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
