'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Badge, Card, Col, Container, Modal, Row } from 'react-bootstrap';
import StarButton from '@/app/campus-cravings/StarButton';
import { getKeyByValue } from '@/lib/assignLabel';
import './foodItemSlider.css';

const labelTranslations: { [key: string]: { [key: string]: string } } = {
  Chicken: { English: 'Chicken', Japanese: '鶏肉' },
  Turkey: { English: 'Turkey', Japanese: '七面鳥' },
  Beef: { English: 'Beef', Japanese: '牛肉' },
  Pork: { English: 'Pork', Japanese: '豚肉' },
  Seafood: { English: 'Seafood', Japanese: 'シーフード' },
  American: { English: 'American', Japanese: 'アメリカン' },
  Asian: { English: 'Asian', Japanese: 'アジアン' },
  Italian: { English: 'Italian', Japanese: 'イタリアン' },
  Mexican: { English: 'Mexican', Japanese: 'メキシカン' },
  'Hawaiian/Island Style': { English: 'Hawaiian/Island Style', Japanese: 'ハワイアン/アイランドスタイル' },
  Greek: { English: 'Greek', Japanese: 'ギリシャ' },
  Salads: { English: 'Salads', Japanese: 'サラダ' },
  Entrées: { English: 'Entrées', Japanese: 'メインディッシュ' },
  Sides: { English: 'Sides', Japanese: 'サイド' },
  'Soups & Stews': { English: 'Soups & Stews', Japanese: 'スープ＆シチュー' },
  BBQ: { English: 'BBQ', Japanese: 'バーベキュー' },
  Spicy: { English: 'Spicy', Japanese: '辛い' },
  Sweet: { English: 'Sweet', Japanese: '甘い' },
  Savory: { English: 'Savory', Japanese: '味のある' },
  'Grilled/Blackened': { English: 'Grilled/Blackened', Japanese: '焼く/黒焼き' },
  Fried: { English: 'Fried', Japanese: '揚げ' },
  'Roasted/Baked': { English: 'Roasted/Baked', Japanese: '焼く/焼く' },
  grabAndGo: { English: 'Grab and Go', Japanese: '持ち帰り' },
  plateLunch: { English: 'Plate Lunch', Japanese: 'プレートランチ' },
  Gateway: { English: 'Gateway', Japanese: 'ゲートウェイ' },
  'Hale Aloha': { English: 'Hale Aloha', Japanese: 'ハレアロハ' },
};

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
  language,
}: {
  name: string;
  picture: string;
  label: string[];
  onToggle: (item: string) => void;
  language: string;
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

      <Modal show={showModal} onHide={handleClose} centered dialogClassName="modal-90w">
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
        <Modal.Body className="p-0">
          <Image
            src={picture}
            alt={name}
            width={0}
            height={0}
            sizes="100vw"
            style={{ width: '100%', height: 'auto' }}
          />
        </Modal.Body>
        <Modal.Footer className="d-flex justify-content-center">
          {label.map((category) => {
            const labelType = getKeyByValue(category) || '';
            const badgeColor = labelType ? labelColors[labelType] : 'secondary';
            // eslint-disable-next-line operator-linebreak
            const translatedLabel =
              labelTranslations[category] && labelTranslations[category][language]
                ? labelTranslations[category][language]
                : category;
            return (
              <Badge key={category} bg={badgeColor} style={{ color: 'black', fontSize: '1rem' }}>
                {translatedLabel}
              </Badge>
            );
          })}
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default FoodItem;
