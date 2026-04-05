import { Controller, Post, Get, Patch, Delete, Param, Body } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';

@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  create(@Body() dto: CreateTenantDto) {
    return this.tenantsService.create(dto);
  }

  @Get(':slug/public')
  getPublicProfile(@Param('slug') slug: string) {
    return this.tenantsService.findBySlug(slug);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.tenantsService.findById(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.tenantsService.update(id, body);
  }

  @Get(':id/availability')
  getAvailability(@Param('id') id: string) {
    return this.tenantsService.getAvailability(id);
  }

  @Patch(':id/availability')
  updateAvailability(@Param('id') id: string, @Body() body: { availability: any[] }) {
    return this.tenantsService.updateAvailability(id, body.availability);
  }

  @Get(':id/holidays')
  getHolidays(@Param('id') id: string) {
    return this.tenantsService.getHolidays(id);
  }

  @Post(':id/holidays')
  addHoliday(@Param('id') id: string, @Body() body: { date: string; name: string; isClosed?: boolean }) {
    return this.tenantsService.addHoliday(id, body);
  }

  @Delete(':id/holidays/:holidayId')
  removeHoliday(@Param('id') id: string, @Param('holidayId') holidayId: string) {
    return this.tenantsService.removeHoliday(id, holidayId);
  }
}
