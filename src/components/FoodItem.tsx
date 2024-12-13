'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Badge, Card, Col, Container, Modal, Row } from 'react-bootstrap';
import StarButton from '@/app/campus-cravings/StarButton';
import { getKeyByValue } from '@/lib/assignLabel';
import './foodItemSlider.css';

const labelColors: { [key: string]: string } = {
  'Protein Type': 'danger',
  'Cuisine Style': 'primary',
  'Meal Type': 'warning',
  'Flavor Profile': 'info',
  'Preparation Method': 'success',
};

const FoodItem = ({
  name,
  picture,
  label,
  onToggle,
}: {
  name: string;
  picture: string;
  label: string[];
  onToggle: (item: string) => void;
}) => {
  const [showModal, setShowModal] = useState(false);

  const handleShow = () => setShowModal(true);
  const handleClose = () => setShowModal(false);
  return (
    <>
      <Col>
        <Card className="hover-card h-50" style={{}} onClick={handleShow}>
          <Card.Body className="d-flex flex-column align-items-center pb-0">
            <Card.Title className="text-center mb-3" style={{ fontSize: '24px' }}>
              {name}
            </Card.Title>
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

      <Modal show={showModal} onHide={handleClose} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <Container>
              <Row>
                {name}
                <Col className="sliderStar">
                  <StarButton item={name} isStarred={false} onToggle={onToggle} />
                </Col>
              </Row>
            </Container>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="d-flex flex-column align-items-center">
          <Image src={picture} alt={name} width={0} height={0} sizes="100vw" style={{ width: 'auto', height: 500 }} />
          <div className="d-flex gap-2 flex-wrap justify-content-center mt-3">
            {label.map((category) => {
              const labelType = getKeyByValue(category);
              const badgeColor = labelType ? labelColors[labelType] : 'secondary';
              return (
                <Badge key={category} bg={badgeColor}>
                  {category}
                </Badge>
              );
            })}
          </div>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default FoodItem;
