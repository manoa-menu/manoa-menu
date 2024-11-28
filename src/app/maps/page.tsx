'use client';

import { Container } from 'react-bootstrap';
import './maps.css';

const Maps = () => (
  <Container className="my-5">
    <h1>Find the location of a restaurant</h1>
    <p>Refer to the maps below for directions to a restaurant</p>

    <h2 className="header-text">
      <a
        href="https://uhm.sodexomyway.com/en-us/locations/campus-center-food-court"
        rel="noreferrer"
        target="_blank"
      >
        Campus Center Food Court
      </a>
    </h2>
    <Container className="gateway-wrapper">
      <iframe
        className="campus-center"
        title="Campus Center Food Court Location"
        width="1130"
        height="400"
        style={{ border: '0', marginTop: '0', marginBottom: '0', marginLeft: '0', marginRight: '0' }}
        id="gmap_canvas"
        src="https://maps.google.com/maps?width=1130&amp;height=400&amp;hl=en
        &amp;q=2465%20Campus%20Rd%20Honolulu+(Campus%20Center%20Food%20Court)
        &amp;t=&amp;z=20&amp;ie=UTF8&amp;iwloc=B&amp;output=embed"
        allowFullScreen
      />
    </Container>

    <h2 className="header-text">
      <a
        href="https://uhm.sodexomyway.com/en-us/locations/gateway-cafe"
        rel="noreferrer"
        target="_blank"
      >
        Gateway Café
      </a>
    </h2>
    <Container className="gateway-wrapper">
      <iframe
        className="gateway"
        title="Gateway Café Location"
        width="1130"
        height="400"
        style={{ border: '0', marginTop: '0', marginBottom: '0', marginLeft: '0', marginRight: '0' }}
        id="gmap_canvas"
        src="https://maps.google.com/maps?width=520&amp;height=400&amp;hl=en
        &amp;q=2563%20Dole%20St%20Honolulu+(Gateway%20Caf%C3%A9)
        &amp;t=&amp;z=20&amp;ie=UTF8&amp;iwloc=B&amp;output=embed"
        allowFullScreen
      />
    </Container>

    <h2 className="header-text">
      <a
        href="https://uhm.sodexomyway.com/en-us/locations/hale-aloha-cafe"
        rel="noreferrer"
        target="_blank"
      >
        Hale Aloha Café
      </a>
    </h2>
    <Container className="gateway-wrapper">
      <iframe
        className="hale-aloha"
        title="Hale Aloha Café Location"
        width="1130"
        height="400"
        style={{ border: '0', marginTop: '0', marginBottom: '0', marginLeft: '0', marginRight: '0' }}
        id="gmap_canvas"
        src="https://maps.google.com/maps?width=1130&amp;height=400&amp;hl=en
        &amp;q=2573%20Dole%20St%20Honolulu+(%20Hale%20Aloha%20Caf%C3%A9)
        &amp;t=&amp;z=20&amp;ie=UTF8&amp;iwloc=B&amp;output=embed"
        allowFullScreen
      />
    </Container>
  </Container>
);

export default Maps;
