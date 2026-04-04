export interface Tenant {
  id: string;
  slug: string;
  name: string;
  description?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  logoUrl?: string;
  plan: 'FREE' | 'PRO' | 'ENTERPRISE';
  services: Service[];
  professionals: Professional[];
  availability: WeeklyAvailability[];
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  durationMin: number;
  price: string;
  depositAmount?: string;
  emoji?: string;
  category?: ServiceCategory;
}

export interface ServiceCategory {
  id: string;
  name: string;
  emoji?: string;
}

export interface Professional {
  id: string;
  firstName: string;
  lastName: string;
  bio?: string;
  avatarUrl?: string;
  color: string;
  services: { service: Service }[];
}

export interface WeeklyAvailability {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isOpen: boolean;
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

export interface Booking {
  id: string;
  startTime: string;
  endTime: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  totalPrice: string;
  client: {
    firstName: string;
    lastName: string;
    phone: string;
  };
  service: Service;
  professional: Professional;
  tenant: { name: string };
}

// Navegación
export type RootStackParamList = {
  TenantProfile: { slug: string };
  SelectService: { tenant: Tenant };
  SelectProfessional: { tenant: Tenant; service: Service };
  SelectDateTime: { tenant: Tenant; service: Service; professional: Professional | null };
  ClientInfo: {
    tenant: Tenant;
    service: Service;
    professional: Professional;
    date: string;
    time: string;
  };
  BookingConfirmed: { booking: Booking };
};
