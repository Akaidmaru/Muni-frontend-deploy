import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user-dto';
<<<<<<< HEAD

export class UpdateUserDto extends PartialType(CreateUserDto) {}
=======
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiPropertyOptional({ example: 'usuario@email.com' })
  email?: string;

  @ApiPropertyOptional({ example: '+573001234567' })
  phone?: string;

  @ApiPropertyOptional({ example: 'Juan Pérez' })
  name?: string;
}
>>>>>>> c0cd806041ac4512d8c8764c65d7ca9ec3a15f9a
