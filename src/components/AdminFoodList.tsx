'use client';

import { useState } from 'react';
import { Table } from 'react-bootstrap';
import Button from 'react-bootstrap/Button';

interface FoodItem {
  id: number;
  name: string;
  url: string;
  label: string[];
  translation: string[];
  likes: number;
}

interface AdminFoodListProps {
  foods: FoodItem[];
}

const AdminFoodList = ({ foods }: AdminFoodListProps) => {
  const [showMore, setShowMore] = useState(false);
  const itemsToShow = showMore ? foods : foods.slice(0, 10);

  return (
    <>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Food</th>
            <th>Total user likes</th>
            <th>Image URL</th>
          </tr>
        </thead>
        <tbody>
          {itemsToShow.map((foodTable) => (
            <tr key={foodTable.id}>
              <td>{foodTable.name}</td>
              <td>{foodTable.likes}</td>
              <td>
                <a
                  href={foodTable.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {foodTable.url}
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      <Button
        className="btn"
        variant="outline-secondary"
        type="button"
        onClick={() => setShowMore(!showMore)}
      >
        {showMore ? 'Show less' : 'Show more'}
      </Button>
    </>
  );
};

export default AdminFoodList;
