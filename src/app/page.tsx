'use client';

// import '@/styles/Menu.css';
// import '@/styles/Scrollbar.css';

import CCMenuList from '@/components/CCMenuList';
import { DayMenu, SdxAPIResponse } from '@/types/menuTypes';
import { openInMaps } from '@/lib/mapFunctions';
import { FaMapMarkedAlt } from 'react-icons/fa';
import { useSession } from 'next-auth/react';
import { getUserLanguage } from '@/lib/dbActions';
import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { fixDayNames } from '@/lib/menuHelper';
import SdxMenu from '@/components/SdxMenu';
import {
  Box,
  Button,
  Chip,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import LoadingSpinner from '@/components/LoadingSpinner';
import { contentEnterSx, glassHeroSx } from '@/lib/menuUiStyles';

const languages = [
  { name: 'English', displayName: 'English' },
  { name: 'Japanese', displayName: '日本語' },
  { name: 'Korean', displayName: '한국어' },
  { name: 'Chinese', displayName: '中文' },
];

const Page = () => {

  const getDisplayMenuNames = (menuName: string, language: string): string => {
    const isEnglish = language === 'English';
    const isJapanese = language === 'Japanese';

    switch (menuName) {
      case 'cc':
        if (isEnglish) {
          return 'Campus Center Food Court';
        }
        if (isJapanese) {
          return 'キャンパスセンター';
        }
        if (language === 'Korean') {
          return '캠퍼스 센터 푸드 코트';
        }
        if (language === 'Chinese') {
          return '校园中心美食广场';
        }
        return 'Campus Center Food Court';
      case 'gw':
        if (isEnglish) {
          return 'Gateway Cafe';
        }
        if (isJapanese) {
          return 'ゲートウェイカフェ';
        }
        return 'Gateway Cafe';
      case 'ha':
        if (isEnglish) {
          return 'Hale Aloha Cafe';
        }
        if (isJapanese) {
          return 'ハレアロハカフェ';
        }
        return 'Hale Aloha Cafe';
      default:
        return '';
    }
  };

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

  const { data: session } = useSession();

  const [userId, setUserId] = useState<number>(-21);

  const [favArr] = useState<string[]>([]);

  const [menuState] = useState<string>('cc');

  const [ccMenu, setCCMenu] = useState<DayMenu[]>([]);
  const [gwMenu, setGWMenu] = useState<SdxAPIResponse[]>([]);
  const [haMenu, setHAMenu] = useState<SdxAPIResponse[]>([]);

  const [isCCLoading, setCCLoading] = useState(false);
  const [isGWLoading, setGWLoading] = useState(false);
  const [isHALoading, setHALoading] = useState(false);

  const [language, setLanguage] = useState<string>('English');

  const [ccHours, setCCHours] = useState<string | null>(null);

  const theme = useTheme();
  const isSmUp = useMediaQuery(theme.breakpoints.up('sm'));
  const isXs = useMediaQuery(theme.breakpoints.only('xs'));

  const containerStyle = () => {
    if (isXs) {
      return { marginLeft: '0%', marginRight: '0%', paddingTop: '15px' };
    } if (isSmUp) {
      return { paddingTop: '15px' };
    }
    return { paddingTop: '15px' };
  };

  const langItemClick = (lang: string) => {
    setLanguage(lang);
  };

  const langContainerRef = useRef<HTMLDivElement>(null);
  const langButtonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [langIndicator, setLangIndicator] = useState({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    ready: false,
  });

  const updateLangIndicator = useCallback(() => {
    const activeIndex = languages.findIndex((lang) => lang.name === language);
    const activeButton = langButtonRefs.current[activeIndex];
    const container = langContainerRef.current;

    if (!activeButton || !container) {
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const buttonRect = activeButton.getBoundingClientRect();

    setLangIndicator({
      left: buttonRect.left - containerRect.left,
      top: buttonRect.top - containerRect.top,
      width: buttonRect.width,
      height: buttonRect.height,
      ready: true,
    });
  }, [language]);

  useLayoutEffect(() => {
    updateLangIndicator();

    window.addEventListener('resize', updateLangIndicator);
    const resizeObserver = new ResizeObserver(updateLangIndicator);

    if (langContainerRef.current) {
      resizeObserver.observe(langContainerRef.current);
    }

    return () => {
      window.removeEventListener('resize', updateLangIndicator);
      resizeObserver.disconnect();
    };
  }, [updateLangIndicator]);

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
  }, [session, userId]);



  useEffect(() => {
    if (menuState === 'cc') {
      fetch('/api/cc-hours')
        .then((res) => res.json())
        .then((data) => setCCHours(data.hours ?? null))
        .catch(() => setCCHours(null));
    }
  }, [menuState]);

  useEffect(() => {
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
        setLoading(true);
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
      fetchMenu(menuState, language, setCCMenu, setCCLoading);
    } else if (menuState === 'gw') {
      fetchMenu('sdx', language, setGWMenu, setGWLoading, menuState);
    } else if (menuState === 'ha') {
      fetchMenu('sdx', language, setHAMenu, setHALoading, menuState);
    }
  }, [language, menuState]);

  const renderMenu = () => {
    switch (menuState) {
      case 'cc':
        return (ccMenu === undefined || ccMenu.length === 0)
          ? <h2 className="text-center mt-2">Menu Unavailable</h2>
          : <CCMenuList menu={ccMenu} language={language} userId={userId} favArr={favArr} />;
      case 'gw':
        return (gwMenu === undefined || gwMenu.length === 0)
          ? <h2 className="text-center">Menu Unavailable</h2>
          : <SdxMenu weekMenu={gwMenu} language={language} favArr={favArr} userId={userId} />;
      case 'ha':
        return (haMenu === undefined || haMenu.length === 0)
          ? <h2 className="text-center mt-2">Menu Unavailable</h2>
          : <SdxMenu weekMenu={haMenu} language={language} favArr={favArr} userId={userId} />;
      default:
        return null;
    }
  };

  const locationName = getDisplayMenuNames(menuState, language);
  const menuSuffix = getMenuSuffix(language);

  return (
    <Box sx={{ ...containerStyle(), px: { xs: 1, sm: 2, md: 3 }, pb: 4 }}>
      <Paper elevation={0} sx={glassHeroSx}>
        <Stack spacing={{ xs: 1.25, sm: 1.5, md: 2 }} sx={{ position: 'relative', zIndex: 1, alignItems: 'center', width: '100%' }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: 'center',
              justifyContent: 'center',
              gap: { xs: 1.25, md: 2.5 },
            }}
          >
            <Typography
              component="h1"
              className="text-center"
              sx={{
                fontSize: { xs: '1.35rem', sm: '1.65rem', md: '2rem', lg: '2.75rem' },
                fontWeight: 700,
                letterSpacing: '-0.02em',
                lineHeight: 1.25,
                color: 'text.primary',
              }}
            >
              {locationName}
              {menuSuffix}
            </Typography>
            {menuState === 'cc' && ccHours && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Chip
                  label={getTranslatedStatus(ccHours, language)}
                  color={ccHours.toLowerCase().includes('open') ? 'success' : 'error'}
                  sx={{
                    fontWeight: 700,
                    fontSize: { xs: '0.75rem', sm: '0.85rem', md: '0.95rem' },
                    px: { xs: 0.75, md: 1 },
                    py: { xs: 1.25, md: 2 },
                    borderRadius: 2,
                  }}
                />
                <Tooltip title={getDirectionsTooltip(language)} placement="right" arrow>
                  <IconButton
                    onClick={() => openInMaps('2465 Campus Road Honolulu, HI 96822')}
                    color="primary"
                    sx={{
                      border: '1.5px solid',
                      borderColor: 'primary.light',
                      bgcolor: (muiTheme) => (muiTheme.palette.mode === 'light'
                        ? 'rgba(255,255,255,0.7)'
                        : 'rgba(255,255,255,0.06)'),
                      backdropFilter: 'blur(8px)',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-1px)',
                        bgcolor: 'primary.50',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      },
                    }}
                  >
                    <FaMapMarkedAlt />
                  </IconButton>
                </Tooltip>
              </Box>
            )}
          </Box>

          <Box
            ref={langContainerRef}
            sx={{
              position: 'relative',
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: 0.5,
              p: 0.5,
              mx: 'auto',
              width: 'fit-content',
              maxWidth: '100%',
              borderRadius: 2.5,
              border: 1,
              borderColor: 'divider',
              overflow: 'hidden',
              bgcolor: (muiTheme) => (muiTheme.palette.mode === 'light'
                ? 'rgba(255,255,255,0.55)'
                : 'rgba(0,0,0,0.2)'),
            }}
          >
            <Box
              aria-hidden
              sx={{
                position: 'absolute',
                left: langIndicator.left,
                top: langIndicator.top,
                width: langIndicator.width,
                height: langIndicator.height,
                borderRadius: 999,
                bgcolor: 'primary.main',
                opacity: langIndicator.ready ? 1 : 0,
                transition: [
                  'left 0.28s cubic-bezier(0.22, 1, 0.36, 1)',
                  'top 0.28s cubic-bezier(0.22, 1, 0.36, 1)',
                  'width 0.28s cubic-bezier(0.22, 1, 0.36, 1)',
                  'height 0.28s cubic-bezier(0.22, 1, 0.36, 1)',
                  'opacity 0.15s ease',
                ].join(', '),
                zIndex: 0,
                pointerEvents: 'none',
              }}
            />
            {languages.map((lang, index) => {
              const isActive = language === lang.name;

              return (
                <Button
                  key={lang.name}
                  ref={(element) => {
                    langButtonRefs.current[index] = element;
                  }}
                  variant="text"
                  color="primary"
                  size="small"
                  onClick={() => langItemClick(lang.name)}
                  disableElevation
                  sx={{
                    position: 'relative',
                    zIndex: 1,
                    flex: { xs: '1 1 calc(50% - 4px)', sm: '0 0 auto' },
                    minWidth: { xs: 0, sm: 84 },
                    textTransform: 'none',
                    fontWeight: isActive ? 600 : 500,
                    fontSize: { xs: '0.72rem', sm: '0.8rem' },
                    letterSpacing: '-0.01em',
                    borderRadius: 999,
                    px: { xs: 1.25, sm: 1.75 },
                    py: 0.65,
                    color: isActive ? 'primary.contrastText' : 'text.secondary',
                    transition: 'color 0.2s ease',
                    '&:hover': {
                      bgcolor: 'transparent',
                      color: isActive ? 'primary.contrastText' : 'text.primary',
                    },
                  }}
                >
                  {lang.displayName}
                </Button>
              );
            })}
          </Box>
        </Stack>
      </Paper>

      <Box sx={{ display: 'flex', flexDirection: 'column', mt: 1 }}>
        {(isCCLoading || isGWLoading || isHALoading) ? (
          <LoadingSpinner />
        ) : (
          <Box key={`${menuState}-${language}`} sx={{ m: 1, ...contentEnterSx }}>
            {renderMenu()}
          </Box>
        )}
      </Box>

      {!isCCLoading && !isGWLoading && !isHALoading && language !== 'English' && (
        <Paper
          elevation={0}
          sx={{
            mt: 4,
            mb: 2,
            mx: 'auto',
            px: 2,
            py: 1.25,
            textAlign: 'center',
            borderRadius: 2,
            border: 1,
            borderColor: 'divider',
            maxWidth: 700,
            bgcolor: 'background.paper',
          }}
        >
          <Typography variant="body2" color="text.secondary">
            {getAIDisclosure(language)}
          </Typography>
        </Paper>
      )}

    </Box>
  );
};

export default Page;

