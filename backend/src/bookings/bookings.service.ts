import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { BookingStatus } from '@prisma/client';

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Obtener slots disponibles para una fecha ────────────────────────────────
  async getAvailableSlots(
    tenantId: string,
    serviceId: string,
    professionalId: string,
    date: string, // "2026-04-11"
  ) {
    const service = await this.prisma.service.findFirst({
      where: { id: serviceId, tenantId },
    });
    if (!service) throw new NotFoundException('Servicio no encontrado');

    const dateObj = new Date(date);
    const dayOfWeek = dateObj.getDay();

    // Verificar que el negocio esté abierto ese día
    const tenantAvailability = await this.prisma.weeklyAvailability.findUnique({
      where: { tenantId_dayOfWeek: { tenantId, dayOfWeek } },
    });
    if (!tenantAvailability?.isOpen) return [];

    // Verificar que el profesional esté disponible ese día
    const profAvailability = await this.prisma.professionalAvailability.findUnique({
      where: { professionalId_dayOfWeek: { professionalId, dayOfWeek } },
    });

    const startHour = profAvailability?.isAvailable
      ? profAvailability.startTime
      : tenantAvailability.openTime;
    const endHour = profAvailability?.isAvailable
      ? profAvailability.endTime
      : tenantAvailability.closeTime;

    // Obtener turnos ya reservados en esa fecha para ese profesional
    // Usamos UTC puro para evitar bugs de timezone
    const startOfDay = new Date(`${date}T00:00:00.000Z`);
    const endOfDay = new Date(`${date}T23:59:59.999Z`);

    const existingBookings = await this.prisma.booking.findMany({
      where: {
        professionalId,
        tenantId,
        startTime: { gte: startOfDay, lte: endOfDay },
        status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
      },
    });

    // Generar slots cada 30 minutos dentro del horario disponible
    const slots = this.generateSlots(
      date,
      startHour,
      endHour,
      service.durationMin,
      existingBookings,
    );

    return slots;
  }

  // ── Crear turno ──────────────────────────────────────────────────────────────
  async create(dto: CreateBookingDto) {
    const service = await this.prisma.service.findFirst({
      where: { id: dto.serviceId, tenantId: dto.tenantId },
    });
    if (!service) throw new NotFoundException('Servicio no encontrado');

    const startTime = new Date(dto.startTime);
    const endTime = new Date(startTime.getTime() + service.durationMin * 60000);

    // Verificar disponibilidad (no haya colisión)
    const conflict = await this.prisma.booking.findFirst({
      where: {
        professionalId: dto.professionalId,
        tenantId: dto.tenantId,
        status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
        OR: [
          { startTime: { gte: startTime, lt: endTime } },
          { endTime: { gt: startTime, lte: endTime } },
          { startTime: { lte: startTime }, endTime: { gte: endTime } },
        ],
      },
    });
    if (conflict) throw new BadRequestException('Ese horario ya no está disponible');

    // Crear o encontrar el cliente
    const client = await this.prisma.client.upsert({
      where: { tenantId_phone: { tenantId: dto.tenantId, phone: dto.clientPhone } },
      update: { firstName: dto.clientFirstName, lastName: dto.clientLastName, email: dto.clientEmail },
      create: {
        tenantId: dto.tenantId,
        firstName: dto.clientFirstName,
        lastName: dto.clientLastName,
        phone: dto.clientPhone,
        email: dto.clientEmail,
      },
    });

    const booking = await this.prisma.booking.create({
      data: {
        tenantId: dto.tenantId,
        clientId: client.id,
        serviceId: dto.serviceId,
        professionalId: dto.professionalId,
        startTime,
        endTime,
        totalPrice: service.price,
        notes: dto.notes,
        source: 'ONLINE',
      },
      include: {
        client: true,
        service: true,
        professional: true,
        tenant: { select: { name: true, phone: true, address: true } },
      },
    });

    return booking;
  }

  // ── Turnos del día para el dashboard ────────────────────────────────────────
  async getDayBookings(tenantId: string, date: string) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.prisma.booking.findMany({
      where: {
        tenantId,
        startTime: { gte: startOfDay, lte: endOfDay },
      },
      include: {
        client: true,
        service: true,
        professional: true,
      },
      orderBy: { startTime: 'asc' },
    });
  }

  // ── Cambiar estado de un turno ───────────────────────────────────────────────
  async updateStatus(id: string, tenantId: string, status: BookingStatus) {
    const booking = await this.prisma.booking.findFirst({ where: { id, tenantId } });
    if (!booking) throw new NotFoundException('Turno no encontrado');

    const data: any = { status };
    if (status === BookingStatus.CONFIRMED) data.confirmedAt = new Date();
    if (status === BookingStatus.CANCELLED) data.cancelledAt = new Date();

    return this.prisma.booking.update({ where: { id }, data });
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────
  private generateSlots(
    date: string,
    openTime: string,
    closeTime: string,
    durationMin: number,
    existingBookings: any[],
  ) {
    const slots: { time: string; available: boolean }[] = [];
    const [openH, openM] = openTime.split(':').map(Number);
    const [closeH, closeM] = closeTime.split(':').map(Number);

    // UTC puro para evitar bugs de timezone
    const current = new Date(`${date}T00:00:00.000Z`);
    current.setUTCHours(openH, openM, 0, 0);

    const end = new Date(`${date}T00:00:00.000Z`);
    end.setUTCHours(closeH, closeM, 0, 0);

    while (current < end) {
      const slotEnd = new Date(current.getTime() + durationMin * 60000);
      if (slotEnd > end) break;

      const hasConflict = existingBookings.some(
        (b) =>
          (current >= b.startTime && current < b.endTime) ||
          (slotEnd > b.startTime && slotEnd <= b.endTime) ||
          (current <= b.startTime && slotEnd >= b.endTime),
      );

      const hh = String(current.getUTCHours()).padStart(2, '0');
      const mm = String(current.getUTCMinutes()).padStart(2, '0');
      slots.push({ time: `${hh}:${mm}`, available: !hasConflict });

      current.setUTCMinutes(current.getUTCMinutes() + 30);
    }

    return slots;
  }
}
