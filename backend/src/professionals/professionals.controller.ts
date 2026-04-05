import { Controller, Post, Get, Patch, Delete, Query, Body, Param } from '@nestjs/common';
import { ProfessionalsService } from './professionals.service';
import { CreateProfessionalDto } from './dto/create-professional.dto';
import { UpdateProfessionalDto, UpdateAvailabilityDto } from './dto/update-professional.dto';

@Controller('professionals')
export class ProfessionalsController {
  constructor(private readonly professionalsService: ProfessionalsService) {}

  @Post()
  create(@Body() dto: CreateProfessionalDto) {
    return this.professionalsService.create(dto);
  }

  @Get()
  findByTenant(@Query('tenantId') tenantId: string) {
    return this.professionalsService.findByTenant(tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Query('tenantId') tenantId: string) {
    return this.professionalsService.findOne(id, tenantId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Query('tenantId') tenantId: string,
    @Body() dto: UpdateProfessionalDto,
  ) {
    return this.professionalsService.update(id, tenantId, dto);
  }

  @Patch(':id/availability')
  updateAvailability(
    @Param('id') id: string,
    @Query('tenantId') tenantId: string,
    @Body() dto: UpdateAvailabilityDto,
  ) {
    return this.professionalsService.updateAvailability(id, tenantId, dto);
  }

  @Delete(':id')
  deactivate(@Param('id') id: string, @Query('tenantId') tenantId: string) {
    return this.professionalsService.deactivate(id, tenantId);
  }
}
