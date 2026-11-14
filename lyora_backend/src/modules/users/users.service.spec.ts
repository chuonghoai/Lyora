import { Repository } from 'typeorm';
import { UserRole } from '../../common/enums/role.enum';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

describe('UsersService - Statistics & Retrieval', () => {
  let usersService: UsersService;
  let userRepository: jest.Mocked<Partial<Repository<User>>>;

  beforeEach(() => {
    userRepository = {
      count: jest.fn(),
      createQueryBuilder: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
    };

    usersService = new UsersService(userRepository as Repository<User>);
  });

  it('should compute user statistics correctly with real-time aggregates', async () => {
    (userRepository.count as jest.Mock)
      .mockResolvedValueOnce(25) // totalUsers
      .mockResolvedValueOnce(20) // clientCount
      .mockResolvedValueOnce(3) // adminCount
      .mockResolvedValueOnce(2) // staffCount
      .mockResolvedValueOnce(22) // activeCount
      .mockResolvedValueOnce(3); // inactiveCount

    const mockQueryBuilder = {
      where: jest.fn().mockReturnThis(),
      getCount: jest
        .fn()
        .mockResolvedValueOnce(4) // newUsersToday
        .mockResolvedValueOnce(15), // newUsersThisMonth
    };

    (userRepository.createQueryBuilder as jest.Mock).mockReturnValue(
      mockQueryBuilder,
    );

    const mockRecentUsers = [
      {
        id: 'user-1',
        email: 'user1@example.com',
        fullName: 'User One',
        role: UserRole.CLIENT,
        isActive: true,
        createdAt: new Date(),
      },
    ] as User[];

    (userRepository.find as jest.Mock).mockResolvedValue(mockRecentUsers);

    const stats = await usersService.getStatistics();

    expect(stats.totalUsers).toBe(25);
    expect(stats.clientCount).toBe(20);
    expect(stats.adminCount).toBe(3);
    expect(stats.staffCount).toBe(2);
    expect(stats.activeCount).toBe(22);
    expect(stats.inactiveCount).toBe(3);
    expect(stats.newUsersToday).toBe(4);
    expect(stats.newUsersThisMonth).toBe(15);
    expect(stats.recentUsers).toEqual(mockRecentUsers);
  });
});

