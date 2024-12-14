import React from 'react';
import { Card, Container } from 'react-bootstrap';
import './CravingsFoodCard.css';

interface FoodInfo {
  id: number;
  name: string;
  likes: number;
  image: string;
  label: string[];
  location: string;
  isStarred: boolean;
  onToggle: (id: string) => void;
}

interface CravingsFoodCardProps {
  foodItems: FoodInfo[];
}

const CravingsFoodCard: React.FC<CravingsFoodCardProps> = ({ foodItems }) => {
  const sortedFoodItems = [...foodItems].sort((a, b) => b.likes - a.likes);

  return (
    <Container>
      {sortedFoodItems.map((itemCard) => {
        // Separate location from other attributes
        const locationLabels = ['Campus Center Food Court', 'Gateway', 'Hale Aloha'];
        const location = locationLabels.find((loc) => itemCard.label.includes(loc)) || itemCard.location;
        let attributes = itemCard.label.filter((label) => !locationLabels.includes(label));
        if (attributes.length === 0) {
          attributes = ['None'];
        }

        return (
          <Card key={itemCard.id} className="foodCard">
            <Card.Body>
              <div className="foodElements">
                <Card.Img className="foodImage" src={itemCard.image} />
                <div className="blackShadeContainer">
                  <Card.Title className="foodName">{itemCard.name}</Card.Title>
                  <Card.Text className="foodLikes">{`${itemCard.likes} favorite(s)`}</Card.Text>
                  <Card.Text className="location">{`Location: ${location}`}</Card.Text>
                  <Card.Text className="attributes">{`Attributes/Labels: ${attributes.join(', ')}`}</Card.Text>
                </div>
              </div>
            </Card.Body>
          </Card>
        );
      })}
    </Container>
  );
};

export default CravingsFoodCard;
