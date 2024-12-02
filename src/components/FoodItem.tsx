'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Badge, Card, Col } from 'react-bootstrap';
import './foodItemSlider.css';

const FoodItem = ({ name, picture, label }: { name: string; picture: string; label: string[] }) => (
  <Col>
    <Card
      className="hover-card h-50"
      style={{
        borderWidth: '0.25rem',
        borderColor: 'lightgray',
      }}
    >
      <Card.Body className="d-flex flex-column align-items-center pb-0">
        <Card.Title className="text-center mb-3" style={{ fontSize: '24px' }}>
          {name}
        </Card.Title>
        <Card.Text className="d-flex gap-2 flex-wrap justify-content-center">
          {label.map((category) => (
            <Badge key={category}>{category}</Badge>
          ))}
        </Card.Text>
      </Card.Body>
      <Image
        src={picture}
        alt={name}
        width={0}
        height={0}
        sizes="100vw"
        style={{
          width: '100%',
          height: 200,
          objectFit: 'cover',
        }}
      />
    </Card>
  </Col>
);

export default FoodItem;
