import { create } from 'zustand';
import { Service, Professional, Tenant } from '../types';

interface BookingState {
  tenant: Tenant | null;
  selectedService: Service | null;
  selectedProfessional: Professional | null;
  selectedDate: string | null;   // "2026-04-11"
  selectedTime: string | null;   // "11:00"

  setTenant: (t: Tenant) => void;
  setService: (s: Service) => void;
  setProfessional: (p: Professional | null) => void;
  setDateTime: (date: string, time: string) => void;
  reset: () => void;
}

export const useBookingStore = create<BookingState>((set) => ({
  tenant: null,
  selectedService: null,
  selectedProfessional: null,
  selectedDate: null,
  selectedTime: null,

  setTenant: (tenant) => set({ tenant }),
  setService: (selectedService) => set({ selectedService, selectedProfessional: null, selectedDate: null, selectedTime: null }),
  setProfessional: (selectedProfessional) => set({ selectedProfessional }),
  setDateTime: (selectedDate, selectedTime) => set({ selectedDate, selectedTime }),
  reset: () => set({ selectedService: null, selectedProfessional: null, selectedDate: null, selectedTime: null }),
}));
