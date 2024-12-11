import React from 'react';
import { Card, Container } from 'react-bootstrap';
import StarButton from '../app/campus-cravings/StarButton'; // Adjust the import path as needed
import './CravingsFoodCard.css';

interface FoodInfo {
  name: string;
  likes: number;
  image: string;
  label: string[];
  isStarred: boolean;
  onToggle: (id: string) => void;
}

interface CravingsFoodCardProps {
  foodItems: FoodInfo[];
  currentUser: string | null;
}

// Need to add location through labels later
const CravingsFoodCard: React.FC<CravingsFoodCardProps> = ({ foodItems, currentUser }) => {
  const sortedFoodItems = [...foodItems].sort((a, b) => b.likes - a.likes);

  return (
    <Container>
      {sortedFoodItems.map((itemCard) => (
        <Card key={itemCard.name} className="foodCard">
          <Card.Body>
            <div className="foodElements">
              <Card.Img className="foodImage" src={itemCard.image} />
              <div className="blackShadeContainer">
                <Card.Title className="foodName">{itemCard.name}</Card.Title>
                <Card.Text className="foodLikes">
                  {`${itemCard.likes} favorite(s)`}
                  <Card.Text className="location">
                    Location:
                    {itemCard.label}
                  </Card.Text>
                </Card.Text>
                {currentUser && (
                <div className="starContainer">
                  <StarButton
                    item={itemCard.name}
                    isStarred={itemCard.isStarred}
                    onToggle={() => itemCard.onToggle(itemCard.name)}
                  />
                  <Card.Text className="clickToFavorite">click to favorite</Card.Text>
                </div>
                )}
              </div>
            </div>
          </Card.Body>
        </Card>
      ))}
    </Container>
  );
};

export default CravingsFoodCard;
