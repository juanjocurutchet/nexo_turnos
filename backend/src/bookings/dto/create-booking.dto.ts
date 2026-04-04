import { IsString, IsDateString, IsOptional, IsPhoneNumber } from 'class-validator';

export class CreateBookingDto {
  @IsString()
  tenantId: string;

  @IsString()
  serviceId: string;

  @IsString()
  professionalId: string;

  @IsDateString()
  startTime: string;

  // Datos del cliente (se crea/actualiza automáticamente)
  @IsString()
  clientFirstName: string;

  @IsString()
  clientLastName: string;

  @IsString()
  clientPhone: string;

  @IsOptional()
  @IsString()
  clientEmail?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
