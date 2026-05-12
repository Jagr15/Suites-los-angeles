import axios from 'axios';

const apiKey = process.env.CODIGOS_ZIP_API_KEY;

if (!apiKey) {
  throw new Error('Missing CODIGOS_ZIP_API_KEY');
}

const mexicoApi = axios.create({
  baseURL: 'https://api.codigos.zip/api',
  timeout: 10000,
  headers: {
    'X-API-Key': apiKey,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

export default mexicoApi;
