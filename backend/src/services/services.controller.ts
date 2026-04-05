import { Controller, Post, Get, Patch, Delete, Query, Body, Param } from '@nestjs/common';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  create(@Body() dto: CreateServiceDto) {
    return this.servicesService.create(dto);
  }

  @Get()
  findByTenant(@Query('tenantId') tenantId: string) {
    return this.servicesService.findByTenant(tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.servicesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Query('tenantId') tenantId: string,
    @Body() dto: UpdateServiceDto,
  ) {
    return this.servicesService.update(id, tenantId, dto);
  }

  @Delete(':id')
  deactivate(@Param('id') id: string, @Query('tenantId') tenantId: string) {
    return this.servicesService.deactivate(id, tenantId);
  }
}
