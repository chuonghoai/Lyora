import { ConversationMember } from '../src/modules/conversations/entities/conversation-member.entity';
import { Conversation } from '../src/modules/conversations/entities/conversation.entity';
import { IdempotencyRecord } from '../src/modules/conversations/entities/idempotency-record.entity';
import { Friendship } from '../src/modules/friends/entities/friendship.entity';
import { PostComment } from '../src/modules/posts/entities/post-comment.entity';
import { PostReaction } from '../src/modules/posts/entities/post-reaction.entity';
import { PostShare } from '../src/modules/posts/entities/post-share.entity';
import { Post } from '../src/modules/posts/entities/post.entity';
import { User } from '../src/modules/users/entities/user.entity';
import { seedConversations } from './conversations.seed';
import { seedFriendships } from './friendships.seed';
import { seedPosts } from './posts.seed';
import { assertSafeEnvironment, createSeedDataSource } from './seed.config';
import { seedUsers } from './users.seed';

export async function runCreateSeedDB(): Promise<void> {
  console.log(
    '================================================================',
  );
  console.log(
    '       LYORA DATABASE SEED RUNNER (/lya-insertSeedDB)           ',
  );
  console.log(
    '================================================================',
  );
  const startTime = Date.now();

  // 1. Kiểm tra an toàn môi trường
  console.log('[1/4] Kiểm tra môi trường thực thi...');
  assertSafeEnvironment();
  console.log('      Môi trường an toàn: Được phép chạy seed data.');

  // 2. Kết nối Database
  console.log('[2/4] Đang kết nối tới Database...');
  const dataSource = createSeedDataSource();
  await dataSource.initialize();
  console.log('      Kết nối Database thành công!');

  try {
    // 3. Thực thi Seed theo thứ tự quan hệ khóa ngoại
    console.log('[3/4] Bắt đầu khởi tạo dữ liệu mẫu...');
    const userResult = await seedUsers(dataSource);
    console.log(
      `      ✓ [${userResult.tableName}] ${userResult.entity}: Đã xử lý ${userResult.count} bản ghi.`,
    );

    const friendshipResult = await seedFriendships(dataSource);
    console.log(
      `      ✓ [${friendshipResult.tableName}] ${friendshipResult.entity}: Đã tạo ${friendshipResult.count} bản ghi quan hệ bạn bè.`,
    );

    const conversationResult = await seedConversations(dataSource);
    console.log(
      `      ✓ [conversations] Conversation: Đã tạo ${conversationResult.conversationsCount} hội thoại, ${conversationResult.membersCount} thành viên, ${conversationResult.idempotencyCount} idempotency records.`,
    );

    const postResult = await seedPosts(dataSource);
    console.log(
      `      ✓ [posts] Post: Đã tạo ${postResult.postsCount} bài viết, ${postResult.commentsCount} bình luận, ${postResult.reactionsCount} cảm xúc.`,
    );

    // 4. Kiểm tra và đếm tổng số bản ghi trong các bảng thực tế
    console.log('[4/4] Kiểm tra và xác thực dữ liệu...');
    const tableChecks: Array<{ table: string; count: number }> = [
      {
        table: 'users',
        count: await dataSource.getRepository(User).count(),
      },
      {
        table: 'friendships',
        count: await dataSource.getRepository(Friendship).count(),
      },
      {
        table: 'conversations',
        count: await dataSource.getRepository(Conversation).count(),
      },
      {
        table: 'conversation_members',
        count: await dataSource.getRepository(ConversationMember).count(),
      },
      {
        table: 'idempotency_records',
        count: await dataSource.getRepository(IdempotencyRecord).count(),
      },
      {
        table: 'posts',
        count: await dataSource.getRepository(Post).count(),
      },
      {
        table: 'post_comments',
        count: await dataSource.getRepository(PostComment).count(),
      },
      {
        table: 'post_reactions',
        count: await dataSource.getRepository(PostReaction).count(),
      },
      {
        table: 'post_shares',
        count: await dataSource.getRepository(PostShare).count(),
      },
    ];

    for (const check of tableChecks) {
      console.log(
        `      - Bảng "${check.table}": ${check.count} bản ghi thực tế.`,
      );
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(
      '----------------------------------------------------------------',
    );
    console.log(` SEED DATABASE HOÀN TẤT THÀNH CÔNG (${duration}s)`);
    console.log(' Danh sách tài khoản thử nghiệm:');
    userResult.records.forEach((u) => {
      console.log(
        `   - [${u.role.padEnd(6)}] ${u.email.padEnd(22)} (${u.fullName}) - Active: ${u.isActive}`,
      );
    });
    console.log(
      '================================================================',
    );
  } catch (error) {
    console.error(' [LỖI] Quá trình seed dữ liệu thất bại:', error);
    process.exitCode = 1;
    throw error;
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('Đã đóng kết nối Database.');
    }
  }
}

// Tự động thực thi khi chạy trực tiếp qua CLI
if (require.main === module) {
  runCreateSeedDB().catch(() => {
    process.exit(1);
  });
}
