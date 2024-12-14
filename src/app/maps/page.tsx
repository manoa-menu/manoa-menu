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
    url = `https://maps.apple.com/?daddr=${encodedAddress}`;
  } else {
    // Use Google Maps for others
    url = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;
  }

  // Open the appropriate map URL
  window.open(url, '_blank');
};

const Maps = () => (
  <Container className="my-5" style={{ paddingTop: '120px' }}>
    <h1>Dining Locations and Hours</h1>

    <Row className="my-3">
      <Col md={12} lg={3} className="">
        <h2 className="header-text my-2">
          <a
            href="https://uhm.sodexomyway.com/en-us/locations/campus-center-food-court"
            rel="noreferrer"
            target="_blank"
          >
            Campus Center Food Court
            <FaExternalLinkAlt size={20} className="ms-2" />
          </a>
        </h2>
        <div className="m-2 mt-3 d-flex flex-column">
          <div className="">
            <h6><em>Special Hours:</em></h6>
            <p>Closed for Winter Break: 12/20/2024 - 1/12/2025</p>
          </div>
          <div>
            <h6>Regular Hours:</h6>
            <p>
              Monday-Friday ~
              7:00AM-2:00PM
            </p>
          </div>
          <div>
            <h6>
              Address:
            </h6>
            <p className="mb-0">
              2465 Campus Road, Honolulu, HI 96822
            </p>
          </div>
        </div>

        <button
          type="button"
          className="directions-button m-2"
          onClick={() => openInMaps('2465 Campus Road Honolulu, HI 96822')}
        >
          Get Directions
          <FaMapMarkedAlt className="ms-2 mb-1" />
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

    <Row className="my-3">
      <Col md={12} lg={3} className="">
        <h2 className="header-text my-2">
          <a
            href="https://uhm.sodexomyway.com/en-us/locations/gateway-cafe"
            rel="noreferrer"
            target="_blank"
          >
            Gateway Café
            <FaExternalLinkAlt size={20} className="ms-2" />
          </a>
        </h2>
        <div className="m-2 mt-3 d-flex flex-column">
          <div className="">
            <h6><em>Special Hours:</em></h6>
            <p>12/15/2024 - 12/20/2024</p>
            <ul>
              <li>Breakfast: 7:00AM-10:00AM</li>
              <li>Lunch: 11:00AM-2:00PM</li>
            </ul>
            <p>
              <em>
                Closed for Winter Break: 12/20/2024 - 1/12/2025
              </em>
            </p>
          </div>
          <div>
            <h6>Regular Hours:</h6>
            <p className="mb-1">Monday-Friday</p>
            <ul>
              <li>Breakfast: 7:00AM-10:00AM</li>
              <li>Lunch: 11:00AM-2:00PM</li>
              <li>
                Dinner: 5:00PM-7:30PM
                (
                <em>except Friday</em>
                )
              </li>
            </ul>
          </div>
          <div>
            <h6>
              Address:
            </h6>
            <p className="mb-0">
              2563 Dole St Honolulu, HI 96822
            </p>
          </div>
        </div>
        <button
          type="button"
          className="directions-button m-2"
          onClick={() => openInMaps('2563 Dole St Honolulu, HI 96822')}
        >
          Get Directions
          <FaMapMarkedAlt className="ms-2 mb-1" />
        </button>
      </Col>
      <Col md={12} lg={9}>
        <Container className="gateway-wrapper">
          <iframe
            className="gateway"
            title="Gateway Café Location"
            width="1130"
            height="800"
            style={{ border: '0', marginTop: '0', marginBottom: '0', marginLeft: '0', marginRight: '0' }}
            id="gmap_canvas"
            src="https://maps.google.com/maps?width=520&amp;height=400&amp;hl=en
        &amp;q=2563%20Dole%20St%20Honolulu+(Gateway%20Caf%C3%A9)
        &amp;t=&amp;z=20&amp;ie=UTF8&amp;iwloc=B&amp;output=embed"
            allowFullScreen
          />
        </Container>
      </Col>
    </Row>

    <Row className="my-3">
      <Col md={12} lg={3} className="">
        <h2 className="header-text my-2">
          <a
            href="https://uhm.sodexomyway.com/en-us/locations/hale-aloha-cafe"
            rel="noreferrer"
            target="_blank"
          >
            Hale Aloha Café
            <FaExternalLinkAlt size={20} className="ms-2" />
          </a>
        </h2>
        <div className="m-2 mt-3 d-flex flex-column">
          <div className="">
            <h6><em>Special Hours:</em></h6>
            <p>
              <em>
                Closed for Winter Break: 12/20/2024 - 1/9/2025
              </em>
            </p>
          </div>
          <div>
            <h6>Regular Hours:</h6>
            <p className="mb-1">Monday-Sunday</p>
            <ul>
              <li>
                Dinner: 5:00PM-7:30PM
              </li>
            </ul>
            <p className="mb-1">Saturday-Sunday</p>
            <ul>
              <li>
                2573 Dole St Honolulu, HI 96822
              </li>
            </ul>
          </div>
          <div>
            <h6>
              Address:
            </h6>
            <p className="mb-0">
              2573 Dole St Honolulu, HI 96822
            </p>
          </div>
        </div>
        <button
          type="button"
          className="directions-button m-2"
          onClick={() => openInMaps('2573 Dole St Honolulu, HI 96822')}
        >
          Get Directions
          <FaMapMarkedAlt className="ms-2 mb-1" />
        </button>
      </Col>
      <Col md={12} lg={9}>
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
      </Col>
    </Row>
  </Container>
);

export default Maps;
