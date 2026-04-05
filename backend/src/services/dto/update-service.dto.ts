import { IsString, IsNumber, IsOptional, IsBoolean, IsPositive, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateServiceDto {
  @IsOptional() @IsString()  name?: string;
  @IsOptional() @IsString()  description?: string;
  @IsOptional() @IsNumber() @IsPositive() @Type(() => Number) durationMin?: number;
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number) price?: number;
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number) depositAmount?: number;
  @IsOptional() @IsString()  emoji?: string;
  @IsOptional() @IsString()  categoryId?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsNumber()  displayOrder?: number;
}
