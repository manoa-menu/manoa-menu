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
          <div className="foodElements">
            <Card.Img className="foodImage" src={itemCard.image} />
            <div className="blackShadeContainer">
              <Card.Title className="foodName">{itemCard.name}</Card.Title>
              <Card.Text className="foodLikes">
                {`${itemCard.likes} favorite(s)`}
              </Card.Text>
              {currentUser && (
              <StarButton
                item={itemCard.name}
                isStarred={itemCard.isStarred}
                onToggle={() => itemCard.onToggle(itemCard.name)}
              />
              )}
            </div>
          </div>
        </Card.Body>
      </Card>
    ))}
  </Container>
);

export default CravingsFoodCard;
