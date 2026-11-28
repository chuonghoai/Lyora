import {
  BadRequestException,
  ExecutionContext,
  ForbiddenException,
  ValidationPipe,
} from '@nestjs/common';
import { PATH_METADATA } from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { UserRole } from '../../common/enums/role.enum';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { UpdateProfileDto } from '../auth/dto/update-profile.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { LockUserDto } from './dto/lock-user.dto';
import { ProfileMediaService } from './services/profile-media.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController Profile Endpoints (Pipe, Route Order & RBAC)', () => {
  let controller: UsersController;
  let rolesGuard: RolesGuard;
  let validationPipe: ValidationPipe;
  let currentTestUser: AuthenticatedUser;
  let usersServiceMock: jest.Mocked<
    Pick<
      UsersService,
      | 'getPublicProfile'
      | 'updateProfile'
      | 'findById'
      | 'findAllPaginated'
      | 'createUser'
      | 'getStatistics'
      | 'getOnlineStatuses'
      | 'getAdminUserProfile'
      | 'lockUser'
      | 'unlockUser'
    >
  >;
  let profileMediaServiceMock: jest.Mocked<
    Pick<ProfileMediaService, 'uploadProfileImage'>
  >;

  const selfId = '11111111-1111-4111-8111-111111111111';
  const targetId = '22222222-2222-4222-8222-222222222222';

  const getControllerHandler = (
    methodName: keyof UsersController,
  ): (() => unknown) => {
    const prototypeMap = UsersController.prototype as unknown as Record<
      string,
      () => unknown
    >;
    return prototypeMap[methodName];
  };

  const createHttpContext = (
    methodName: keyof UsersController,
    user?: AuthenticatedUser,
  ): ExecutionContext => {
    const handler = getControllerHandler(methodName);
    return {
      getHandler: () => handler,
      getClass: () => UsersController,
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;
  };

  beforeEach(async () => {
    currentTestUser = {
      id: selfId,
      email: 'client@lyora.vn',
      role: UserRole.CLIENT,
    };

    usersServiceMock = {
      getPublicProfile: jest.fn().mockResolvedValue({
        id: targetId,
        email: null,
        fullName: 'Nguyễn Minh Anh',
        role: UserRole.CLIENT,
        phoneNumber: null,
        bio: 'Giới thiệu',
        location: 'TP.HCM',
        hometown: 'Đà Lạt',
        workplace: 'Lyora',
        education: null,
        website: 'https://lyora.vn',
        avatarUrl: null,
        coverUrl: null,
        isActive: true,
        isOnline: false,
        createdAt: new Date('2025-01-01T00:00:00.000Z'),
        friendshipStatus: 'FRIEND',
        friendsCount: 3,
        mutualFriendsCount: 2,
        friendsPreview: [],
      }),
      updateProfile: jest.fn().mockResolvedValue({ id: selfId }),
      findById: jest.fn().mockResolvedValue({ id: targetId }),
      findAllPaginated: jest.fn(),
      createUser: jest.fn(),
      getStatistics: jest.fn(),
      getOnlineStatuses: jest.fn(),
      getAdminUserProfile: jest.fn(),
      lockUser: jest.fn(),
      unlockUser: jest.fn(),
    };

    profileMediaServiceMock = {
      uploadProfileImage: jest.fn().mockResolvedValue({
        url: 'https://res.cloudinary.com/demo/image/upload/lyora/profiles/p.png',
        publicId: 'lyora/profiles/p',
        format: 'png',
        size: 512,
      }),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: usersServiceMock },
        { provide: ProfileMediaService, useValue: profileMediaServiceMock },
        Reflector,
        RolesGuard,
      ],
    }).compile();

    controller = moduleRef.get(UsersController);
    rolesGuard = moduleRef.get(RolesGuard);
    validationPipe = new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    });
  });

  it('registers me/profile, me/media, and :id/profile before :id route', () => {
    const methodNames = Object.getOwnPropertyNames(
      UsersController.prototype,
    ).filter((name) => name !== 'constructor') as Array<keyof UsersController>;

    const routes = methodNames
      .map((name) => ({
        name,
        path: Reflect.getMetadata(PATH_METADATA, getControllerHandler(name)) as
          string | undefined,
      }))
      .filter((entry) => typeof entry.path === 'string');

    const pathIndex = (routePath: string) =>
      routes.findIndex((entry) => entry.path === routePath);

    expect(pathIndex('me/profile')).toBeGreaterThanOrEqual(0);
    expect(pathIndex('online-status')).toBeGreaterThanOrEqual(0);
    expect(pathIndex('me/media')).toBeGreaterThan(pathIndex('me/profile'));
    expect(pathIndex(':id/admin-profile')).toBeGreaterThan(
      pathIndex('me/media'),
    );
    expect(pathIndex(':id/profile')).toBeGreaterThan(
      pathIndex(':id/admin-profile'),
    );
    expect(pathIndex(':id')).toBeGreaterThan(pathIndex(':id/profile'));
    expect(pathIndex(':id')).toBeGreaterThan(pathIndex('online-status'));
  });

  it('allows CLIENT on profile endpoints and restricts admin endpoints and statistics to ADMIN', () => {
    expect(
      rolesGuard.canActivate(
        createHttpContext('getMyProfile', currentTestUser),
      ),
    ).toBe(true);
    expect(
      rolesGuard.canActivate(
        createHttpContext('updateMyProfile', currentTestUser),
      ),
    ).toBe(true);
    expect(
      rolesGuard.canActivate(
        createHttpContext('uploadProfileMedia', currentTestUser),
      ),
    ).toBe(true);
    expect(
      rolesGuard.canActivate(
        createHttpContext('getPublicProfile', currentTestUser),
      ),
    ).toBe(true);

    expect(() =>
      rolesGuard.canActivate(createHttpContext('findOne', currentTestUser)),
    ).toThrow(ForbiddenException);
    expect(() =>
      rolesGuard.canActivate(createHttpContext('findAll', currentTestUser)),
    ).toThrow(ForbiddenException);
    expect(() =>
      rolesGuard.canActivate(createHttpContext('create', currentTestUser)),
    ).toThrow(ForbiddenException);
    expect(() =>
      rolesGuard.canActivate(
        createHttpContext('getStatistics', currentTestUser),
      ),
    ).toThrow(ForbiddenException);
    expect(() =>
      rolesGuard.canActivate(
        createHttpContext('getAdminUserProfile', currentTestUser),
      ),
    ).toThrow(ForbiddenException);
    expect(() =>
      rolesGuard.canActivate(
        createHttpContext('getOnlineStatuses', currentTestUser),
      ),
    ).toThrow(ForbiddenException);
    expect(() =>
      rolesGuard.canActivate(createHttpContext('lockUser', currentTestUser)),
    ).toThrow(ForbiddenException);
    expect(() =>
      rolesGuard.canActivate(createHttpContext('unlockUser', currentTestUser)),
    ).toThrow(ForbiddenException);

    const adminUser: AuthenticatedUser = {
      id: selfId,
      email: 'admin@lyora.vn',
      role: UserRole.ADMIN,
    };
    expect(
      rolesGuard.canActivate(createHttpContext('findOne', adminUser)),
    ).toBe(true);
    expect(
      rolesGuard.canActivate(
        createHttpContext('getAdminUserProfile', adminUser),
      ),
    ).toBe(true);
    expect(
      rolesGuard.canActivate(createHttpContext('lockUser', adminUser)),
    ).toBe(true);
    expect(
      rolesGuard.canActivate(createHttpContext('unlockUser', adminUser)),
    ).toBe(true);
    expect(rolesGuard.canActivate(createHttpContext('create', adminUser))).toBe(
      true,
    );
  });

  it('validates CreateUserDto inputs and delegates POST /users to UsersService.createUser', async () => {
    await expect(
      validationPipe.transform(
        {
          email: 'invalid-email',
          password: 'password123',
          fullName: 'Người dùng mới',
          role: UserRole.CLIENT,
        },
        { type: 'body', metatype: CreateUserDto },
      ),
    ).rejects.toThrow(BadRequestException);

    await expect(
      validationPipe.transform(
        {
          email: 'user@lyora.vn',
          password: '123',
          fullName: 'Người dùng mới',
          role: UserRole.CLIENT,
        },
        { type: 'body', metatype: CreateUserDto },
      ),
    ).rejects.toThrow(BadRequestException);

    await expect(
      validationPipe.transform(
        {
          email: 'user@lyora.vn',
          password: 'password123',
          fullName: '   ',
          role: UserRole.CLIENT,
        },
        { type: 'body', metatype: CreateUserDto },
      ),
    ).rejects.toThrow(BadRequestException);

    await expect(
      validationPipe.transform(
        {
          email: 'user@lyora.vn',
          password: 'password123',
          fullName: 'Người dùng mới',
          role: 'SUPER_ADMIN',
        },
        { type: 'body', metatype: CreateUserDto },
      ),
    ).rejects.toThrow(BadRequestException);

    const dto = (await validationPipe.transform(
      {
        email: 'admin.new@lyora.vn',
        password: 'password123',
        fullName: 'Quản Trị Viên Mới',
        role: UserRole.ADMIN,
      },
      { type: 'body', metatype: CreateUserDto },
    )) as CreateUserDto;
    usersServiceMock.createUser.mockResolvedValue({
      id: targetId,
      email: dto.email,
      fullName: dto.fullName,
      role: UserRole.ADMIN,
      isActive: true,
    } as never);

    const created = await controller.create(dto);
    expect(usersServiceMock.createUser).toHaveBeenCalledWith(dto);
    expect(created.role).toBe(UserRole.ADMIN);
  });

  it('validates LockUserDto reason length and delegates lockUser to UsersService', async () => {
    await expect(
      validationPipe.transform(
        { reason: 'Ngắn' },
        { type: 'body', metatype: LockUserDto },
      ),
    ).rejects.toThrow(BadRequestException);

    const adminUser: AuthenticatedUser = {
      id: selfId,
      email: 'admin@lyora.vn',
      role: UserRole.ADMIN,
    };
    const dto = (await validationPipe.transform(
      { reason: 'Spam bình luận quảng cáo lặp lại nhiều lần' },
      { type: 'body', metatype: LockUserDto },
    )) as LockUserDto;
    usersServiceMock.lockUser.mockResolvedValue({
      id: targetId,
      isActive: false,
      lockReason: dto.reason,
    } as never);

    const result = await controller.lockUser(adminUser, targetId, dto);

    expect(usersServiceMock.lockUser).toHaveBeenCalledWith(
      adminUser,
      targetId,
      dto,
    );
    expect(result.isActive).toBe(false);
  });

  it('delegates GET /users/:id/profile and GET /users/me/profile to UsersService', async () => {
    const profile = await controller.getPublicProfile(
      currentTestUser,
      targetId,
    );

    expect(usersServiceMock.getPublicProfile).toHaveBeenCalledWith(
      currentTestUser,
      targetId,
    );
    expect(profile.id).toBe(targetId);
    expect(profile.email).toBeNull();
    expect(profile.friendshipStatus).toBe('FRIEND');

    await controller.getMyProfile(currentTestUser);
    expect(usersServiceMock.getPublicProfile).toHaveBeenCalledWith(
      currentTestUser,
      'me',
    );
  });

  it('validates PATCH /users/me/profile payload and rejects unsafe URLs and extra fields', async () => {
    await expect(
      validationPipe.transform(
        { avatarUrl: 'javascript:alert(1)' },
        { type: 'body', metatype: UpdateProfileDto },
      ),
    ).rejects.toThrow(BadRequestException);

    await expect(
      validationPipe.transform(
        { coverUrl: 'data:text/html,<script>alert(1)</script>' },
        { type: 'body', metatype: UpdateProfileDto },
      ),
    ).rejects.toThrow(BadRequestException);

    await expect(
      validationPipe.transform(
        { website: 'javascript:alert(1)' },
        { type: 'body', metatype: UpdateProfileDto },
      ),
    ).rejects.toThrow(BadRequestException);

    await expect(
      validationPipe.transform(
        { role: UserRole.ADMIN },
        { type: 'body', metatype: UpdateProfileDto },
      ),
    ).rejects.toThrow(BadRequestException);

    const dto = (await validationPipe.transform(
      {
        fullName: 'Trịnh Đại Nghĩa',
        hometown: 'Đà Lạt',
        workplace: 'Lyora Studio',
        website: 'lyora.vn',
      },
      { type: 'body', metatype: UpdateProfileDto },
    )) as UpdateProfileDto;

    await controller.updateMyProfile(currentTestUser, dto);

    expect(usersServiceMock.updateProfile).toHaveBeenCalledWith(
      selfId,
      expect.objectContaining({
        fullName: 'Trịnh Đại Nghĩa',
        hometown: 'Đà Lạt',
        workplace: 'Lyora Studio',
        website: 'lyora.vn',
      }),
    );
    expect(usersServiceMock.getPublicProfile).toHaveBeenCalledWith(
      currentTestUser,
      'me',
    );
  });

  it('delegates POST /users/me/media upload to ProfileMediaService', async () => {
    const file = {
      buffer: Buffer.from('fake-png-bytes'),
      mimetype: 'image/png',
      size: 14,
      originalname: 'avatar.png',
    } as Express.Multer.File;

    const uploaded = await controller.uploadProfileMedia(file);

    expect(profileMediaServiceMock.uploadProfileImage).toHaveBeenCalledWith(
      file,
    );
    expect(uploaded.url).toContain('lyora/profiles');
  });
});
