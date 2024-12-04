import React from 'react';
import { Card } from 'react-bootstrap';
import StarButton from '../app/campus-cravings/StarButton'; // Adjust the import path as needed

interface FoodCardProps {
  id: string;
  name: string;
  description: string;
  location: string;
  likes: number;
  isStarred: boolean;
  onToggle: (id: string) => void;
  currentUser: string | null;
}

const FoodCard: React.FC<FoodCardProps> = ({
  id,
  name,
  description,
  location,
  likes,
  isStarred,
  onToggle,
  currentUser,
}) => (
  <Card className="my-1" style={{ border: '1px solid' }} key={id}>
    <Card.Body>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Card.Title>{name}</Card.Title>
        {currentUser && (
        <StarButton item={id} isStarred={isStarred} onToggle={onToggle} />
        )}
      </div>
      <Card.Text>{description}</Card.Text>
      <Card.Text>{location}</Card.Text>
      <Card.Text>
        Likes:
        {likes}
      </Card.Text>
    </Card.Body>
  </Card>
);

export default FoodCard;
