import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { UserRole } from '../src/common/enums/role.enum';
import { User } from '../src/modules/users/entities/user.entity';

export interface SeedUserItem {
  email: string;
  rawPassword: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
}

export const SEED_USERS_DATA: SeedUserItem[] = [
  {
    email: 'admin@gmail.com',
    rawPassword: '123456',
    fullName: 'Quản Trị Viên Hệ Thống',
    role: UserRole.ADMIN,
    isActive: true,
  },
  {
    email: 'user@gmail.com',
    rawPassword: '123456',
    fullName: 'Người Dùng Tiêu Chuẩn',
    role: UserRole.CLIENT,
    isActive: true,
  },
  {
    email: 'inactive@lyora.com',
    rawPassword: 'Client@123456',
    fullName: 'Khách Hàng Tạm Khóa',
    role: UserRole.CLIENT,
    isActive: false,
  },
];

export interface SeedUserRecordSummary {
  email: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
}

export async function seedUsers(dataSource: DataSource): Promise<{
  entity: string;
  tableName: string;
  count: number;
  records: SeedUserRecordSummary[];
}> {
  const userRepository = dataSource.getRepository(User);
  const saltRounds = 10;
  const records: SeedUserRecordSummary[] = [];

  for (const item of SEED_USERS_DATA) {
    const passwordHash = await bcrypt.hash(item.rawPassword, saltRounds);

    let user = await userRepository.findOne({ where: { email: item.email } });
    if (user) {
      user.passwordHash = passwordHash;
      user.fullName = item.fullName;
      user.role = item.role;
      user.isActive = item.isActive;
    } else {
      user = userRepository.create({
        email: item.email,
        passwordHash,
        fullName: item.fullName,
        role: item.role,
        isActive: item.isActive,
      });
    }

    const saved = await userRepository.save(user);
    records.push({
      email: saved.email,
      fullName: saved.fullName,
      role: saved.role,
      isActive: saved.isActive,
    });
  }

  return {
    entity: 'User',
    tableName: 'users',
    count: records.length,
    records,
  };
}
