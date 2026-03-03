'use client';

import { Container, Row } from 'react-bootstrap';
import { useState, useEffect } from 'react';
import Hamster from './spinners/Hamster';
import Typewriter from './spinners/Typewriter';
import Hourglass from './spinners/Hourglass';
import Truck from './spinners/Truck';

const spinnerOrder = [Hamster, Typewriter, Hourglass, Truck];

const LoadingSpinner = () => {
  const [currentSpinnerIndex] = useState<number>(() => {
    const savedIndex = localStorage.getItem('currentSpinnerIndex');
    const parsedIndex = savedIndex !== null ? parseInt(savedIndex, 10) : 0;

    if (Number.isNaN(parsedIndex) || parsedIndex < 0 || parsedIndex >= spinnerOrder.length) {
      return 0;
    }

    return parsedIndex;
  });

  useEffect(() => {
    const nextIndex = (currentSpinnerIndex + 1) % spinnerOrder.length;
    localStorage.setItem('currentSpinnerIndex', nextIndex.toString());
  }, [currentSpinnerIndex]);

  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      return;
    }

    console.log(
      `Current Spinner Index: ${currentSpinnerIndex} Spinner: ${spinnerOrder[currentSpinnerIndex].name}`,
    );
  }, [currentSpinnerIndex]);

  const CurrentSpinner = spinnerOrder[currentSpinnerIndex];

  return (
    <Container fluid className="d-flex justify-content-center mt-5 pt-4">
      <Row className="justify-content-center w-100">
        <div className="d-flex flex-column align-items-center justify-content-center gap-3 text-center">
          <div style={{ transform: 'scale(1.5)', transformOrigin: 'center' }}>
            <CurrentSpinner />
          </div>
          <div className='mt-5'>Loading...</div>
        </div>
      </Row>
    </Container>
  );
};

export default LoadingSpinner;
