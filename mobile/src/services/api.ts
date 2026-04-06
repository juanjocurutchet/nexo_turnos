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

export const adminApi = {
  // Agenda
  getDayBookings: (tenantId: string, date: string) =>
    api.get('/bookings/day', { params: { tenantId, date } }).then((r) => r.data),

  updateBookingStatus: (id: string, tenantId: string, status: string) =>
    api.patch(`/bookings/${id}/status`, { tenantId, status }).then((r) => r.data),

  // Profesionales
  getProfessionals: (tenantId: string) =>
    api.get('/professionals', { params: { tenantId } }).then((r) => r.data),

  getProfessional: (id: string, tenantId: string) =>
    api.get(`/professionals/${id}`, { params: { tenantId } }).then((r) => r.data),

  createProfessional: (data: any) =>
    api.post('/professionals', data).then((r) => r.data),

  updateProfessional: (id: string, tenantId: string, data: any) =>
    api.patch(`/professionals/${id}`, data, { params: { tenantId } }).then((r) => r.data),

  updateProfessionalAvailability: (id: string, tenantId: string, availability: any[]) =>
    api.patch(`/professionals/${id}/availability`, { availability }, { params: { tenantId } }).then((r) => r.data),

  deactivateProfessional: (id: string, tenantId: string) =>
    api.delete(`/professionals/${id}`, { params: { tenantId } }).then((r) => r.data),

  // Servicios
  getServices: (tenantId: string) =>
    api.get('/services', { params: { tenantId } }).then((r) => r.data),

  createService: (data: any) =>
    api.post('/services', data).then((r) => r.data),

  updateService: (id: string, tenantId: string, data: any) =>
    api.patch(`/services/${id}`, data, { params: { tenantId } }).then((r) => r.data),

  deactivateService: (id: string, tenantId: string) =>
    api.delete(`/services/${id}`, { params: { tenantId } }).then((r) => r.data),

  // Horarios del local
  getAvailability: (tenantId: string) =>
    api.get(`/tenants/${tenantId}/availability`).then((r) => r.data),

  updateAvailability: (tenantId: string, availability: any[]) =>
    api.patch(`/tenants/${tenantId}/availability`, { availability }).then((r) => r.data),

  // Configuración del negocio
  getTenant: (tenantId: string) =>
    api.get(`/tenants/${tenantId}/settings`).then((r) => r.data),

  updateTenant: (tenantId: string, data: any) =>
    api.patch(`/tenants/${tenantId}/settings`, data).then((r) => r.data),

  // Feriados
  getHolidays: (tenantId: string) =>
    api.get(`/tenants/${tenantId}/holidays`).then((r) => r.data),

  addHoliday: (tenantId: string, date: string, name: string) =>
    api.post(`/tenants/${tenantId}/holidays`, { date, name }).then((r) => r.data),

  removeHoliday: (tenantId: string, holidayId: string) =>
    api.delete(`/tenants/${tenantId}/holidays/${holidayId}`).then((r) => r.data),

  getNotificationRules: (tenantId: string) =>
    api.get(`/tenants/${tenantId}/notification-rules`).then((r) => r.data),

  updateNotificationRules: (tenantId: string, rules: any[]) =>
    api.patch(`/tenants/${tenantId}/notification-rules`, { rules }).then((r) => r.data),
};
