import { DataSource } from 'typeorm';
import { PostComment } from '../src/modules/posts/entities/post-comment.entity';
import { PostReaction } from '../src/modules/posts/entities/post-reaction.entity';
import { Post } from '../src/modules/posts/entities/post.entity';
import {
  PostReactionType,
  PostVisibility,
} from '../src/modules/posts/enums/post.enums';
import { User } from '../src/modules/users/entities/user.entity';

export interface SeedPostsSummary {
  postsCount: number;
  commentsCount: number;
  reactionsCount: number;
}

export async function seedPosts(
  dataSource: DataSource,
): Promise<SeedPostsSummary> {
  const userRepository = dataSource.getRepository(User);
  const postRepository = dataSource.getRepository(Post);
  const commentRepository = dataSource.getRepository(PostComment);
  const reactionRepository = dataSource.getRepository(PostReaction);

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
    return { postsCount: 0, commentsCount: 0, reactionsCount: 0 };
  }

  const seedSpecs: Array<{
    author: User;
    content: string;
    visibility: PostVisibility;
    taggedUserIds?: string[] | null;
    sharesCount: number;
    reactions: Array<{ user: User; type: PostReactionType }>;
    comments: Array<{ author: User; content: string }>;
  }> = [
    {
      author: mainUser,
      content:
        'Chào mừng mọi người đến với cộng đồng Lyora! Hôm nay trời Sài Gòn nắng đẹp, cùng chia sẻ những khoảnh khắc đáng nhớ nhé.',
      visibility: PostVisibility.PUBLIC,
      taggedUserIds: [friend1.id, friend2.id],
      sharesCount: 1,
      reactions: [
        { user: friend1, type: PostReactionType.LOVE },
        { user: friend2, type: PostReactionType.LIKE },
      ],
      comments: [
        {
          author: friend1,
          content:
            'Chào cả nhà! Rất vui được kết nối cùng mọi người trên Lyora.',
        },
        {
          author: friend2,
          content: 'Giao diện mới trông mượt và gọn gàng lắm luôn!',
        },
      ],
    },
    {
      author: friend1,
      content:
        'Cuối tuần vừa rồi có dịp dạo quanh Đà Nẵng và nghe lại vài bản nhạc acoustic nhẹ nhàng. Có ai cùng sở thích không?',
      visibility: PostVisibility.PUBLIC,
      taggedUserIds: null,
      sharesCount: 0,
      reactions: [
        { user: mainUser, type: PostReactionType.LIKE },
        { user: friend3, type: PostReactionType.WOW },
      ],
      comments: [
        {
          author: mainUser,
          content: 'Cho xin danh sách phát nhạc acoustic để nghe cùng với nha!',
        },
      ],
    },
    {
      author: friend2,
      content:
        'Đang hoàn thiện bảng màu và hệ thống biểu tượng cho bản thiết kế mới. Cảm ơn mọi người đã góp ý nhiệt tình.',
      visibility: PostVisibility.FRIENDS,
      taggedUserIds: [mainUser.id],
      sharesCount: 0,
      reactions: [{ user: mainUser, type: PostReactionType.LOVE }],
      comments: [
        {
          author: friend3,
          content: 'Bố cục rõ ràng và dễ đọc hơn hẳn bản trước đó!',
        },
      ],
    },
    {
      author: mainUser,
      content:
        'Ghi chú cá nhân: Lên kế hoạch chụp bộ ảnh đường phố vào sáng Chủ nhật tuần này.',
      visibility: PostVisibility.PRIVATE,
      taggedUserIds: null,
      sharesCount: 0,
      reactions: [],
      comments: [],
    },
    {
      author: friend3,
      content:
        'Vừa tối ưu xong luồng đồng bộ thời gian thực cho ứng dụng trò chuyện nhóm. Cảm giác chạy mượt mà thật sự rất đã!',
      visibility: PostVisibility.PUBLIC,
      taggedUserIds: null,
      sharesCount: 2,
      reactions: [{ user: friend1, type: PostReactionType.HAHA }],
      comments: [],
    },
  ];

  let postsCount = 0;
  let commentsCount = 0;
  let reactionsCount = 0;

  for (const spec of seedSpecs) {
    let post = await postRepository.findOne({
      where: {
        authorId: spec.author.id,
        content: spec.content,
      },
    });

    if (!post) {
      post = await postRepository.save(
        postRepository.create({
          authorId: spec.author.id,
          content: spec.content,
          visibility: spec.visibility,
          media: [],
          taggedUserIds: spec.taggedUserIds ?? null,
          reactionsCount: spec.reactions.length,
          commentsCount: spec.comments.length,
          sharesCount: spec.sharesCount,
        }),
      );
      postsCount++;
    }

    for (const reactionSpec of spec.reactions) {
      const existingReaction = await reactionRepository.findOne({
        where: {
          postId: post.id,
          userId: reactionSpec.user.id,
        },
      });
      if (!existingReaction) {
        await reactionRepository.save(
          reactionRepository.create({
            postId: post.id,
            userId: reactionSpec.user.id,
            type: reactionSpec.type,
          }),
        );
        reactionsCount++;
      }
    }

    for (const commentSpec of spec.comments) {
      const existingComment = await commentRepository.findOne({
        where: {
          postId: post.id,
          authorId: commentSpec.author.id,
          content: commentSpec.content,
        },
      });
      if (!existingComment) {
        await commentRepository.save(
          commentRepository.create({
            postId: post.id,
            authorId: commentSpec.author.id,
            content: commentSpec.content,
            media: null,
          }),
        );
        commentsCount++;
      }
    }
  }

  return {
    postsCount,
    commentsCount,
    reactionsCount,
  };
}
