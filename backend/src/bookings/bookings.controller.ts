import { Controller, Post, Get, Patch, Param, Body, Query } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { BookingStatus } from '@prisma/client';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  // GET /bookings/slots?tenantId=...&serviceId=...&professionalId=...&date=2026-04-11
  @Get('slots')
  getSlots(
    @Query('tenantId') tenantId: string,
    @Query('serviceId') serviceId: string,
    @Query('professionalId') professionalId: string,
    @Query('date') date: string,
  ) {
    return this.bookingsService.getAvailableSlots(tenantId, serviceId, professionalId, date);
  }

  // POST /bookings
  @Post()
  create(@Body() dto: CreateBookingDto) {
    return this.bookingsService.create(dto);
  }

  // GET /bookings/day?tenantId=...&date=2026-04-11
  @Get('day')
  getDayBookings(
    @Query('tenantId') tenantId: string,
    @Query('date') date: string,
  ) {
    return this.bookingsService.getDayBookings(tenantId, date);
  }

  // PATCH /bookings/:id/status
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() body: { tenantId: string; status: BookingStatus },
  ) {
    return this.bookingsService.updateStatus(id, body.tenantId, body.status);
  }
}
