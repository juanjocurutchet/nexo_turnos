import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTenantDto } from './dto/create-tenant.dto';

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTenantDto) {
    const existing = await this.prisma.tenant.findUnique({ where: { slug: dto.slug } });
    if (existing) throw new ConflictException(`El slug "${dto.slug}" ya está en uso`);

    return this.prisma.tenant.create({
      data: {
        ...dto,
        availability: { createMany: { data: this.defaultWeeklyAvailability() } },
      },
      include: { availability: true },
    });
  }

  async findBySlug(slug: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
      include: {
        professionals: {
          where: { isActive: true },
          orderBy: { displayOrder: 'asc' },
          include: { services: { include: { service: true } } },
        },
        services: {
          where: { isActive: true },
          orderBy: { displayOrder: 'asc' },
          include: { category: true },
        },
        availability: { orderBy: { dayOfWeek: 'asc' } },
      },
    });
    if (!tenant) throw new NotFoundException(`Negocio "${slug}" no encontrado`);
    return tenant;
  }

  async findById(id: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) throw new NotFoundException('Negocio no encontrado');
    return tenant;
  }

  async update(id: string, data: {
    name?: string;
    city?: string;
    phone?: string;
    address?: string;
    instagram?: string;
    facebook?: string;
    whatsappNumber?: string;
    logoUrl?: string;
  }) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) throw new NotFoundException('Negocio no encontrado');
    return this.prisma.tenant.update({ where: { id }, data });
  }

  async getAvailability(tenantId: string) {
    return this.prisma.weeklyAvailability.findMany({
      where: { tenantId },
      orderBy: { dayOfWeek: 'asc' },
    });
  }

  async updateAvailability(
    tenantId: string,
    days: {
      dayOfWeek: number;
      openTime: string;
      closeTime: string;
      openTime2?: string | null;
      closeTime2?: string | null;
      isOpen: boolean;
    }[],
  ) {
    await Promise.all(
      days.map((day) =>
        this.prisma.weeklyAvailability.upsert({
          where: { tenantId_dayOfWeek: { tenantId, dayOfWeek: day.dayOfWeek } },
          update: {
            openTime: day.openTime,
            closeTime: day.closeTime,
            openTime2: day.openTime2 ?? null,
            closeTime2: day.closeTime2 ?? null,
            isOpen: day.isOpen,
          },
          create: { tenantId, ...day },
        }),
      ),
    );
    return this.getAvailability(tenantId);
  }

  async getHolidays(tenantId: string) {
    return this.prisma.holiday.findMany({
      where: { tenantId },
      orderBy: { date: 'asc' },
    });
  }

  async addHoliday(tenantId: string, body: { date: string; name: string; isClosed?: boolean }) {
    return this.prisma.holiday.create({
      data: {
        tenantId,
        date: new Date(body.date),
        name: body.name,
        isClosed: body.isClosed ?? true,
      },
    });
  }

  async removeHoliday(tenantId: string, holidayId: string) {
    const holiday = await this.prisma.holiday.findFirst({ where: { id: holidayId, tenantId } });
    if (!holiday) throw new NotFoundException('Feriado no encontrado');
    return this.prisma.holiday.delete({ where: { id: holidayId } });
  }

  private defaultWeeklyAvailability() {
    return [
      { dayOfWeek: 0, openTime: '09:00', closeTime: '21:00', isOpen: false },
      { dayOfWeek: 1, openTime: '09:00', closeTime: '21:00', isOpen: true },
      { dayOfWeek: 2, openTime: '09:00', closeTime: '21:00', isOpen: true },
      { dayOfWeek: 3, openTime: '09:00', closeTime: '21:00', isOpen: true },
      { dayOfWeek: 4, openTime: '09:00', closeTime: '21:00', isOpen: true },
      { dayOfWeek: 5, openTime: '09:00', closeTime: '21:00', isOpen: true },
      { dayOfWeek: 6, openTime: '09:00', closeTime: '15:00', isOpen: true },
    ];
  }
}
