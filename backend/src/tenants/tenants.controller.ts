import { Controller, Post, Get, Param, Body } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';

@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  create(@Body() dto: CreateTenantDto) {
    return this.tenantsService.create(dto);
  }

  // Ruta pública: perfil del negocio para el cliente final
  @Get(':slug/public')
  getPublicProfile(@Param('slug') slug: string) {
    return this.tenantsService.findBySlug(slug);
  }
}
