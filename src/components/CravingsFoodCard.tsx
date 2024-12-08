import React from 'react';
import { Card, Container } from 'react-bootstrap';
import StarButton from '../app/campus-cravings/StarButton'; // Adjust the import path as needed

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
      <Card key={itemCard.name} className="my-1" style={{ border: '1px solid' }}>
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
