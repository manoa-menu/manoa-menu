'use client';

// import '@/styles/Menu.css';
// import '@/styles/Scrollbar.css';

import CCMenuList from '@/components/CCMenuList';
import { Container } from 'react-bootstrap';
import { DayMenu, SdxAPIResponse } from '@/types/menuTypes';
import { openInMaps } from '@/lib/mapFunctions';
import { FaMapMarkedAlt } from 'react-icons/fa';
import { useSession } from 'next-auth/react';
import { getUserLanguage } from '@/lib/dbActions';
import {
  useState, useEffect, useRef, useCallback, useLayoutEffect,
} from 'react';
import { fixDayNames, getDisplayMenuNames, getLocationSwitcherLabel } from '@/lib/menuHelper';
import SdxMenu from '@/components/SdxMenu';
import SdxSpecialHoursNotice from '@/components/SdxSpecialHoursNotice';
import { isSdxMenuBlank, SdxSpecialHours } from '@/lib/sdxSpecialHours';
import {
  Box,
  Button,
  ButtonBase,
  Chip,
  Collapse,
  Fade,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import LoadingSpinner from '@/components/LoadingSpinner';
import { menuOptions, useMenu } from '@/lib/MenuContext';

const MENU_SPINNER_DELAY_MS = 300;

const Page = () => {
  const getMenuSuffix = (lang: string): string => {
    switch (lang) {
      case 'Japanese':
        return 'のメニュー';
      case 'Korean':
        return ' 메뉴';
      case 'Chinese':
        return ' 菜单';
      default:
        return ' Menu';
    }
  };

  const getTranslatedStatus = (status: string, lang: string): string => {
    const isOpen = status.toLowerCase().includes('open');
    if (isOpen) {
      switch (lang) {
        case 'Japanese': return '営業中';
        case 'Korean': return '영업중';
        case 'Chinese': return '营业中';
        default: return 'Open';
      }
    } else {
      switch (lang) {
        case 'Japanese': return '準備中';
        case 'Korean': return '준비중';
        case 'Chinese': return '休息中';
        default: return 'Closed';
      }
    }
  };

  const getDirectionsTooltip = (lang: string): string => {
    switch (lang) {
      case 'Japanese': return '行き方を見る';
      case 'Korean': return '길찾기';
      case 'Chinese': return '导航';
      default: return 'Directions';
    }
  };

  const getAIDisclosure = (lang: string): string => {
    switch (lang) {
      case 'Japanese': return '注意：翻訳はAIによって生成されており、間違いが含まれている可能性があります。';
      case 'Korean': return '주의: 번역은 AI에 의해 생성되었으며 오류가 있을 수 있습니다.';
      case 'Chinese': return '注意：翻译由AI生成，可能包含错误。';
      default: return 'Notice: Translations are AI-generated and may contain mistakes.';
    }
  };

  const getLocationLabel = (lang: string): string => {
    switch (lang) {
      case 'Japanese': return '食堂';
      case 'Korean': return '식당';
      case 'Chinese': return '餐厅';
      default: return 'Location';
    }
  };

  const { data: session } = useSession();

  const [userId, setUserId] = useState<number>(-21);

  const [favArr] = useState<string[]>([]);

  const { menuState, setMenuState, language, setLanguage, preferencesReady } = useMenu();

  const [ccMenu, setCCMenu] = useState<DayMenu[]>([]);
  const [gwMenu, setGWMenu] = useState<SdxAPIResponse[]>([]);
  const [haMenu, setHAMenu] = useState<SdxAPIResponse[]>([]);

  const [isCCLoading, setCCLoading] = useState(false);
  const [isGWLoading, setGWLoading] = useState(false);
  const [isHALoading, setHALoading] = useState(false);
  const [showMenuSpinner, setShowMenuSpinner] = useState(true);

  const locationTabListRef = useRef<HTMLDivElement>(null);
  const locationTabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [locationIndicator, setLocationIndicator] = useState({ left: 0, width: 0 });

  const activeLocationIndex = menuOptions.findIndex((menu) => menu.name === menuState);

  const updateLocationIndicator = useCallback(() => {
    const activeEl = locationTabRefs.current[activeLocationIndex];
    const container = locationTabListRef.current;
    if (!activeEl || !container) return;

    const containerRect = container.getBoundingClientRect();
    const activeRect = activeEl.getBoundingClientRect();
    setLocationIndicator({
      left: activeRect.left - containerRect.left,
      width: activeRect.width,
    });
  }, [activeLocationIndex]);

  useLayoutEffect(() => {
    updateLocationIndicator();
  }, [updateLocationIndicator, menuState, language]);

  useEffect(() => {
    window.addEventListener('resize', updateLocationIndicator);

    const container = locationTabListRef.current;
    const resizeObserver = typeof ResizeObserver !== 'undefined' && container
      ? new ResizeObserver(updateLocationIndicator)
      : null;
    if (container) resizeObserver?.observe(container);

    return () => {
      window.removeEventListener('resize', updateLocationIndicator);
      resizeObserver?.disconnect();
    };
  }, [updateLocationIndicator]);

  const [ccHours, setCCHours] = useState<string | null>(null);
  const [gwHours, setGWHours] = useState<string | null>(null);
  const [haHours, setHAHours] = useState<string | null>(null);
  const [gwSpecialHours, setGWSpecialHours] = useState<SdxSpecialHours | null>(null);
  const [haSpecialHours, setHASpecialHours] = useState<SdxSpecialHours | null>(null);

  const locationHours = menuState === 'cc' ? ccHours : menuState === 'gw' ? gwHours : haHours;
  const locationSpecialHours = menuState === 'gw' ? gwSpecialHours : menuState === 'ha' ? haSpecialHours : null;
  const locationAddress = menuState === 'cc'
    ? '2465 Campus Road Honolulu, HI 96822'
    : menuState === 'gw'
      ? '2563 Dole St Honolulu, HI 96822'
      : '2573 Dole St Honolulu, HI 96822';

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [showAiDisclosure, setShowAiDisclosure] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (session?.user?.email) {
        const userLanguage = await getUserLanguage(session.user.email);
        setUserId((session?.user as { id: number })?.id);
        setLanguage(userLanguage);
        console.log(`User language: ${userLanguage}`);
      }
    };
    if (userId !== 21) fetchData();
  }, [session, userId, setLanguage]);



  useLayoutEffect(() => {
    if (!preferencesReady) return;
    if (menuState === 'cc') setCCLoading(true);
    else if (menuState === 'gw') setGWLoading(true);
    else setHALoading(true);
  }, [preferencesReady, menuState, language]);

  useEffect(() => {
    if (!preferencesReady) return;

    const hoursEndpoint = menuState === 'cc'
      ? '/api/cc-hours'
      : menuState === 'gw'
        ? '/api/gw-hours'
        : '/api/ha-hours';
    const setHours = menuState === 'cc'
      ? setCCHours
      : menuState === 'gw'
        ? setGWHours
        : setHAHours;
    const setSpecialHours = menuState === 'gw'
      ? setGWSpecialHours
      : menuState === 'ha'
        ? setHASpecialHours
        : null;

    fetch(hoursEndpoint)
      .then((res) => res.json())
      .then((data) => {
        setHours(data.hours ?? null);
        if (setSpecialHours) {
          setSpecialHours(data.specialHours ?? null);
        }
      })
      .catch(() => {
        setHours(null);
        if (setSpecialHours) {
          setSpecialHours(null);
        }
      });
  }, [menuState, preferencesReady]);

  useEffect(() => {
    if (!preferencesReady) return;

    const fetchMenu = async (
      menuType: string,
      lang: string,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setMenu: React.Dispatch<React.SetStateAction<any>>,
      setLoading: React.Dispatch<React.SetStateAction<boolean>>,
      location?: string,
    ) => {
      try {
        const locationQuery = location ? `&location=${location}` : '';
        const response = await fetch(`/api/${menuType}-menu?language=${lang}${locationQuery}`);
        if (!response.ok) {
          throw new Error(`Error: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        const fixedMenu = fixDayNames(data, lang);

        setMenu(fixedMenu);
      } catch (error) {
        console.error(`Failed to fetch ${menuType} menu:`, error);
      } finally {
        setLoading(false);
      }
    };

    if (menuState === 'cc') {
      setCCLoading(true);
      fetchMenu(menuState, language, setCCMenu, setCCLoading);
    } else if (menuState === 'gw') {
      setGWLoading(true);
      fetchMenu('sdx', language, setGWMenu, setGWLoading, menuState);
    } else if (menuState === 'ha') {
      setHALoading(true);
      fetchMenu('sdx', language, setHAMenu, setHALoading, menuState);
    }
  }, [language, menuState, preferencesReady]);

  const isCurrentMenuLoading = menuState === 'cc'
    ? isCCLoading
    : menuState === 'gw'
      ? isGWLoading
      : isHALoading;
  const isMenuFetching = !preferencesReady || isCurrentMenuLoading;

  useEffect(() => {
    if (!isMenuFetching) {
      setShowMenuSpinner(false);
      return undefined;
    }

    // Show immediately during prefs init; delay only for later menu refetches.
    if (!preferencesReady) {
      setShowMenuSpinner(true);
      return undefined;
    }

    const timer = setTimeout(() => {
      setShowMenuSpinner(true);
    }, MENU_SPINNER_DELAY_MS);

    return () => clearTimeout(timer);
  }, [isMenuFetching, preferencesReady]);

  const renderBlankSdxFallback = (specialHours: SdxSpecialHours | null) => (
    specialHours
      ? <SdxSpecialHoursNotice specialHours={specialHours} language={language} />
      : <h2 className="text-center mt-2">Menu Unavailable</h2>
  );

  const renderMenu = () => {
    switch (menuState) {
      case 'cc':
        return (ccMenu === undefined || ccMenu.length === 0)
          ? <h2 className="text-center mt-2">Menu Unavailable</h2>
          : <CCMenuList menu={ccMenu} language={language} userId={userId} favArr={favArr} />;
      case 'gw':
        return isSdxMenuBlank(gwMenu)
          ? renderBlankSdxFallback(locationSpecialHours)
          : <SdxMenu weekMenu={gwMenu} language={language} favArr={favArr} userId={userId} />;
      case 'ha':
        return isSdxMenuBlank(haMenu)
          ? renderBlankSdxFallback(locationSpecialHours)
          : <SdxMenu weekMenu={haMenu} language={language} favArr={favArr} userId={userId} />;
      default:
        return null;
    }
  };

  const statusControls = locationHours ? (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexShrink: 0 }}>
      <Chip
        label={getTranslatedStatus(locationHours, language)}
        color={locationHours.toLowerCase().includes('open') ? 'success' : 'error'}
        size="small"
        sx={{
          fontWeight: 700,
          fontSize: { xs: '0.72rem', sm: '1rem' },
          height: { xs: 24, sm: 40 },
        }}
      />
      <Tooltip title={getDirectionsTooltip(language)} placement="bottom" arrow>
        <IconButton
          onClick={() => openInMaps(locationAddress)}
          color="primary"
          size="small"
          aria-label={getDirectionsTooltip(language)}
          sx={{
            border: '1.5px solid',
            borderColor: 'primary.light',
            bgcolor: 'background.paper',
            width: { xs: 28, sm: 40 },
            height: { xs: 28, sm: 40 },
            '&:hover': {
              bgcolor: 'primary.50',
            },
          }}
        >
          <FaMapMarkedAlt size={isMobile ? 13 : 18} />
        </IconButton>
      </Tooltip>
    </Box>
  ) : null;

  const locationSwitcher = (
    <Box
      sx={{
        width: { xs: '100%', sm: 'auto' },
        display: 'flex',
        flexDirection: 'column',
        alignItems: { xs: 'stretch', sm: 'center' },
        gap: 0.5,
      }}
    >
      <Box
        sx={{
          display: { xs: 'flex', sm: 'none' },
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
          px: 0.5,
          minHeight: 28,
        }}
      >
        <Typography
          variant="caption"
          sx={{
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'text.secondary',
          }}
        >
          {getLocationLabel(language)}
        </Typography>
        {statusControls}
      </Box>
      <Box
        ref={locationTabListRef}
        role="tablist"
        aria-label="Dining location"
        sx={{
          position: 'relative',
          display: 'flex',
          alignItems: 'stretch',
          width: { xs: '100%', sm: 'auto' },
          maxWidth: { xs: '100%', sm: 'none' },
          minWidth: 0,
          p: '4px',
          borderRadius: '999px',
          backgroundColor: 'rgba(3, 90, 62, 0.08)',
        }}
      >
        {locationIndicator.width > 0 && (
          <Box
            aria-hidden
            sx={{
              position: 'absolute',
              top: 4,
              left: locationIndicator.left,
              width: locationIndicator.width,
              height: 'calc(100% - 8px)',
              borderRadius: '999px',
              backgroundColor: '#035a3e',
              boxShadow: '0 1px 3px rgba(3, 90, 62, 0.25)',
              transition: preferencesReady
                ? 'left 0.28s cubic-bezier(0.4, 0, 0.2, 1), width 0.28s cubic-bezier(0.4, 0, 0.2, 1)'
                : 'none',
              zIndex: 0,
            }}
          />
        )}
        {menuOptions.map((menu, index) => {
          const isActive = menuState === menu.name;
          const label = getLocationSwitcherLabel(menu.name, language);

          return (
            <ButtonBase
              key={menu.name}
              ref={(el) => { locationTabRefs.current[index] = el; }}
              role="tab"
              aria-selected={isActive}
              onClick={() => setMenuState(menu.name)}
              sx={{
                position: 'relative',
                zIndex: 1,
                flex: { xs: '1 1 0', sm: '0 0 auto' },
                minWidth: 0,
                px: { xs: 1, sm: 2.25, md: 2.5 },
                py: { xs: 0.9, sm: 1.05 },
                borderRadius: '999px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                fontSize: { xs: '0.82rem', sm: '0.925rem' },
                fontWeight: isActive ? 700 : 600,
                letterSpacing: '0.01em',
                lineHeight: 1.2,
                color: isActive ? '#fff' : 'rgba(3, 90, 62, 0.78)',
                transition: 'color 0.2s ease',
                '&:hover': {
                  backgroundColor: isActive ? 'transparent' : 'rgba(3, 90, 62, 0.08)',
                },
              }}
            >
              {label}
            </ButtonBase>
          );
        })}
      </Box>
    </Box>
  );

  const menuContentKey = `${menuState}-${language}`;
  const hasDisplayableMenu = (() => {
    switch (menuState) {
      case 'cc':
        return ccMenu.length > 0;
      case 'gw':
        return !isSdxMenuBlank(gwMenu);
      case 'ha':
        return !isSdxMenuBlank(haMenu);
      default:
        return false;
    }
  })();
  const showMenuContent = !showMenuSpinner && (!isMenuFetching || hasDisplayableMenu);

  return (
    <Container
      fluid
      className="mb-4 mb-md-5 menu-container px-2 px-sm-3 pt-2 pt-sm-3"
    >
      <Stack
        spacing={{ xs: 1, sm: 2 }}
        sx={{
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          px: 0,
          mb: { xs: 0.25, sm: 0 },
        }}
      >
        {/* Desktop/tablet: title + status */}
        <Box
          sx={{
            display: { xs: 'none', sm: 'flex' },
            flexDirection: { md: 'row' },
            alignItems: 'center',
            justifyContent: 'center',
            gap: { sm: 2, md: 3 },
            width: '100%',
            px: 0,
            visibility: preferencesReady ? 'visible' : 'hidden',
          }}
        >
          <Typography
            variant="h3"
            component="h1"
            className="text-center"
            sx={{
              fontSize: { sm: '2rem', md: '2.25rem' },
              lineHeight: 1.25,
              wordBreak: 'break-word',
              px: 0,
            }}
          >
            {getDisplayMenuNames(menuState, language)}
            {getMenuSuffix(language)}
          </Typography>
          {statusControls}
        </Box>

        <Box sx={{ visibility: preferencesReady ? 'visible' : 'hidden', width: '100%', display: 'flex', justifyContent: 'center' }}>
          {locationSwitcher}
        </Box>
      </Stack>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          width: '100%',
          maxWidth: '100%',
          minWidth: 0,
          '& > *': {
            gridArea: '1 / 1',
            minWidth: 0,
            maxWidth: '100%',
          },
        }}
      >
        <Fade
          in={showMenuSpinner}
          appear
          timeout={{ enter: 150, exit: 120 }}
          unmountOnExit
        >
          <Box sx={{ width: '100%', maxWidth: '100%', minWidth: 0 }}>
            <LoadingSpinner />
          </Box>
        </Fade>
        <Fade
          in={showMenuContent}
          appear
          timeout={{ enter: 350, exit: 150 }}
          unmountOnExit
        >
          <Box
            key={menuContentKey}
            sx={{
              mx: { xs: 0, sm: 1 },
              my: { xs: 0.5, sm: 1 },
              width: '100%',
              maxWidth: '100%',
              minWidth: 0,
              overflowX: 'clip',
            }}
          >
            {renderMenu()}
          </Box>
        </Fade>
      </Box>

      {!isMenuFetching && language !== 'English' && (
        <Box sx={{ mt: { xs: 2, sm: 4 }, mb: 2, textAlign: 'center' }}>
          {isMobile ? (
            <>
              <Button
                size="small"
                onClick={() => setShowAiDisclosure((prev) => !prev)}
                sx={{ textTransform: 'none', color: 'text.secondary', fontSize: '0.8rem' }}
              >
                {showAiDisclosure ? 'Hide translation notice' : 'About translations'}
              </Button>
              <Collapse in={showAiDisclosure}>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, px: 1 }}>
                  {getAIDisclosure(language)}
                </Typography>
              </Collapse>
            </>
          ) : (
            <Typography variant="body2" color="text.secondary">
              {getAIDisclosure(language)}
            </Typography>
          )}
        </Box>
      )}

    </Container>
  );
};

export default Page;

