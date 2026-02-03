import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { CreateUserDto } from './dto/create-user-dto';
import { LoginDto } from './dto/login-dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private redisService: RedisService,
  ) {}

  async register(data: CreateUserDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ConflictException('El email ya está registrado');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await this.prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
      },
    });

    const payload = { sub: user.id };
    const accessToken = this.jwtService.sign(payload);

    return { user, accessToken };
  }

  async login({ email, password }: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      omit: { password: false },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const payload = { sub: user.id };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async logout(authHeader?: string) {
    if (!authHeader) {
      throw new UnauthorizedException('No token provided');
    }

    const token = authHeader.replace('Bearer ', '');

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const decoded = this.jwtService.decode(token);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (!decoded || typeof decoded.exp !== 'number') {
      throw new UnauthorizedException('Token inválido');
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const ttl = (decoded.exp as number) - Math.floor(Date.now() / 1000);

    if (ttl > 0) {
      await this.redisService.set(`blacklist:${token}`, 'true', ttl);
    }

    return { message: 'Logout exitoso' };
  }
}
