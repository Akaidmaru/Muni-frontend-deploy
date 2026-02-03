import {
  Param,
  Controller,
  Body,
  Get,
  Post,
  Patch,
  UseGuards,
  Req,
} from '@nestjs/common';
import { UserService } from './user.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { AdminCreateUserDto } from './dto/admin-create-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import type { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: { id: number };
}

@Controller('users')
export class UserController {
  @Get(':id/trucks')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  getTrucksOfUser(@Param('id') id: string) {
    return this.userService.getTrucksOfUser(Number(id));
  }
  constructor(private readonly userService: UserService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  adminCreate(@Body() dto: AdminCreateUserDto) {
    return this.userService.adminCreate(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(Number(id));
  }

  @Patch('change-password')
  @UseGuards(JwtAuthGuard)
  changePassword(
    @Req() req: AuthenticatedRequest,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.userService.changePassword(req.user.id, dto) as Promise<{
      message: string;
    }>;
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  adminUpdateUser(@Param('id') id: string, @Body() dto: AdminUpdateUserDto) {
    return this.userService.adminUpdateUser(Number(id), dto);
  }
}
