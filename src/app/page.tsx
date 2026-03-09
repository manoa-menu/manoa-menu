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
import { useState, useEffect } from 'react';
import { fixDayNames } from '@/lib/menuHelper';
import SdxMenu from '@/components/SdxMenu';
import { Box, Button, Chip, IconButton, Stack, Tooltip, Typography, useMediaQuery, useTheme } from '@mui/material';
import LoadingSpinner from '@/components/LoadingSpinner';

const Page = () => {
  const languages = [
    { name: 'English', displayName: 'English' },
    { name: 'Japanese', displayName: '日本語' },
    { name: 'Korean', displayName: '한국어' },
    { name: 'Chinese', displayName: '中文' },
  ];

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
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));
  const isSmUp = useMediaQuery(theme.breakpoints.up('sm'));
  const isXsUp = useMediaQuery(theme.breakpoints.up('xs'));

  let typographyVariant: 'h3' | 'h4' | 'h5' = 'h3';
  if (isMdUp) {
    typographyVariant = 'h3';
  } else if (isSmUp) {
    typographyVariant = 'h3';
  } else if (isXsUp) {
    typographyVariant = 'h4';
  }

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

  return (
    <Container
      fluid
      className="my-3 menu-container"
      style={containerStyle()}
    >
      <Stack
        spacing={2}
        sx={{
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', md: 'row' }, 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: { xs: 1, md: 3 },
            mb: { xs: 1, md: 0 }
          }}
        >
          <Typography
            variant={typographyVariant}
            className="text-center mt-1"
            sx={{ display: 'flex', alignItems: 'center' }}
          >
            {getDisplayMenuNames(menuState, language)}
            {getMenuSuffix(language)}
          </Typography>
          {menuState === 'cc' && ccHours && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Chip
                label={getTranslatedStatus(ccHours, language)}
                color={ccHours.toLowerCase().includes('open') ? 'success' : 'error'}
                sx={{
                  fontWeight: 'bold',
                  fontSize: '0.95rem',
                  px: 1,
                  py: 2,
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
                    bgcolor: 'background.paper',
                    '&:hover': {
                      bgcolor: 'primary.50'
                    }
                  }}
                >
                  <FaMapMarkedAlt />
                </IconButton>
              </Tooltip>
            </Box>
          )}
        </Box>
        <Box
          sx={{
            border: '1px solid #ccc',
            borderRadius: 1,
            padding: { xs: 1, sm: 1 },
            display: 'flex',
          }}
        >
          <Stack
            direction="row"
            sx={{
              alignItems: 'stretch',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: { xs: 0.5, sm: 1 },
              rowGap: { xs: 0.5, sm: 1 },
              width: '100%',
            }}
          >
            {languages.map((lang) => {
              const isActive = language === lang.name;

              return (
                <Button
                  key={lang.name}
                  variant={isActive ? 'contained' : 'outlined'}
                  color="primary"
                  size="small"
                  onClick={() => langItemClick(lang.name)}
                  sx={{
                    flex: { xs: '0 0 calc(50% - 4px)', sm: '0 0 auto' },
                    minWidth: { xs: 0, sm: '80px', md: '92px' },
                    maxWidth: { xs: 'calc(50% - 4px)', sm: 'none' },
                    textTransform: 'none',
                    fontWeight: isActive ? 600 : 500,
                    fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' },
                    padding: { xs: '6px 10px', sm: '8px 18px' },
                  }}
                >
                  {lang.displayName}
                </Button>
              );
            })}
          </Stack>
        </Box>
      </Stack>

      <div className="d-flex flex-column">
        {(isCCLoading || isGWLoading || isHALoading) ? (
          <LoadingSpinner />
        ) : (
          <div className="m-2">
            {renderMenu()}
          </div>
        )}
      </div>
      
      {!isCCLoading && !isGWLoading && !isHALoading && language !== 'English' && (
        <Box sx={{ mt: 4, mb: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            {getAIDisclosure(language)}
          </Typography>
        </Box>
      )}

    </Container>
  );
};

export default Page;

