'use client';

import { Container, Row } from 'react-bootstrap';
import { useEffect } from 'react';
import Hamster from './spinners/Hamster';
import Typewriter from './spinners/Typewriter';
import Hourglass from './spinners/Hourglass';
import Truck from './spinners/Truck';

const spinnerOrder = [Hamster, Typewriter, Hourglass, Truck];
const CURRENT_SPINNER_INDEX = 0;

const LoadingSpinner = () => {
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      return;
    }

    console.log(
      `Current Spinner Index: ${CURRENT_SPINNER_INDEX} Spinner: ${spinnerOrder[CURRENT_SPINNER_INDEX].name}`,
    );
  }, []);

  const CurrentSpinner = spinnerOrder[CURRENT_SPINNER_INDEX];

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
