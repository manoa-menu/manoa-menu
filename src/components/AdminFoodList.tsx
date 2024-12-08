'use client';

import { useState } from 'react';
import { Table } from 'react-bootstrap';

interface FoodItem {
  id: number;
  name: string;
  url: string;
  label: string[];
  translation: string[];
  likes: number;
}

// Define props for the AdminFoodList component
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
            <th>Total likes</th>
            <th>URL</th>
          </tr>
        </thead>
        <tbody>
          {itemsToShow.map((foodTable) => (
            <tr key={foodTable.id}>
              <td>{foodTable.name}</td>
              <td>{foodTable.likes}</td>
              <td>{foodTable.url}</td>
            </tr>
          ))}
        </tbody>
      </Table>
      <button
        className="btn"
        type="button"
        onClick={() => setShowMore(!showMore)} // Toggle show more
      >
        {showMore ? 'Show less' : 'Show more'}
      </button>
    </>
  );
};

export default AdminFoodList;
