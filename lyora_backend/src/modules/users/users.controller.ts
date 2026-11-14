import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { UserRole } from '../../common/enums/role.enum';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ResponseMessage('Lấy danh sách người dùng thành công')
  async findAll(@Query() query: PaginationQueryDto) {
    return this.usersService.findAllPaginated(query);
  }

  @Get('statistics')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ResponseMessage('Lấy dữ liệu thống kê người dùng thành công')
  async getStatistics() {
    return this.usersService.getStatistics();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ResponseMessage('Lấy thông tin người dùng thành công')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findById(id);
  }
}
