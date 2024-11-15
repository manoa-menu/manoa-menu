/* eslint-disable react/jsx-indent, @typescript-eslint/indent */

'use client';

import React from 'react';
import Card from 'react-bootstrap/Card';

interface MenuCardProps {
  name: string;
  plateLunch: string[];
  grabAndGo: string[];
  message: string;
}

const MenuCard: React.FC<MenuCardProps> = ({ name, plateLunch, grabAndGo, message }) => (
    <Card>
      <Card.Body>
        <Card.Title>{name}</Card.Title>
        <div>
          <h5>Plate Lunch</h5>
          <ul>
            {plateLunch.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <h5>Grab and Go</h5>
          <ul>
            {grabAndGo.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p>{message}</p>
        </div>
      </Card.Body>
    </Card>
  );

export default MenuCard;
