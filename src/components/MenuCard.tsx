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
  language: string;
}

const MenuCard: React.FC<MenuCardProps> = ({ name, plateLunch, grabAndGo, message, language }) => {
  const getTableHeader = (lang: string): string[] => {
    switch (lang) {
      case 'English':
        return ['Plate Lunch', 'Grab and Go'];
      case 'Japanese':
        return ['セット料理', 'すぐ食べられる'];
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
      <Card.Body>
        <Card.Title>{name}</Card.Title>
        {
        (grabAndGo.length > 0 && plateLunch.length > 0) ? (
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>{getTableHeader(language)[0]}</th>
                <th>{getTableHeader(language)[1]}</th>
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
};

export default MenuCard;
