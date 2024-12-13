'use client';

import React, { useState } from 'react';
import Card from 'react-bootstrap/Card';
import Table from 'react-bootstrap/Table';
import Tooltip from '@mui/material/Tooltip';

import checkHoliday from '@/lib/checkHoliday';
import StarButton from '@/app/campus-cravings/StarButton';
import { isFav } from '@/lib/menuHelper';

interface MenuCardProps {
  name: string;
  plateLunch: string[];
  grabAndGo: string[];
  message: string;
  language: string;
  favArr: string[];
  userId: number;
}

const CCMenuCard: React.FC<MenuCardProps> = ({
  name,
  plateLunch,
  grabAndGo,
  message,
  language,
  favArr = [],
  userId,
}) => {
  const displayTooltipNames = new Map<string, string>([
    ['English', 'Favorite?'],
    ['Japanese', 'お気に？'],
    ['english', 'Favorite?'],
    ['japanese', 'お気に？'],
  ]);

  const sdxFilter = [
    'White Rice',
    'Brown Rice',
    'Sour Cream',
    'Steamed White Rice',
    'Steamed Brown Rice',
    "Lay's Potato Chips",
  ];

  const [favArray, setFavArray] = useState(favArr);

  const handleToggle = (item: string) => {
    const updatedFavArr = (prevFavArray: string[]) => {
      if (prevFavArray.includes(item)) {
        return prevFavArray.filter((favItem) => favItem !== item);
      }
      return [...prevFavArray, item];
    };
    setFavArray(updatedFavArr);
  };

  const getTableHeader = (lang: string): string[] => {
    switch (lang) {
      case 'English':
        return ['Plate Lunch', 'Grab and Go', 'Fav?'];
      case 'Japanese':
        return ['セット料理', 'すぐ食べられる', 'お気に？'];
      case 'Korean':
        return ['백반', '빨리 먹고 가는 식사'];
      case 'Spanish':
        return ['Plato Combinado', 'Comida para Llevar'];
      default:
        return ['Plate Lunch', 'Grab and Go'];
    }
  };
  return (
    <Card className="h-100">
      <Card.Body className="px-0 pb-0">
        <Card.Title className="px-2 text-center">
          <strong>{name}</strong>
        </Card.Title>
        {
        (grabAndGo.length > 0 && plateLunch.length > 0) ? (
          <Table bordered striped>
            <thead>
              <tr>
                <th>{getTableHeader(language)[0]}</th>
                {/*  eslint-disable-next-line jsx-a11y/control-has-associated-label */}
                {/* <th>{getTableHeader(language)[2]}</th> */}
                <th>{getTableHeader(language)[1]}</th>
                {/* eslint-disable-next-line jsx-a11y/control-has-associated-label */}
                {/* <th>{getTableHeader(language)[2]}</th> */}
              </tr>
            </thead>
            <tbody>
              {plateLunch.map((item, index) => (
                <tr key={item}>
                  <td className={(userId === -21) ? 'pe-2' : 'pe-0'}>
                    <span className="d-flex justify-content-between">
                      {item}
                      {item && (userId !== -21) && !sdxFilter.includes(item) && (
                        <Tooltip title={displayTooltipNames.get(language)} arrow>
                          <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <StarButton
                              item={item}
                              isStarred={isFav(favArray, item)}
                              onToggle={() => handleToggle(item)}
                            />
                          </div>
                        </Tooltip>
                      )}
                    </span>
                  </td>
                  <td className={(userId === -21) ? 'pe-2' : 'pe-0'}>
                    <span className="d-flex justify-content-between">
                      {grabAndGo[index] || ''}
                      {grabAndGo[index] && (userId !== -21) && !sdxFilter.includes(grabAndGo[index]) && (
                        <Tooltip title={displayTooltipNames.get(language)} arrow>
                          <StarButton
                            item={grabAndGo[index]}
                            isStarred={isFav(favArray, grabAndGo[index])}
                            onToggle={() => handleToggle(grabAndGo[index])}
                          />
                        </Tooltip>
                      )}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <div className="d-flex justify-content-center text-center">
            <h1 className="display-4 mt-4">
              <strong>
                {`${message} ${checkHoliday(message)}`}
              </strong>
            </h1>
          </div>
        )
      }
      </Card.Body>
    </Card>
  );
};

export default CCMenuCard;
