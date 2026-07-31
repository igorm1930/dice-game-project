import { Controller, Get, Param } from '@nestjs/common';
import { UserIdParamDto } from './dto/user-id-param.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(): Promise<UserResponseDto[]> {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param() params: UserIdParamDto): Promise<UserResponseDto> {
    return this.usersService.findOne(params.id);
  }
}
