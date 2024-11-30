'use client';

import Image from 'next/image';
import { Badge, Card, Col } from 'react-bootstrap';
import './foodItemSlider.css';

const FoodItem = ({ name, picture, label }: { name: string; picture: string; label: string[] }) => (
  <Col>
    <Card
      className=" hover-card h-50"
      style={{
        borderWidth: '0.25rem',
        borderColor: 'lightgray',
      }}
    >
      <Card.Body className="d-flex flex-column align-items-center">
        <Card.Title className="text-center mb-3" style={{ fontSize: 24 }}>
          {name}
        </Card.Title>
        <Card.Text className="d-flex gap-2 flex-wrap justify-content-center">
          {label.map((category) => (
            <Badge>{category}</Badge>
          ))}
        </Card.Text>
      </Card.Body>
      <Image
        src={picture}
        alt={name}
        width={0}
        height={200}
        sizes="100vw"
        style={{
          width: '100%',
          objectFit: 'cover',
        }}
      />
    </Card>
  </Col>
);

export default FoodItem;
