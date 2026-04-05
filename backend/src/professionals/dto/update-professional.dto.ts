import { IsString, IsOptional, IsBoolean, IsInt, IsArray } from 'class-validator';

export class UpdateProfessionalDto {
  @IsOptional() @IsString()  firstName?: string;
  @IsOptional() @IsString()  lastName?: string;
  @IsOptional() @IsString()  bio?: string;
  @IsOptional() @IsString()  color?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsInt()     displayOrder?: number;
  @IsOptional() @IsArray()   serviceIds?: string[];
}

export class UpdateAvailabilityDto {
  @IsArray()
  availability: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    startTime2?: string | null;
    endTime2?: string | null;
    isAvailable: boolean;
  }[];
}
