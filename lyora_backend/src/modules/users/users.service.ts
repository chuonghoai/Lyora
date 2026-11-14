import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { PaginationMetaDto } from '../../common/dto/api-response.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { UserRole } from '../../common/enums/role.enum';
import { CreateUserDto } from './dto/create-user.dto';
import { UserStatisticsDto } from './dto/user-statistics.dto';
import { User } from './entities/user.entity';

const BCRYPT_SALT_ROUNDS = 10;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findByEmail(
    email: string,
    includePassword: boolean = false,
  ): Promise<User | null> {
    const normalizedEmail = email.trim().toLowerCase();
    if (includePassword) {
      return this.userRepository
        .createQueryBuilder('user')
        .addSelect('user.passwordHash')
        .where('user.email = :email', { email: normalizedEmail })
        .getOne();
    }
    return this.userRepository.findOne({
      where: { email: normalizedEmail },
    });
  }

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Không tìm thấy thông tin người dùng');
    }
    return user;
  }

  async createUser(dto: CreateUserDto): Promise<User> {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const existing = await this.findByEmail(normalizedEmail);
    if (existing) {
      throw new ConflictException('Email này đã được đăng ký trong hệ thống');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);
    const user = this.userRepository.create({
      email: normalizedEmail,
      passwordHash,
      fullName: dto.fullName.trim(),
      role: dto.role ?? UserRole.CLIENT,
      isActive: true,
    });

    const saved = await this.userRepository.save(user);
    return this.findById(saved.id);
  }

  async updatePassword(userId: string, newPassword: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Không tìm thấy thông tin người dùng');
    }

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
    await this.userRepository.update(userId, { passwordHash });
  }

  async findAllPaginated(query: PaginationQueryDto): Promise<{
    items: User[];
    meta: PaginationMetaDto;
  }> {
    const { page = 1, limit = 10, search } = query;
    const qb = this.userRepository
      .createQueryBuilder('user')
      .orderBy('user.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (search && search.trim()) {
      qb.where('user.fullName ILIKE :search OR user.email ILIKE :search', {
        search: `%${search.trim()}%`,
      });
    }

    const [items, totalItems] = await qb.getManyAndCount();
    const meta = new PaginationMetaDto(page, limit, totalItems);
    return { items, meta };
  }

  async getStatistics(): Promise<UserStatisticsDto> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      clientCount,
      adminCount,
      staffCount,
      activeCount,
      inactiveCount,
      newUsersToday,
      newUsersThisMonth,
      recentUsers,
    ] = await Promise.all([
      this.userRepository.count(),
      this.userRepository.count({ where: { role: UserRole.CLIENT } }),
      this.userRepository.count({ where: { role: UserRole.ADMIN } }),
      this.userRepository.count({ where: { role: UserRole.STAFF } }),
      this.userRepository.count({ where: { isActive: true } }),
      this.userRepository.count({ where: { isActive: false } }),
      this.userRepository
        .createQueryBuilder('user')
        .where('user.createdAt >= :todayStart', { todayStart })
        .getCount(),
      this.userRepository
        .createQueryBuilder('user')
        .where('user.createdAt >= :monthStart', { monthStart })
        .getCount(),
      this.userRepository.find({
        order: { createdAt: 'DESC' },
        take: 5,
      }),
    ]);

    return {
      totalUsers,
      clientCount,
      adminCount,
      staffCount,
      activeCount,
      inactiveCount,
      newUsersToday,
      newUsersThisMonth,
      recentUsers,
    };
  }
}
