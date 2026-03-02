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
    <Container>
      <Row className="justify-content-md-center">
        <CurrentSpinner />
        Getting data
      </Row>
    </Container>
  );
};

export default LoadingSpinner;
