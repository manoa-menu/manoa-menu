import axios from 'axios';

const date = '2024-12-02';
const url = 'https://api-prd.sodexomyway.net/v0.2/data/menu/10230001/29647?date='.concat(date);

const headers = {
  'API-Key': process.env.MMR_API_KEY,
  'Content-Type': 'application/json',
  Accept: 'application/json',
};

axios.get(url, { headers })
  .then(function (response) {
    console.log('Menu Data:', response.data);
  })
  .catch(function (error) {
    console.error('Error fetching menu:', error);
  });
