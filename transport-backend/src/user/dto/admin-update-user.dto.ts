<<<<<<< HEAD
=======
<<<<<<< HEAD
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export enum UserRole {
  CLIENT = 'CLIENT',
  DRIVER = 'DRIVER',
  ADMIN = 'ADMIN',
}

export class AdminUpdateUserDto {
  @IsOptional()
  @IsEmail({}, { message: 'El email debe ser válido' })
  email?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password?: string;

  @IsOptional()
  @IsEnum(UserRole, { message: 'El rol debe ser CLIENT, DRIVER o ADMIN' })
=======
>>>>>>> origin/home
import { PartialType } from '@nestjs/mapped-types';
import { AdminCreateUserDto } from './admin-create-user.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../../generated/prisma/enums';

export class AdminUpdateUserDto extends PartialType(AdminCreateUserDto) {
  @ApiPropertyOptional({
    example: 'nuevo@email.com',
    description: 'Nuevo email del usuario',
  })
  email?: string;

  @ApiPropertyOptional({
    example: '+573001234567',
    description: 'Nuevo teléfono del usuario',
  })
  phone?: string;

  @ApiPropertyOptional({
    example: 'Juan Actualizado',
    description: 'Nuevo nombre del usuario',
  })
  name?: string;

  @ApiPropertyOptional({
    example: UserRole.ADMIN,
    enum: UserRole,
    description: 'Nuevo rol del usuario',
  })
<<<<<<< HEAD
=======
>>>>>>> c0cd806041ac4512d8c8764c65d7ca9ec3a15f9a
>>>>>>> origin/home
  role?: UserRole;
}
