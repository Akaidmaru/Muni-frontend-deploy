import { IsInt } from 'class-validator';
<<<<<<< HEAD
=======
<<<<<<< HEAD

export class AssignUserDto {
  @IsInt()
  userId: number;

=======
>>>>>>> origin/home
import { ApiProperty } from '@nestjs/swagger';

export class AssignUserDto {
  @ApiProperty({ example: 1, description: 'ID del usuario a asignar' })
  @IsInt()
  userId: number;

  @ApiProperty({ example: 2, description: 'ID del camión al que se asigna el usuario' })
<<<<<<< HEAD
=======
>>>>>>> c0cd806041ac4512d8c8764c65d7ca9ec3a15f9a
>>>>>>> origin/home
  @IsInt()
  truckId: number;
}
