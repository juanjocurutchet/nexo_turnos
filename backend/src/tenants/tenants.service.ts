import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTenantDto } from './dto/create-tenant.dto';

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTenantDto) {
    const existing = await this.prisma.tenant.findUnique({ where: { slug: dto.slug } });
    if (existing) {
      throw new ConflictException(`El slug "${dto.slug}" ya está en uso`);
    }

    const tenant = await this.prisma.tenant.create({
      data: {
        ...dto,
        availability: {
          createMany: {
            data: this.defaultWeeklyAvailability(),
          },
        },
      },
      include: { availability: true },
    });

    return tenant;
  }

  async findBySlug(slug: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
      include: {
        professionals: {
          where: { isActive: true },
          orderBy: { displayOrder: 'asc' },
          include: {
            services: { include: { service: true } },
          },
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

  // Disponibilidad por defecto: Lun-Vie 9-19, Sáb 9-14, Dom cerrado
  private defaultWeeklyAvailability() {
    return [
      { dayOfWeek: 0, openTime: '09:00', closeTime: '21:00', isOpen: false }, // Dom
      { dayOfWeek: 1, openTime: '09:00', closeTime: '21:00', isOpen: true },  // Lun
      { dayOfWeek: 2, openTime: '09:00', closeTime: '21:00', isOpen: true },  // Mar
      { dayOfWeek: 3, openTime: '09:00', closeTime: '21:00', isOpen: true },  // Mié
      { dayOfWeek: 4, openTime: '09:00', closeTime: '21:00', isOpen: true },  // Jue
      { dayOfWeek: 5, openTime: '09:00', closeTime: '21:00', isOpen: true },  // Vie
      { dayOfWeek: 6, openTime: '09:00', closeTime: '15:00', isOpen: true },  // Sáb
    ];
  }
}
