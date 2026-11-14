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

  function createAggregateBuilderMock(
    rawResult: Record<string, string | number>,
  ) {
    const qb = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      setParameters: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue(rawResult),
    };
    return qb;
  }

  it('should compute user statistics with a single aggregate query and limit 4 recent users', async () => {
    const mockQueryBuilder = createAggregateBuilderMock({
      totalUsers: '25',
      clientCount: '22',
      adminCount: '3',
      activeCount: '22',
      inactiveCount: '3',
      newUsersToday: '4',
      newUsersThisMonth: '15',
    });

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

    expect(userRepository.createQueryBuilder).toHaveBeenCalledTimes(1);
    expect(mockQueryBuilder.getRawOne).toHaveBeenCalledTimes(1);
    expect(stats.totalUsers).toBe(25);
    expect(stats.clientCount).toBe(22);
    expect(stats.adminCount).toBe(3);
    expect(stats.activeCount).toBe(22);
    expect(stats.inactiveCount).toBe(3);
    expect(stats.newUsersToday).toBe(4);
    expect(stats.newUsersThisMonth).toBe(15);
    expect(stats.recentUsers).toEqual(mockRecentUsers);
    expect(userRepository.find).toHaveBeenCalledWith({
      where: undefined,
      order: { createdAt: 'DESC' },
      take: 4,
    });
  });

  it('should filter recent users by role while keeping limit at 4', async () => {
    const mockQueryBuilder = createAggregateBuilderMock({
      totalUsers: '1',
      clientCount: '0',
      adminCount: '1',
      activeCount: '1',
      inactiveCount: '0',
      newUsersToday: '0',
      newUsersThisMonth: '0',
    });
    (userRepository.createQueryBuilder as jest.Mock).mockReturnValue(
      mockQueryBuilder,
    );
    (userRepository.find as jest.Mock).mockResolvedValue([]);

    await usersService.getStatistics(UserRole.ADMIN);

    expect(userRepository.find).toHaveBeenCalledWith({
      where: { role: UserRole.ADMIN },
      order: { createdAt: 'DESC' },
      take: 4,
    });
  });
});
