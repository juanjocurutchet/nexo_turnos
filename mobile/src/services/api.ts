import axios from 'axios';

// En desarrollo apunta al backend local
// En producción cambiar por la URL del servidor
const BASE_URL = 'http://192.168.1.98:3001/api'; // IP local de la PC — Expo Go en dispositivo físico
// const BASE_URL = 'http://10.0.2.2:3001/api'; // Android emulator
// const BASE_URL = 'http://localhost:3001/api';  // iOS simulator / web

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
