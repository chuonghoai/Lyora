import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { postService } from '../services/post.service';
import type {
  AdminPostDetail,
  AdminPostsQueryParams,
  HideAdminPostPayload,
  RemoveAdminCommentPayload,
  RemoveAdminPostPayload,
} from '../types/post.types';
import { postKeys } from './post.keys';

export function useAdminPostStatisticsQuery() {
  return useQuery({
    queryKey: postKeys.adminStats(),
    queryFn: () => postService.getAdminPostStatistics(),
    staleTime: 60 * 1000,
  });
}

export function useAdminPostsQuery(params: AdminPostsQueryParams = {}) {
  const normalized: AdminPostsQueryParams = {
    page: params.page ?? 1,
    limit: params.limit ?? 10,
    search: params.search?.trim() || undefined,
    status: params.status && params.status !== 'ALL' ? params.status : undefined,
    visibility: params.visibility,
    authorRole: params.authorRole,
    hasMedia: params.hasMedia,
  };

  return useQuery({
    queryKey: postKeys.adminList(normalized),
    queryFn: () => postService.getAdminPosts(normalized),
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  });
}

export function useAdminPostDetailQuery(postId: string | null) {
  return useQuery({
    queryKey: postKeys.adminDetail(postId ?? ''),
    queryFn: () => postService.getAdminPostDetail(postId!),
    enabled: Boolean(postId),
    staleTime: 30 * 1000,
  });
}

export function useHideAdminPostMutation() {
  const queryClient = useQueryClient();

  return useMutation<AdminPostDetail, unknown, HideAdminPostPayload>({
    mutationFn: ({ postId, reason }: HideAdminPostPayload) =>
      postService.hidePostAsAdmin(postId, reason),
    onSuccess: (updatedDetail) => {
      queryClient.setQueryData(
        postKeys.adminDetail(updatedDetail.id),
        updatedDetail,
      );
      void queryClient.invalidateQueries({ queryKey: postKeys.adminLists() });
      void queryClient.invalidateQueries({ queryKey: postKeys.adminStats() });
      void queryClient.invalidateQueries({ queryKey: postKeys.lists() });
    },
  });
}

export function useRestoreAdminPostMutation() {
  const queryClient = useQueryClient();

  return useMutation<AdminPostDetail, unknown, string>({
    mutationFn: (postId: string) => postService.restorePostAsAdmin(postId),
    onSuccess: (updatedDetail) => {
      queryClient.setQueryData(
        postKeys.adminDetail(updatedDetail.id),
        updatedDetail,
      );
      void queryClient.invalidateQueries({ queryKey: postKeys.adminLists() });
      void queryClient.invalidateQueries({ queryKey: postKeys.adminStats() });
      void queryClient.invalidateQueries({ queryKey: postKeys.lists() });
    },
  });
}

export function useRemoveAdminPostMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, unknown, RemoveAdminPostPayload>({
    mutationFn: ({ postId, reason }: RemoveAdminPostPayload) =>
      postService.removePostAsAdmin(postId, reason),
    onSuccess: (_res, { postId }) => {
      queryClient.removeQueries({ queryKey: postKeys.adminDetail(postId) });
      void queryClient.invalidateQueries({ queryKey: postKeys.adminLists() });
      void queryClient.invalidateQueries({ queryKey: postKeys.adminStats() });
      void queryClient.invalidateQueries({ queryKey: postKeys.lists() });
    },
  });
}

export function useRemoveAdminCommentMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, unknown, RemoveAdminCommentPayload>({
    mutationFn: ({ postId, commentId, reason }: RemoveAdminCommentPayload) =>
      postService.removeCommentAsAdmin(postId, commentId, reason),
    onSuccess: (_res, { postId }) => {
      void queryClient.invalidateQueries({
        queryKey: postKeys.adminDetail(postId),
      });
      void queryClient.invalidateQueries({ queryKey: postKeys.adminLists() });
      void queryClient.invalidateQueries({ queryKey: postKeys.lists() });
    },
  });
}
