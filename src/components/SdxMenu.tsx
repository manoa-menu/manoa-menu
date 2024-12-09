/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState } from 'react';
import { FilteredSodexoMeal, SdxAPIResponse } from '@/types/menuTypes';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Stack from '@mui/material/Stack';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import { green, lightGreen } from '@mui/material/colors';

// eslint-disable-next-line import/no-extraneous-dependencies
import { Vegan, Salad } from 'lucide-react';

import { CardHeader } from 'react-bootstrap';

interface TabPanelProps {
  // eslint-disable-next-line react/require-default-props
  children?: React.ReactNode;
  index: number;
  value: number;
}

interface SdxMenuProps {
  weekMenu: SdxAPIResponse[];
  language: string;
}

const VeganIcon = () => (
  <Avatar sx={{ bgcolor: green[400], width: 30, height: 30 }}>
    <Vegan color={green[50]} size={20} />
  </Avatar>
);

const VegetarianIcon = () => (
  <Avatar sx={{ bgcolor: lightGreen[500], width: 30, height: 30 }}>
    <Salad color={green[50]} size={20} />
  </Avatar>
);

const SdxMenu: React.FC<SdxMenuProps> = ({ weekMenu, language }) => {
  const [value, setValue] = useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ padding: 2 }}>
      <Stack flexWrap="wrap" spacing={0}>
        {weekMenu[2].meals.map((meal: FilteredSodexoMeal) => (
          <Card sx={{ marginBottom: 2 }}>
            <CardHeader className="p-3" style={{ backgroundColor: '#EEEEEE' }}>
              <Typography variant="h4">
                {meal.name}
              </Typography>
            </CardHeader>
            <CardContent>
              {meal.groups.map((group) => (
                <Box key={group.name} sx={{ marginBottom: 2 }}>
                  <Typography variant="h6" sx={{ marginBottom: 1 }}>
                    {group.name}
                  </Typography>
                  <ul>
                    {group.items.map((item) => (
                      <div key={item.formalName} style={{ marginBottom: 1 }}>
                        <CardContent>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                              {item.formalName}
                            </Typography>
                            {item.isVegan && <VeganIcon />}
                            {item.isVegetarian && <VegetarianIcon />}
                          </Stack>
                          <Typography variant="body2" sx={{ marginBottom: 1 }}>
                            {item.description}
                          </Typography>

                        </CardContent>
                      </div>
                    ))}
                  </ul>
                </Box>
              ))}
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Box>
  );
};

export default SdxMenu;
