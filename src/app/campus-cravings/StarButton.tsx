import React, { useEffect, useState } from 'react';
import { StarFill, Star } from 'react-bootstrap-icons';
import { Button, Modal } from 'react-bootstrap';
import { useSession } from 'next-auth/react';
import LoadingSpinner from '@/components/LoadingSpinner';
import './starbutton.css';

interface StarButtonProps {
  item: string;
  isStarred: boolean;
  onToggle: (item: string) => void;
}

const StarButton: React.FC<StarButtonProps> = ({ item, isStarred: initialIsStarred, onToggle }) => {
  const { data: session } = useSession();
  const userId = (session?.user as { id: number })?.id;
  const [isStarred, setIsStarred] = useState(initialIsStarred);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setIsStarred(initialIsStarred);
  }, [initialIsStarred]);

  const handleToggle = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/${isStarred ? 'removeStar' : 'addStar'}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, item }),
      });

      if (response.ok) {
        setIsStarred(!isStarred);
        onToggle(item);
      } else {
        const errorText = await response.text();
        console.error('Error response text:', errorText);
        throw new Error('Network response was not ok');
      }
    } catch (error) {
      console.error('Error updating star status:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button variant="link" onClick={handleToggle} style={{ color: isStarred ? 'gold' : 'gray' }}>
        {isStarred ? <StarFill /> : <Star />}
      </Button>
      {loading && (
        <Modal show backdrop="static" className="loading-modal">
          <LoadingSpinner />
        </Modal>
      )}
    </>
  );
};

export default StarButton;
