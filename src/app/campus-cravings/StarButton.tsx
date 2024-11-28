import React from 'react';
import { StarFill, Star } from 'react-bootstrap-icons';
import { Button } from 'react-bootstrap';

interface StarButtonProps {
  item: string;
  isStarred: boolean;
  onToggle: (item: string) => void;
}

const StarButton: React.FC<StarButtonProps> = ({ item, isStarred, onToggle }) => (
  <Button
    variant="link"
    onClick={() => onToggle(item)}
    style={{ color: isStarred ? 'gold' : 'gray' }}
  >
    {isStarred ? <StarFill /> : <Star />}
  </Button>
);

export default StarButton;
