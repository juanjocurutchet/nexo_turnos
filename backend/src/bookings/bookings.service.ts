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

  async getAvailableSlots(
    tenantId: string,
    serviceId: string,
    professionalId: string,
    date: string,
  ) {
    const service = await this.prisma.service.findFirst({
      where: { id: serviceId, tenantId },
    });
    if (!service) throw new NotFoundException('Servicio no encontrado');

    const dateObj = new Date(`${date}T12:00:00.000Z`);
    const dayOfWeek = dateObj.getUTCDay();

    const tenantAvailability = await this.prisma.weeklyAvailability.findUnique({
      where: { tenantId_dayOfWeek: { tenantId, dayOfWeek } },
    });
    if (!tenantAvailability?.isOpen) return [];

    const profAvailability = await this.prisma.professionalAvailability.findUnique({
      where: { professionalId_dayOfWeek: { professionalId, dayOfWeek } },
    });

    const useProf = profAvailability?.isAvailable;
    const shift1Start = useProf ? profAvailability!.startTime : tenantAvailability.openTime;
    const shift1End   = useProf ? profAvailability!.endTime   : tenantAvailability.closeTime;
    const shift2Start = useProf ? profAvailability!.startTime2 : tenantAvailability.openTime2;
    const shift2End   = useProf ? profAvailability!.endTime2   : tenantAvailability.closeTime2;

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

    const allSlots = [
      ...this.generateSlots(date, shift1Start, shift1End, service.durationMin, existingBookings),
      ...(shift2Start && shift2End
        ? this.generateSlots(date, shift2Start, shift2End, service.durationMin, existingBookings)
        : []),
    ];

    const seen = new Set<string>();
    return allSlots.filter(s => {
      if (seen.has(s.time)) return false;
      seen.add(s.time);
      return true;
    });
  }

  async create(dto: CreateBookingDto) {
    const service = await this.prisma.service.findFirst({
      where: { id: dto.serviceId, tenantId: dto.tenantId },
    });
    if (!service) throw new NotFoundException('Servicio no encontrado');

    const startTime = new Date(dto.startTime);
    const endTime = new Date(startTime.getTime() + service.durationMin * 60000);

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

    return this.prisma.booking.create({
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
  }

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
      include: { client: true, service: true, professional: true },
      orderBy: { startTime: 'asc' },
    });
  }

  async updateStatus(id: string, tenantId: string, status: BookingStatus) {
    const booking = await this.prisma.booking.findFirst({ where: { id, tenantId } });
    if (!booking) throw new NotFoundException('Turno no encontrado');

    const data: any = { status };
    if (status === BookingStatus.CONFIRMED) data.confirmedAt = new Date();
    if (status === BookingStatus.CANCELLED) data.cancelledAt = new Date();

    return this.prisma.booking.update({ where: { id }, data });
  }

  private generateSlots(
    date: string,
    openTime: string,
    closeTime: string,
    durationMin: number,
    existingBookings: any[],
  ) {
    const [openH, openM] = openTime.split(':').map(Number);
    const [closeH, closeM] = closeTime.split(':').map(Number);
    const openMinutes  = openH  * 60 + openM;
    const closeMinutes = closeH * 60 + closeM;
    const candidates = new Set<number>();
    for (let t = openMinutes; t + durationMin <= closeMinutes; t += durationMin) {
      candidates.add(t);
    }

    for (const b of existingBookings) {
      const endMin = b.endTime.getUTCHours() * 60 + b.endTime.getUTCMinutes();
      if (endMin >= openMinutes && endMin + durationMin <= closeMinutes) {
        candidates.add(endMin);
      }
    }

    const slots: { time: string; available: boolean }[] = [];

    for (const startMin of Array.from(candidates).sort((a, b) => a - b)) {
      const current = new Date(`${date}T00:00:00.000Z`);
      current.setUTCHours(Math.floor(startMin / 60), startMin % 60, 0, 0);
      const slotEnd = new Date(current.getTime() + durationMin * 60000);

      const hasConflict = existingBookings.some(
        (b) =>
          (current >= b.startTime && current < b.endTime) ||
          (slotEnd > b.startTime && slotEnd <= b.endTime) ||
          (current <= b.startTime && slotEnd >= b.endTime),
      );

      const hh = String(current.getUTCHours()).padStart(2, '0');
      const mm = String(current.getUTCMinutes()).padStart(2, '0');
      slots.push({ time: `${hh}:${mm}`, available: !hasConflict });
    }

    return slots;
  }
}
