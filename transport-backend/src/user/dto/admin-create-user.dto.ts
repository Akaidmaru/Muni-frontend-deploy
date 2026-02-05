import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
<<<<<<< HEAD
=======
<<<<<<< HEAD

export enum UserRole {
  CLIENT = 'CLIENT',
  DRIVER = 'DRIVER',
  ADMIN = 'ADMIN',
}

export class AdminCreateUserDto {
=======
>>>>>>> origin/home
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../../generated/prisma/enums';

export class AdminCreateUserDto {
  @ApiProperty({ example: 'admin@email.com', description: 'Email del usuario' })
<<<<<<< HEAD
=======
>>>>>>> c0cd806041ac4512d8c8764c65d7ca9ec3a15f9a
>>>>>>> origin/home
  @IsEmail({}, { message: 'El email debe ser válido' })
  @IsNotEmpty({ message: 'El email es requerido' })
  email: string;

<<<<<<< HEAD
=======
<<<<<<< HEAD
=======
>>>>>>> origin/home
  @ApiPropertyOptional({
    example: '+573001234567',
    description: 'Teléfono del usuario',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    example: 'password123',
    description: 'Contraseña del usuario',
  })
<<<<<<< HEAD
=======
>>>>>>> c0cd806041ac4512d8c8764c65d7ca9ec3a15f9a
>>>>>>> origin/home
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  password: string;

<<<<<<< HEAD
=======
<<<<<<< HEAD
=======
>>>>>>> origin/home
  @ApiPropertyOptional({
    example: 'Juan Pérez',
    description: 'Nombre del usuario',
  })
<<<<<<< HEAD
=======
>>>>>>> c0cd806041ac4512d8c8764c65d7ca9ec3a15f9a
>>>>>>> origin/home
  @IsOptional()
  @IsString()
  name?: string;

<<<<<<< HEAD
=======
<<<<<<< HEAD
=======
>>>>>>> origin/home
  @ApiPropertyOptional({
    example: UserRole.ADMIN,
    enum: UserRole,
    description: 'Rol del usuario',
  })
<<<<<<< HEAD
=======
>>>>>>> c0cd806041ac4512d8c8764c65d7ca9ec3a15f9a
>>>>>>> origin/home
  @IsOptional()
  @IsEnum(UserRole, { message: 'El rol debe ser CLIENT, DRIVER o ADMIN' })
  role?: UserRole;
}
