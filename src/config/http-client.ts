import axios, { type AxiosInstance } from 'axios';
import { env } from './env';

export const brasilApiClient: AxiosInstance = axios.create({
  baseURL: env.BRASIL_API_BASE_URL,
  timeout: 10_000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

export const receitaWsClient: AxiosInstance = axios.create({
  baseURL: env.RECEITAWS_BASE_URL,
  timeout: 10_000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});
