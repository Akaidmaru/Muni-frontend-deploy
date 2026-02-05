import { IsNotEmpty, IsString } from 'class-validator';
<<<<<<< HEAD

export class CreateTruckDto {
  @IsString()
  @IsNotEmpty()
  plate: string;
=======
import { ApiProperty } from '@nestjs/swagger';

export class CreateTruckDto {
  @ApiProperty({ example: 'ABC123', description: 'Placa del camión' })
  @IsString()
  @IsNotEmpty()
  plate: string;

  @ApiProperty({ example: 'Volvo FH', description: 'Modelo del camión' })
>>>>>>> c0cd806041ac4512d8c8764c65d7ca9ec3a15f9a
  @IsString()
  @IsNotEmpty()
  model: string;
}
