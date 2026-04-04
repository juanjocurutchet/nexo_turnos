import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProfessionalDto } from './dto/create-professional.dto';

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
        // Disponibilidad por defecto igual a la del negocio
        availability: {
          createMany: {
            data: [
              { dayOfWeek: 0, startTime: '09:00', endTime: '18:00', isAvailable: false },
              { dayOfWeek: 1, startTime: '09:00', endTime: '19:00', isAvailable: true },
              { dayOfWeek: 2, startTime: '09:00', endTime: '19:00', isAvailable: true },
              { dayOfWeek: 3, startTime: '09:00', endTime: '19:00', isAvailable: true },
              { dayOfWeek: 4, startTime: '09:00', endTime: '19:00', isAvailable: true },
              { dayOfWeek: 5, startTime: '09:00', endTime: '19:00', isAvailable: true },
              { dayOfWeek: 6, startTime: '09:00', endTime: '14:00', isAvailable: true },
            ],
          },
        },
      },
      include: { services: { include: { service: true } } },
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
}
