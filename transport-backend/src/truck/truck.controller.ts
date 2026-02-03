import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { TruckService } from './truck.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateTruckDto } from './dto/create-truck.dto';
import { UpdateTruckDto } from './dto/update-truck.dto';
import { AssignUserDto } from './dto/assign-user.dto';

@Controller('trucks')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class TruckController {
  constructor(private readonly truckService: TruckService) {}

  @Post()
  create(@Body() dto: CreateTruckDto) {
    return this.truckService.create(dto);
  }

  @Get()
  findAll() {
    return this.truckService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.truckService.findOne(Number(id));
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTruckDto) {
    return this.truckService.update(Number(id), dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.truckService.remove(Number(id));
  }

  @Post('assign')
  assignUser(@Body() dto: AssignUserDto) {
    return this.truckService.assignUser(dto);
  }

  @Get(':id/users')
  getUsersOfTruck(@Param('id') id: string) {
    return this.truckService.getUsersOfTruck(Number(id));
  }
}
