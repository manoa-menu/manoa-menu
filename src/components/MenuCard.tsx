/* eslint-disable react/jsx-indent, @typescript-eslint/indent */

'use client';

import React from 'react';
import Card from 'react-bootstrap/Card';
import Table from 'react-bootstrap/Table';

import checkHoliday from '@/lib/checkHoliday';

interface MenuCardProps {
  name: string;
  plateLunch: string[];
  grabAndGo: string[];
  message: string;
}

const MenuCard: React.FC<MenuCardProps> = ({ name, plateLunch, grabAndGo, message }) => (
  <Card className="h-100">
    <Card.Body>
      <Card.Title>{name}</Card.Title>
      {
        (grabAndGo.length > 0 && plateLunch.length > 0) ? (
        <Table striped bordered hover>
          <thead>
            <tr>
              <th>Plate Lunch</th>
              <th>Grab and Go</th>
            </tr>
          </thead>
          <tbody>
            {plateLunch.map((item, index) => (
              <tr key={item}>
                <td>{item}</td>
                <td>{grabAndGo[index] || ''}</td>
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

export default MenuCard;
