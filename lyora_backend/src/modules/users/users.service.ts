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
}
