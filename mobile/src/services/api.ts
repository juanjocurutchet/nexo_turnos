import axios from 'axios';
import { Platform } from 'react-native';

const BASE_URL =
  Platform.OS === 'web'
    ? 'http://localhost:3001/api'
    : 'http://192.168.1.98:3001/api';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

export const tenantApi = {
  getPublicProfile: (slug: string) =>
    api.get(`/tenants/${slug}/public`).then((r) => r.data),
};

export const bookingApi = {
  getSlots: (params: {
    tenantId: string;
    serviceId: string;
    professionalId: string;
    date: string;
  }) => api.get('/bookings/slots', { params }).then((r) => r.data),

  create: (data: {
    tenantId: string;
    serviceId: string;
    professionalId: string;
    startTime: string;
    clientFirstName: string;
    clientLastName: string;
    clientPhone: string;
    clientEmail?: string;
    notes?: string;
  }) => api.post('/bookings', data).then((r) => r.data),
};
