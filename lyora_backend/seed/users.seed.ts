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
  isOnline?: boolean;
  lockReason?: string | null;
  phoneNumber?: string | null;
  bio?: string | null;
  location?: string | null;
  hometown?: string | null;
  workplace?: string | null;
  education?: string | null;
  website?: string | null;
}

export const SEED_USERS_DATA: SeedUserItem[] = [
  {
    email: 'admin@gmail.com',
    rawPassword: '123456',
    fullName: 'Quản Trị Viên Hệ Thống',
    role: UserRole.ADMIN,
    isActive: true,
    phoneNumber: '0901000111',
    bio: 'Quản trị viên nền tảng cộng đồng Lyora.',
    location: 'TP. Hồ Chí Minh',
  },
  {
    email: 'user@gmail.com',
    rawPassword: '123456',
    fullName: 'Người Dùng Tiêu Chuẩn',
    role: UserRole.CLIENT,
    isActive: true,
    phoneNumber: '0908123456',
    bio: 'Yêu thích nhiếp ảnh, công nghệ và chia sẻ những khoảnh khắc thường ngày trên Lyora.',
    location: 'TP. Hồ Chí Minh',
    hometown: 'Đà Lạt, Lâm Đồng',
    workplace: 'Thành viên Cộng đồng Lyora',
    education: 'Đại học Sư phạm Kỹ thuật TP.HCM',
    website: 'https://lyora.vn',
  },
  {
    email: 'inactive@lyora.com',
    rawPassword: 'Client@123456',
    fullName: 'Khách Hàng Tạm Khóa',
    role: UserRole.CLIENT,
    isActive: false,
    isOnline: false,
    lockReason: 'Tài khoản tạm khóa do vi phạm tiêu chuẩn cộng đồng Lyora.',
    phoneNumber: '0909999888',
    bio: null,
    location: 'Hà Nội',
  },
  {
    email: 'friend1@gmail.com',
    rawPassword: '123456',
    fullName: 'Nguyễn Văn An',
    role: UserRole.CLIENT,
    isActive: true,
    phoneNumber: '0901234001',
    bio: 'Yêu thích âm nhạc và công nghệ.',
    location: 'Đà Nẵng',
  },
  {
    email: 'friend2@gmail.com',
    rawPassword: '123456',
    fullName: 'Trần Thị Bình',
    role: UserRole.CLIENT,
    isActive: true,
    phoneNumber: '0901234002',
    bio: 'Thiết kế giao diện và trải nghiệm người dùng.',
    location: 'TP. Hồ Chí Minh',
  },
  {
    email: 'friend3@gmail.com',
    rawPassword: '123456',
    fullName: 'Lê Hoàng Cường',
    role: UserRole.CLIENT,
    isActive: true,
    phoneNumber: '0901234003',
    bio: 'Lập trình viên phần mềm mã nguồn mở.',
    location: 'Hà Nội',
  },
  {
    email: 'stranger@gmail.com',
    rawPassword: '123456',
    fullName: 'Phạm Văn Lạ',
    role: UserRole.CLIENT,
    isActive: true,
    phoneNumber: '0901234999',
    bio: 'Chưa kết bạn với user tiêu chuẩn (phục vụ kiểm thử bảo mật).',
    location: 'Cần Thơ',
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
      user.isOnline = item.isOnline ?? false;
      user.lockReason = item.isActive ? null : (item.lockReason ?? null);
      user.lockedAt = item.isActive ? null : new Date();
      user.phoneNumber = item.phoneNumber ?? null;
      user.bio = item.bio ?? null;
      user.location = item.location ?? null;
      user.hometown = item.hometown ?? null;
      user.workplace = item.workplace ?? null;
      user.education = item.education ?? null;
      user.website = item.website ?? null;
    } else {
      user = userRepository.create({
        email: item.email,
        passwordHash,
        fullName: item.fullName,
        role: item.role,
        isActive: item.isActive,
        isOnline: item.isOnline ?? false,
        lockReason: item.isActive ? null : (item.lockReason ?? null),
        lockedAt: item.isActive ? null : new Date(),
        phoneNumber: item.phoneNumber ?? null,
        bio: item.bio ?? null,
        location: item.location ?? null,
        hometown: item.hometown ?? null,
        workplace: item.workplace ?? null,
        education: item.education ?? null,
        website: item.website ?? null,
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
