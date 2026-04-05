import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProfessionalDto } from './dto/create-professional.dto';
import { UpdateProfessionalDto, UpdateAvailabilityDto } from './dto/update-professional.dto';

@Injectable()
export class ProfessionalsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProfessionalDto) {
    const { serviceIds, ...data } = dto;

    return this.prisma.professional.create({
      data: {
        ...data,
        services: serviceIds?.length
          ? { create: serviceIds.map((id) => ({ serviceId: id })) }
          : undefined,
        availability: {
          createMany: {
            data: [
              { dayOfWeek: 0, startTime: '09:00', endTime: '21:00', isAvailable: false },
              { dayOfWeek: 1, startTime: '09:00', endTime: '21:00', isAvailable: true },
              { dayOfWeek: 2, startTime: '09:00', endTime: '21:00', isAvailable: true },
              { dayOfWeek: 3, startTime: '09:00', endTime: '21:00', isAvailable: true },
              { dayOfWeek: 4, startTime: '09:00', endTime: '21:00', isAvailable: true },
              { dayOfWeek: 5, startTime: '09:00', endTime: '21:00', isAvailable: true },
              { dayOfWeek: 6, startTime: '09:00', endTime: '15:00', isAvailable: true },
            ],
          },
        },
      },
      include: {
        services: { include: { service: true } },
        availability: { orderBy: { dayOfWeek: 'asc' } },
      },
    });
  }

  async findByTenant(tenantId: string) {
    return this.prisma.professional.findMany({
      where: { tenantId, isActive: true },
      orderBy: { displayOrder: 'asc' },
      include: {
        services: { include: { service: true } },
        availability: { orderBy: { dayOfWeek: 'asc' } },
      },
    });
  }

  async findOne(id: string, tenantId: string) {
    const prof = await this.prisma.professional.findFirst({
      where: { id, tenantId },
      include: {
        services: { include: { service: true } },
        availability: { orderBy: { dayOfWeek: 'asc' } },
      },
    });
    if (!prof) throw new NotFoundException('Profesional no encontrado');
    return prof;
  }

  async update(id: string, tenantId: string, dto: UpdateProfessionalDto) {
    const prof = await this.prisma.professional.findFirst({ where: { id, tenantId } });
    if (!prof) throw new NotFoundException('Profesional no encontrado');

    const { serviceIds, ...data } = dto;

    // Si vienen serviceIds, reemplazar las asignaciones
    if (serviceIds !== undefined) {
      await this.prisma.professionalService.deleteMany({ where: { professionalId: id } });
      if (serviceIds.length) {
        await this.prisma.professionalService.createMany({
          data: serviceIds.map((serviceId) => ({ professionalId: id, serviceId })),
        });
      }
    }

    return this.prisma.professional.update({
      where: { id },
      data,
      include: {
        services: { include: { service: true } },
        availability: { orderBy: { dayOfWeek: 'asc' } },
      },
    });
  }

  async updateAvailability(id: string, tenantId: string, dto: UpdateAvailabilityDto) {
    const prof = await this.prisma.professional.findFirst({ where: { id, tenantId } });
    if (!prof) throw new NotFoundException('Profesional no encontrado');

    // Upsert cada día de la semana
    await Promise.all(
      dto.availability.map((day) =>
        this.prisma.professionalAvailability.upsert({
          where: { professionalId_dayOfWeek: { professionalId: id, dayOfWeek: day.dayOfWeek } },
          update: { startTime: day.startTime, endTime: day.endTime, isAvailable: day.isAvailable },
          create: { professionalId: id, ...day },
        }),
      ),
    );

    return this.prisma.professionalAvailability.findMany({
      where: { professionalId: id },
      orderBy: { dayOfWeek: 'asc' },
    });
  }

  async deactivate(id: string, tenantId: string) {
    const prof = await this.prisma.professional.findFirst({ where: { id, tenantId } });
    if (!prof) throw new NotFoundException('Profesional no encontrado');
    return this.prisma.professional.update({ where: { id }, data: { isActive: false } });
  }
}
