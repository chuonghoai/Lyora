import React from 'react';
import type { Post } from '@/features/posts';
import { VideoCompanionPanel } from './VideoCompanionPanel';
import { VideoStagePlayer } from './VideoStagePlayer';
import { extractPostVideos, type VideosController } from './videos.controller';

export interface VideoPostStageCardProps {
  post: Post;
  controller: VideosController;
}

export const VideoPostStageCard: React.FC<VideoPostStageCardProps> = ({
  post,
  controller,
}) => {
  const videos = extractPostVideos(post);
  if (videos.length === 0) return null;

  const isActivePost = controller.activePostId === post.id;
  const activeClipIndex = controller.clipIndexByPost[post.id] ?? 0;

  return (
    <article
      ref={(element) => controller.registerPostCardElement(post.id, element)}
      data-video-post-id={post.id}
      aria-label={`Bài đăng video của ${post.author.fullName}`}
      className="w-full overflow-hidden rounded-2xl border border-border bg-card shadow-sm lg:flex lg:items-stretch lg:h-full"
    >
      <div className="min-w-0 flex-1">
        <VideoStagePlayer
          postId={post.id}
          videos={videos}
          activeClipIndex={activeClipIndex}
          isActivePost={isActivePost}
          isAutoPlayEnabled={controller.isAutoPlayEnabled}
          isMuted={controller.isMuted}
          onActivatePost={() => controller.handleActivatePost(post.id)}
          onPrevClip={() => controller.handleStepClip(post.id, videos.length, 'prev')}
          onNextClip={() => controller.handleStepClip(post.id, videos.length, 'next')}
          onSelectClip={(index) => controller.handleSelectClip(post.id, index)}
          onToggleMute={controller.handleToggleMute}
        />
      </div>

      <VideoCompanionPanel post={post} controller={controller} />
    </article>
  );
};
