import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateServiceDto) {
    return this.prisma.service.create({
      data: dto,
      include: { category: true },
    });
  }

  async findByTenant(tenantId: string) {
    return this.prisma.service.findMany({
      where: { tenantId, isActive: true },
      orderBy: { displayOrder: 'asc' },
      include: { category: true },
    });
  }

  async findOne(id: string) {
    const service = await this.prisma.service.findUnique({ where: { id } });
    if (!service) throw new NotFoundException('Servicio no encontrado');
    return service;
  }

  async update(id: string, tenantId: string, dto: UpdateServiceDto) {
    const service = await this.prisma.service.findFirst({ where: { id, tenantId } });
    if (!service) throw new NotFoundException('Servicio no encontrado');
    return this.prisma.service.update({ where: { id }, data: dto, include: { category: true } });
  }

  async deactivate(id: string, tenantId: string) {
    const service = await this.prisma.service.findFirst({ where: { id, tenantId } });
    if (!service) throw new NotFoundException('Servicio no encontrado');
    return this.prisma.service.update({ where: { id }, data: { isActive: false } });
  }
}
