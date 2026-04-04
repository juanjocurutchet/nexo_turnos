import { IsString, IsOptional, IsBoolean, IsInt, IsHexColor } from 'class-validator';

export class CreateProfessionalDto {
  @IsString()
  tenantId: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsInt()
  displayOrder?: number;

  // IDs de servicios que puede realizar
  @IsOptional()
  serviceIds?: string[];
}
