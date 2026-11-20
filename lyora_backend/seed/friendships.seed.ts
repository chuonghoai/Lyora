import { DataSource } from 'typeorm';
import { Friendship } from '../src/modules/friends/entities/friendship.entity';
import { FriendshipStatus } from '../src/modules/friends/enums/friendship-status.enum';
import { User } from '../src/modules/users/entities/user.entity';

export async function seedFriendships(dataSource: DataSource): Promise<{
  entity: string;
  tableName: string;
  count: number;
}> {
  const friendshipRepository = dataSource.getRepository(Friendship);
  const userRepository = dataSource.getRepository(User);

  const mainUser = await userRepository.findOne({
    where: { email: 'user@gmail.com' },
  });
  const friend1 = await userRepository.findOne({
    where: { email: 'friend1@gmail.com' },
  });
  const friend2 = await userRepository.findOne({
    where: { email: 'friend2@gmail.com' },
  });
  const friend3 = await userRepository.findOne({
    where: { email: 'friend3@gmail.com' },
  });

  if (!mainUser || !friend1 || !friend2 || !friend3) {
    return { entity: 'Friendship', tableName: 'friendships', count: 0 };
  }

  const friendUsers = [friend1, friend2, friend3];
  let createdCount = 0;

  for (const f of friendUsers) {
    const existing = await friendshipRepository
      .createQueryBuilder('f')
      .where(
        '((f.userId = :u AND f.friendId = :fr) OR (f.userId = :fr AND f.friendId = :u))',
        { u: mainUser.id, fr: f.id },
      )
      .getOne();

    if (!existing) {
      const friendship = friendshipRepository.create({
        userId: mainUser.id,
        friendId: f.id,
        status: FriendshipStatus.ACCEPTED,
      });
      await friendshipRepository.save(friendship);
      createdCount++;
    }
  }

  return {
    entity: 'Friendship',
    tableName: 'friendships',
    count: createdCount,
  };
}
