import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
  type Query,
  type UseMutationOptions,
} from '@tanstack/react-query';
import { postService } from '../services/post.service';
import type {
  CreateCommentPayload,
  CreatePostAppealPayload,
  CreatePostPayload,
  PaginatedPostsResult,
  Post,
  PostAppealSummary,
  PostComment,
  PostReactionsQueryParams,
  PostSharesQueryParams,
  PostsQueryParams,
  ReactPostPayload,
  UpdatePostPayload,
} from '../types/post.types';
import { postKeys } from './post.keys';

export function useInfinitePostsQuery(
  params: Omit<PostsQueryParams, 'page'> = {},
  options?: { enabled?: boolean },
) {
  const normalizedParams: Omit<PostsQueryParams, 'page'> = {
    limit: params.limit ?? 5,
    search: params.search?.trim() || undefined,
    filter: params.filter ?? 'all',
    authorId: params.authorId?.trim() || undefined,
    visibility: params.visibility,
  };

  return useInfiniteQuery({
    queryKey: postKeys.list(normalizedParams),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      postService.getPosts({
        ...normalizedParams,
        page: pageParam,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasNextPage ? lastPage.meta.page + 1 : undefined,
    enabled: options?.enabled ?? true,
    staleTime: 10 * 60 * 1000,
  });
}

export function useFriendsQuery() {
  return useQuery({
    queryKey: postKeys.friends(),
    queryFn: () => postService.getFriends(),
    staleTime: 10 * 60 * 1000,
  });
}

export function usePostReactionsQuery(
  postId: string | null,
  params: PostReactionsQueryParams = {},
) {
  const normalized: PostReactionsQueryParams = {
    page: params.page ?? 1,
    limit: params.limit ?? 6,
    reactionType: params.reactionType,
  };

  return useQuery({
    queryKey: postKeys.reactions(postId ?? '', normalized),
    queryFn: () => postService.getPostReactions(postId!, normalized),
    enabled: Boolean(postId),
    staleTime: 30 * 1000,
  });
}

export function usePostSharesQuery(
  postId: string | null,
  params: PostSharesQueryParams = {},
) {
  const normalized: PostSharesQueryParams = {
    page: params.page ?? 1,
    limit: params.limit ?? 10,
  };

  return useQuery({
    queryKey: postKeys.shares(postId ?? '', normalized),
    queryFn: () => postService.getPostShares(postId!, normalized),
    enabled: Boolean(postId),
    staleTime: 30 * 1000,
  });
}

export interface UsePostDetailQueryOptions {
  refetchInterval?:
    | number
    | false
    | ((query: Query<Post, unknown, Post, ReturnType<typeof postKeys.detail>>) => number | false | undefined);
  refetchOnWindowFocus?: boolean;
}

export function usePostDetailQuery(
  postId: string | null,
  options?: UsePostDetailQueryOptions,
) {
  return useQuery({
    queryKey: postKeys.detail(postId ?? ''),
    queryFn: () => postService.getPostById(postId!),
    enabled: Boolean(postId),
    retry: false,
    staleTime: 30 * 1000,
    ...(options?.refetchInterval !== undefined
      ? { refetchInterval: options.refetchInterval }
      : {}),
    ...(options?.refetchOnWindowFocus !== undefined
      ? { refetchOnWindowFocus: options.refetchOnWindowFocus }
      : {}),
  });
}

export function useInfinitePostCommentsQuery(
  postId: string | null,
  limit = 10,
) {
  return useInfiniteQuery({
    queryKey: postKeys.comments(postId ?? ''),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      postService.getPostComments(postId!, {
        page: pageParam,
        limit,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasNextPage ? lastPage.meta.page + 1 : undefined,
    enabled: Boolean(postId),
    retry: false,
    staleTime: 30 * 1000,
  });
}

export function useCreatePostAppealMutation() {
  const queryClient = useQueryClient();

  return useMutation<PostAppealSummary, unknown, CreatePostAppealPayload>({
    mutationFn: (payload: CreatePostAppealPayload) =>
      postService.createPostAppeal(payload),
    onSuccess: (_appeal, { postId }) => {
      void queryClient.invalidateQueries({ queryKey: postKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: postKeys.detail(postId) });
      void queryClient.invalidateQueries({ queryKey: postKeys.adminAppeals() });
      void queryClient.invalidateQueries({ queryKey: postKeys.adminStats() });
    },
  });
}

export function useUploadPostMediaMutation() {
  return useMutation({
    mutationFn: (files: File[]) => postService.uploadMedia(files),
  });
}

export type UseCreatePostMutationOptions = Omit<
  UseMutationOptions<Post, unknown, CreatePostPayload>,
  'mutationFn'
>;

export function useCreatePostMutation(options?: UseCreatePostMutationOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    ...options,
    mutationFn: (payload: CreatePostPayload) => postService.createPost(payload),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: postKeys.lists() });
      options?.onSuccess?.(...args);
    },
  });
}

export function useUpdatePostMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdatePostPayload) => postService.updatePost(payload),
    onSuccess: (updatedPost) => {
      updatePostInCachedPages(queryClient, updatedPost);
      void queryClient.invalidateQueries({ queryKey: postKeys.lists() });
    },
  });
}

function updatePostInCachedPages(
  queryClient: ReturnType<typeof useQueryClient>,
  updatedPost: Post,
) {
  queryClient.setQueryData<Post>(postKeys.detail(updatedPost.id), updatedPost);
  queryClient.setQueriesData<InfiniteData<PaginatedPostsResult>>(
    { queryKey: postKeys.lists() },
    (oldData) => {
      if (!oldData) return oldData;
      return {
        ...oldData,
        pages: oldData.pages.map((page) => ({
          ...page,
          items: page.items.map((item) => (item.id === updatedPost.id ? updatedPost : item)),
        })),
      };
    },
  );
}

export function useReactPostMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, reactionType }: ReactPostPayload) =>
      postService.reactPost(postId, reactionType),
    onSuccess: (updatedPost) => {
      updatePostInCachedPages(queryClient, updatedPost);
    },
  });
}

export function useBookmarkPostMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) => postService.toggleBookmark(postId),
    onSuccess: (updatedPost) => {
      updatePostInCachedPages(queryClient, updatedPost);
      queryClient.invalidateQueries({ queryKey: postKeys.lists() });
    },
  });
}

export function useSharePostMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) => postService.sharePost(postId),
    onSuccess: (updatedPost) => {
      updatePostInCachedPages(queryClient, updatedPost);
    },
  });
}

export function useHidePostMutation() {
  return useMutation({
    mutationFn: (postId: string) => postService.hidePost(postId),
  });
}

export function useUnhidePostMutation() {
  return useMutation({
    mutationFn: (postId: string) => postService.unhidePost(postId),
  });
}

export function useCreateCommentMutation() {
  const queryClient = useQueryClient();

  return useMutation<PostComment, unknown, CreateCommentPayload>({
    mutationFn: ({ postId, content, media }: CreateCommentPayload) =>
      postService.addComment(postId, content, media),
    onSuccess: (createdComment, { postId }) => {
      queryClient.setQueriesData<InfiniteData<PaginatedPostsResult>>(
        { queryKey: postKeys.lists() },
        (oldData) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page) => ({
              ...page,
              items: page.items.map((post) =>
                post.id === postId
                  ? {
                      ...post,
                      commentCount: post.commentCount + 1,
                      comments: [...post.comments, createdComment],
                    }
                  : post,
              ),
            })),
          };
        },
      );
      void queryClient.invalidateQueries({ queryKey: postKeys.detail(postId) });
      void queryClient.invalidateQueries({ queryKey: postKeys.comments(postId) });
    },
  });
}
