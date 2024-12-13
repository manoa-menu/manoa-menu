'use client';

import { Row, Col, Container } from 'react-bootstrap';
import { FaExternalLinkAlt, FaMapMarkedAlt } from 'react-icons/fa';

import './maps.css';

const openInMaps = (address: string) => {
  const encodedAddress = encodeURIComponent(address);
  let url;

  // Detect if the user is on iOS or macOS
  const isApplePlatform = /iPhone|iPad|iPod|Macintosh/i.test(navigator.userAgent);

  if (isApplePlatform) {
    // Use Apple Maps for iOS and macOS
    url = `https://maps.apple.com/?q=${encodedAddress}`;
  } else {
    // Use Google Maps for others
    url = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
  }

  // Open the appropriate map URL
  window.open(url, '_blank');
};

const Maps = () => (
  <Container className="my-5" style={{ paddingTop: '120px' }}>
    <h1>Find the location of a restaurant</h1>

    <Row>
      <Col md={12} lg={3} className="">
        <h2 className="header-text my-2">
          <a
            href="https://uhm.sodexomyway.com/en-us/locations/campus-center-food-court"
            rel="noreferrer"
            target="_blank"
          >
            Campus Center Food Court
            <FaExternalLinkAlt className="ms-2" />
          </a>
        </h2>
        <p className="address m-2 mt-3">
          2465 Campus Road, Honolulu, HI 96822
        </p>
        <button
          type="button"
          className="directions-button m-2"
          onClick={() => openInMaps('2465 Campus Road Honolulu, HI 96822')}
        >
          Get Directions
        </button>
      </Col>
      <Col md={12} lg={9}>
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
      </Col>
    </Row>

    <Row>
      <Col md={12} lg={3} className="">
        <h2 className="header-text my-2">
          <a
            href="https://uhm.sodexomyway.com/en-us/locations/gateway-cafe"
            rel="noreferrer"
            target="_blank"
          >
            Gateway Café
            <FaExternalLinkAlt className="ms-2" />
          </a>
        </h2>
        <p className="address m-2 mt-3">
          2563 Dole St, Honolulu, HI 96822
        </p>
        <button
          type="button"
          className="directions-button m-2"
          onClick={() => openInMaps('2465 Campus Road Honolulu, HI 96822')}
        >
          Get Directions
          <FaMapMarkedAlt />
        </button>
      </Col>
      <Col md={12} lg={9}>
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
      </Col>
    </Row>

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
