import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
<<<<<<< HEAD

export enum UserRole {
  CLIENT = 'CLIENT',
  DRIVER = 'DRIVER',
  ADMIN = 'ADMIN',
}

export class AdminCreateUserDto {
=======
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../../generated/prisma/enums';

export class AdminCreateUserDto {
  @ApiProperty({ example: 'admin@email.com', description: 'Email del usuario' })
>>>>>>> c0cd806041ac4512d8c8764c65d7ca9ec3a15f9a
  @IsEmail({}, { message: 'El email debe ser válido' })
  @IsNotEmpty({ message: 'El email es requerido' })
  email: string;

<<<<<<< HEAD
=======
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
>>>>>>> c0cd806041ac4512d8c8764c65d7ca9ec3a15f9a
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  password: string;

<<<<<<< HEAD
=======
  @ApiPropertyOptional({
    example: 'Juan Pérez',
    description: 'Nombre del usuario',
  })
>>>>>>> c0cd806041ac4512d8c8764c65d7ca9ec3a15f9a
  @IsOptional()
  @IsString()
  name?: string;

<<<<<<< HEAD
=======
  @ApiPropertyOptional({
    example: UserRole.ADMIN,
    enum: UserRole,
    description: 'Rol del usuario',
  })
>>>>>>> c0cd806041ac4512d8c8764c65d7ca9ec3a15f9a
  @IsOptional()
  @IsEnum(UserRole, { message: 'El rol debe ser CLIENT, DRIVER o ADMIN' })
  role?: UserRole;
}
