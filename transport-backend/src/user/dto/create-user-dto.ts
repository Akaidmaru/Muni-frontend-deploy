import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
<<<<<<< HEAD

export class CreateUserDto {
=======
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'usuario@email.com' })
>>>>>>> c0cd806041ac4512d8c8764c65d7ca9ec3a15f9a
  @IsEmail()
  @IsNotEmpty()
  email: string;

<<<<<<< HEAD
=======
  @ApiPropertyOptional({ example: '+573001234567' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
>>>>>>> c0cd806041ac4512d8c8764c65d7ca9ec3a15f9a
  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  password: string;

<<<<<<< HEAD
=======
  @ApiPropertyOptional({ example: 'Juan Pérez' })
>>>>>>> c0cd806041ac4512d8c8764c65d7ca9ec3a15f9a
  @IsOptional()
  @IsString()
  name?: string;
}
