import { PartialType } from '@nestjs/mapped-types';
import { CreateTruckDto } from './create-truck.dto';
<<<<<<< HEAD

export class UpdateTruckDto extends PartialType(CreateTruckDto) {}
=======
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateTruckDto extends PartialType(CreateTruckDto) {
  @ApiPropertyOptional({
    example: 'DEF456',
    description: 'Placa nueva del camión',
  })
  plate?: string;

  @ApiPropertyOptional({
    example: 'Scania R',
    description: 'Modelo nuevo del camión',
  })
  model?: string;
}
>>>>>>> c0cd806041ac4512d8c8764c65d7ca9ec3a15f9a
