import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
<<<<<<< HEAD
=======
<<<<<<< HEAD
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user-dto';
import { LoginDto } from './dto/login-dto';
=======
>>>>>>> origin/home
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user-dto';
import { LoginDto } from './dto/login-dto';
import { SendVerificationCodeDto } from './dto/send-verification-code.dto';
import { VerifyCodeDto } from './dto/verify-code.dto';
<<<<<<< HEAD
=======
>>>>>>> c0cd806041ac4512d8c8764c65d7ca9ec3a15f9a
>>>>>>> origin/home
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
<<<<<<< HEAD
=======
<<<<<<< HEAD
=======
>>>>>>> origin/home
  @ApiOperation({ summary: 'Registrar nuevo usuario' })
  @ApiBody({
    description: 'Datos para registrar un nuevo usuario',
    required: true,
    schema: {
      example: {
        email: 'ejemplo@email.com',
        name: 'Ejemplo Nombre',
        phone: '+573001234567',
        password: 'contraseña123',
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Registrar nuevo usuario',
    examples: {
      success: {
        summary: 'Usuario registrado',
        value: {
          id: 1,
          email: 'nuevo@email.com',
          name: 'Nuevo Usuario',
          phone: '+573001112233',
        },
      },
    },
  })
<<<<<<< HEAD
=======
>>>>>>> c0cd806041ac4512d8c8764c65d7ca9ec3a15f9a
>>>>>>> origin/home
  async register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

<<<<<<< HEAD
=======
<<<<<<< HEAD
  @Post('login')
  @HttpCode(HttpStatus.OK)
=======
>>>>>>> origin/home
  @Post('send-verification-code')
  @ApiOperation({ summary: 'Enviar código de verificación por email' })
  @ApiResponse({
    status: 201,
    description: 'Enviar código de verificación por email',
    examples: {
      success: {
        summary: 'Código enviado',
        value: { message: 'Código de verificación enviado al correo.' },
      },
    },
  })
  async sendVerificationCode(@Body() dto: SendVerificationCodeDto) {
    return this.authService.sendVerificationCode(dto);
  }

  @Post('verify-code')
  @ApiOperation({ summary: 'Verificar código recibido por email' })
  @ApiResponse({
    status: 200,
    description: 'Verificar código recibido por email',
    examples: {
      success: {
        summary: 'Código verificado',
        value: { message: 'Código verificado correctamente.' },
      },
    },
  })
  async verifyCode(@Body() dto: VerifyCodeDto) {
    return this.authService.verifyCode(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar sesión y obtener JWT' })
  @ApiResponse({ status: 200, description: 'Iniciar sesión y obtener JWT' })
  @ApiResponse({
    status: 200,
    description: 'Iniciar sesión y obtener JWT',
    examples: {
      success: {
        summary: 'Login exitoso',
        value: {
          access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          user: {
            id: 1,
            email: 'usuario@email.com',
            name: 'Usuario',
            phone: '+573001112233',
          },
        },
      },
    },
  })
<<<<<<< HEAD
=======
>>>>>>> c0cd806041ac4512d8c8764c65d7ca9ec3a15f9a
>>>>>>> origin/home
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
<<<<<<< HEAD
=======
<<<<<<< HEAD
=======
>>>>>>> origin/home
  @ApiOperation({
    summary: 'Cerrar sesión y revocar JWT',
    description:
      'Este endpoint requiere el token JWT en el header Authorization: Bearer <token>',
  })
  @ApiResponse({ status: 200, description: 'Cerrar sesión y revocar JWT' })
  @ApiResponse({
    status: 200,
    description: 'Cerrar sesión y revocar JWT',
    examples: {
      success: {
        summary: 'Sesión cerrada',
        value: { message: 'Sesión cerrada correctamente.' },
      },
    },
  })
<<<<<<< HEAD
=======
>>>>>>> c0cd806041ac4512d8c8764c65d7ca9ec3a15f9a
>>>>>>> origin/home
  async logout(@Req() req: Request) {
    return this.authService.logout(req.headers.authorization);
  }
}
