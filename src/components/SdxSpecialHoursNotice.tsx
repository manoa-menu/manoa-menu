import { Box, Typography } from '@mui/material';
import type { SdxSpecialHours } from '@/lib/sdxSpecialHours';

interface SdxSpecialHoursNoticeProps {
  specialHours: SdxSpecialHours;
  language?: string;
}

const TITLES: Record<string, string> = {
  English: 'Special Hours',
  Japanese: '特別営業時間',
  Korean: '특별 영업시간',
  Chinese: '特别营业时间',
};

const CLOSED: Record<string, string> = {
  English: 'Closed',
  Japanese: '休業',
  Korean: '휴무',
  Chinese: '休息',
};

const DAYS: Record<string, Record<string, string>> = {
  English: {
    Monday: 'Monday',
    Tuesday: 'Tuesday',
    Wednesday: 'Wednesday',
    Thursday: 'Thursday',
    Friday: 'Friday',
    Saturday: 'Saturday',
    Sunday: 'Sunday',
  },
  Japanese: {
    Monday: '月曜日',
    Tuesday: '火曜日',
    Wednesday: '水曜日',
    Thursday: '木曜日',
    Friday: '金曜日',
    Saturday: '土曜日',
    Sunday: '日曜日',
  },
  Korean: {
    Monday: '월요일',
    Tuesday: '화요일',
    Wednesday: '수요일',
    Thursday: '목요일',
    Friday: '금요일',
    Saturday: '토요일',
    Sunday: '일요일',
  },
  Chinese: {
    Monday: '星期一',
    Tuesday: '星期二',
    Wednesday: '星期三',
    Thursday: '星期四',
    Friday: '星期五',
    Saturday: '星期六',
    Sunday: '星期日',
  },
};

const MEALS: Record<string, Record<string, string>> = {
  English: {
    Breakfast: 'Breakfast',
    Lunch: 'Lunch',
    Dinner: 'Dinner',
    Brunch: 'Brunch',
    Hours: 'Hours',
  },
  Japanese: {
    Breakfast: '朝食',
    Lunch: '昼食',
    Dinner: '夕食',
    Brunch: 'ブランチ',
    Hours: '営業時間',
  },
  Korean: {
    Breakfast: '아침',
    Lunch: '점심',
    Dinner: '저녁',
    Brunch: '브런치',
    Hours: '영업시간',
  },
  Chinese: {
    Breakfast: '早餐',
    Lunch: '午餐',
    Dinner: '晚餐',
    Brunch: '早午餐',
    Hours: '营业时间',
  },
};

/** Exact / common seasonal closure phrases from Sodexo pages. */
const CLOSURES: Record<string, Record<string, string>> = {
  English: {
    'Summer Break': 'Summer Break',
    'Winter Break': 'Winter Break',
    'Spring Break': 'Spring Break',
    'Fall Break': 'Fall Break',
    'Autumn Break': 'Autumn Break',
    'Closed for Summer Break': 'Closed for Summer Break',
    'Closed for Winter Break': 'Closed for Winter Break',
    'Closed for Spring Break': 'Closed for Spring Break',
    'Closed for Fall Break': 'Closed for Fall Break',
    'Closed for Autumn Break': 'Closed for Autumn Break',
    'CLOSED FOR WINTER BREAK': 'Closed for Winter Break',
    'CLOSED FOR SUMMER BREAK': 'Closed for Summer Break',
    'CLOSED FOR SPRING BREAK': 'Closed for Spring Break',
    Closed: 'Closed',
  },
  Japanese: {
    'Summer Break': '夏季休業',
    'Winter Break': '冬季休業',
    'Spring Break': '春季休業',
    'Fall Break': '秋季休業',
    'Autumn Break': '秋季休業',
    'Closed for Summer Break': '夏季休業',
    'Closed for Winter Break': '冬季休業',
    'Closed for Spring Break': '春季休業',
    'Closed for Fall Break': '秋季休業',
    'Closed for Autumn Break': '秋季休業',
    'CLOSED FOR WINTER BREAK': '冬季休業',
    'CLOSED FOR SUMMER BREAK': '夏季休業',
    'CLOSED FOR SPRING BREAK': '春季休業',
    Closed: '休業',
  },
  Korean: {
    'Summer Break': '여름 방학',
    'Winter Break': '겨울 방학',
    'Spring Break': '봄 방학',
    'Fall Break': '가을 방학',
    'Autumn Break': '가을 방학',
    'Closed for Summer Break': '여름 방학 휴무',
    'Closed for Winter Break': '겨울 방학 휴무',
    'Closed for Spring Break': '봄 방학 휴무',
    'Closed for Fall Break': '가을 방학 휴무',
    'Closed for Autumn Break': '가을 방학 휴무',
    'CLOSED FOR WINTER BREAK': '겨울 방학 휴무',
    'CLOSED FOR SUMMER BREAK': '여름 방학 휴무',
    'CLOSED FOR SPRING BREAK': '봄 방학 휴무',
    Closed: '휴무',
  },
  Chinese: {
    'Summer Break': '暑假闭店',
    'Winter Break': '寒假闭店',
    'Spring Break': '春假闭店',
    'Fall Break': '秋假闭店',
    'Autumn Break': '秋假闭店',
    'Closed for Summer Break': '暑假闭店',
    'Closed for Winter Break': '寒假闭店',
    'Closed for Spring Break': '春假闭店',
    'Closed for Fall Break': '秋假闭店',
    'Closed for Autumn Break': '秋假闭店',
    'CLOSED FOR WINTER BREAK': '寒假闭店',
    'CLOSED FOR SUMMER BREAK': '暑假闭店',
    'CLOSED FOR SPRING BREAK': '春假闭店',
    Closed: '休息',
  },
};

function normalizeKey(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function translateDaysLabel(daysLabel: string, language: string): string {
  const dayMap = DAYS[language] ?? DAYS.English;
  return daysLabel.replace(
    /\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b/g,
    (day) => dayMap[day] ?? day,
  );
}

function translateHourLabel(label: string, language: string): string {
  const normalized = normalizeKey(label);
  const closures = CLOSURES[language] ?? CLOSURES.English;
  const meals = MEALS[language] ?? MEALS.English;

  const closureHit = Object.entries(closures).find(
    ([key]) => key.toLowerCase() === normalized.toLowerCase(),
  );
  if (closureHit) {
    return closureHit[1];
  }

  // "{Season} Break" with optional trailing punctuation / Closed for…
  const seasonBreak = normalized.match(
    /^(?:Closed\s+for\s+)?(Summer|Winter|Spring|Fall|Autumn)\s+Break$/i,
  );
  if (seasonBreak) {
    const seasonKey = `${seasonBreak[1][0].toUpperCase()}${seasonBreak[1].slice(1).toLowerCase()} Break`;
    return closures[seasonKey] ?? closures[`Closed for ${seasonKey}`] ?? label;
  }

  const mealHit = Object.entries(meals).find(
    ([key]) => key.toLowerCase() === normalized.toLowerCase(),
  );
  if (mealHit) {
    return mealHit[1];
  }

  // "Summer Hours of Operation : Breakfast" style prefixes — translate the meal tail.
  const mealSuffix = normalized.match(
    /:\s*(Breakfast|Lunch|Dinner|Brunch)$/i,
  );
  if (mealSuffix) {
    const meal = mealSuffix[1];
    const mealName = meals[meal[0].toUpperCase() + meal.slice(1).toLowerCase()] ?? meal;
    return mealName;
  }

  return label;
}

function formatHourLine(
  label: string,
  timeRange: string | null,
  closed: boolean,
  language: string,
): string {
  const translated = translateHourLabel(label, language);
  const closedWord = CLOSED[language] ?? CLOSED.English;

  if (closed) {
    // Already a closure phrase (e.g. 夏季休業) — don't append ": Closed"
    if (
      /closed|休業|휴무|闭店|休息|break|방학/i.test(translated)
      && !timeRange
    ) {
      return translated;
    }
    return `${translated}: ${closedWord}`;
  }

  return `${translated}: ${timeRange}`;
}

const SdxSpecialHoursNotice = ({
  specialHours,
  language = 'English',
}: SdxSpecialHoursNoticeProps) => (
  <Box
    sx={{
      maxWidth: 560,
      mx: 'auto',
      mt: 2,
      p: 2.5,
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 2,
      bgcolor: 'background.paper',
      textAlign: 'center',
    }}
  >
    <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
      {TITLES[language] ?? TITLES.English}
    </Typography>
    <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 2 }}>
      {specialHours.dateRangeLabel}
    </Typography>

    {specialHours.blocks.map((block) => (
      <Box key={`${block.daysLabel}-${block.hours.map((h) => h.label).join('-')}`} sx={{ mb: 1.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          {translateDaysLabel(block.daysLabel, language)}
        </Typography>
        {block.hours.map((hour) => (
          <Typography key={`${hour.label}-${hour.timeRange ?? 'closed'}`} variant="body1">
            {formatHourLine(hour.label, hour.timeRange, hour.closed, language)}
          </Typography>
        ))}
      </Box>
    ))}
  </Box>
);

export default SdxSpecialHoursNotice;
