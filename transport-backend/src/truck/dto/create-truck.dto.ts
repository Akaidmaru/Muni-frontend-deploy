import { IsNotEmpty, IsString } from 'class-validator';

export class CreateTruckDto {
  @IsString()
  @IsNotEmpty()
  plate: string;
  @IsString()
  @IsNotEmpty()
  model: string;
}
