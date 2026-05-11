import axios from 'axios';

const mexicoApi = axios.create({
  baseURL: 'https://api.codigos.zip/api',
  timeout: 10000,
  headers: {
    'X-API-Key': 'zp_bda94580177293be483e6d5a4f7577af8ecde3879d2583aa',
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

export default mexicoApi;
