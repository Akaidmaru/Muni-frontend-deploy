import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
<<<<<<< HEAD
=======
<<<<<<< HEAD

export class CreateUserDto {
=======
>>>>>>> origin/home
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'usuario@email.com' })
<<<<<<< HEAD
=======
>>>>>>> c0cd806041ac4512d8c8764c65d7ca9ec3a15f9a
>>>>>>> origin/home
  @IsEmail()
  @IsNotEmpty()
  email: string;

<<<<<<< HEAD
=======
<<<<<<< HEAD
=======
>>>>>>> origin/home
  @ApiPropertyOptional({ example: '+573001234567' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
<<<<<<< HEAD
=======
>>>>>>> c0cd806041ac4512d8c8764c65d7ca9ec3a15f9a
>>>>>>> origin/home
  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  password: string;

<<<<<<< HEAD
  @ApiPropertyOptional({ example: 'Juan Pérez' })
=======
<<<<<<< HEAD
=======
  @ApiPropertyOptional({ example: 'Juan Pérez' })
>>>>>>> c0cd806041ac4512d8c8764c65d7ca9ec3a15f9a
>>>>>>> origin/home
  @IsOptional()
  @IsString()
  name?: string;
}
