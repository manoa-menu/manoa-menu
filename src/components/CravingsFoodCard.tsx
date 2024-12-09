import React from 'react';
import { Card, Container } from 'react-bootstrap';
import StarButton from '../app/campus-cravings/StarButton'; // Adjust the import path as needed
import './CravingsFoodCard.css';

interface FoodInfo {
  name: string;
  likes: number;
  image: string;
  isStarred: boolean;
  onToggle: (id: string) => void;
}

interface CravingsFoodCardProps {
  foodItems: FoodInfo[];
  currentUser: string | null;
}

const CravingsFoodCard: React.FC<CravingsFoodCardProps> = ({ foodItems, currentUser }) => (
  <Container>
    {foodItems.map((itemCard) => (
      <Card key={itemCard.name} className="foodCard">
        <Card.Body>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Card.Title>{itemCard.name}</Card.Title>
            <Card.Img src={itemCard.image} style={{ width: '100px', height: '100px' }} />
            {currentUser && (
              <StarButton
                item={itemCard.name}
                isStarred={itemCard.isStarred}
                onToggle={() => itemCard.onToggle(itemCard.name)}
              />
            )}
          </div>
          <Card.Text>
            Likes:
            {itemCard.likes}
          </Card.Text>
        </Card.Body>
      </Card>
    ))}
  </Container>
);

export default CravingsFoodCard;
