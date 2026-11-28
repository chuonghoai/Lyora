import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { postService } from '../services/post.service';
import type {
  AdminPostAppealItem,
  AdminPostAppealsQueryParams,
  AdminPostDetail,
  AdminPostsQueryParams,
  FlagAdminPostViolationPayload,
  HideAdminPostPayload,
  RejectPostAppealPayload,
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
      void queryClient.invalidateQueries({ queryKey: postKeys.adminAppeals() });
      void queryClient.invalidateQueries({ queryKey: postKeys.lists() });
      void queryClient.invalidateQueries({
        queryKey: postKeys.detail(updatedDetail.id),
      });
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
      void queryClient.invalidateQueries({ queryKey: postKeys.adminAppeals() });
      void queryClient.invalidateQueries({ queryKey: postKeys.lists() });
      void queryClient.invalidateQueries({
        queryKey: postKeys.detail(updatedDetail.id),
      });
    },
  });
}

export function useFlagAdminPostViolationMutation() {
  const queryClient = useQueryClient();

  return useMutation<AdminPostDetail, unknown, FlagAdminPostViolationPayload>({
    mutationFn: ({ postId, reason }: FlagAdminPostViolationPayload) =>
      postService.flagPostViolationAsAdmin(postId, reason),
    onSuccess: (updatedDetail) => {
      queryClient.setQueryData(
        postKeys.adminDetail(updatedDetail.id),
        updatedDetail,
      );
      void queryClient.invalidateQueries({ queryKey: postKeys.adminLists() });
      void queryClient.invalidateQueries({ queryKey: postKeys.lists() });
      void queryClient.invalidateQueries({
        queryKey: postKeys.detail(updatedDetail.id),
      });
    },
  });
}

export function useUnflagAdminPostViolationMutation() {
  const queryClient = useQueryClient();

  return useMutation<AdminPostDetail, unknown, string>({
    mutationFn: (postId: string) => postService.unflagPostViolationAsAdmin(postId),
    onSuccess: (updatedDetail) => {
      queryClient.setQueryData(
        postKeys.adminDetail(updatedDetail.id),
        updatedDetail,
      );
      void queryClient.invalidateQueries({ queryKey: postKeys.adminLists() });
      void queryClient.invalidateQueries({ queryKey: postKeys.lists() });
      void queryClient.invalidateQueries({
        queryKey: postKeys.detail(updatedDetail.id),
      });
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
      queryClient.removeQueries({ queryKey: postKeys.detail(postId) });
      queryClient.removeQueries({ queryKey: postKeys.comments(postId) });
      void queryClient.invalidateQueries({ queryKey: postKeys.adminLists() });
      void queryClient.invalidateQueries({ queryKey: postKeys.adminStats() });
      void queryClient.invalidateQueries({ queryKey: postKeys.adminAppeals() });
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
      void queryClient.invalidateQueries({ queryKey: postKeys.detail(postId) });
      void queryClient.invalidateQueries({ queryKey: postKeys.comments(postId) });
      void queryClient.invalidateQueries({ queryKey: postKeys.adminLists() });
      void queryClient.invalidateQueries({ queryKey: postKeys.lists() });
    },
  });
}

export function useAdminPostAppealsQuery(
  params: AdminPostAppealsQueryParams = {},
  options?: { enabled?: boolean },
) {
  const normalized: AdminPostAppealsQueryParams = {
    page: params.page ?? 1,
    limit: params.limit ?? 10,
    status: params.status && params.status !== 'ALL' ? params.status : undefined,
    search: params.search?.trim() || undefined,
  };

  return useQuery({
    queryKey: postKeys.adminAppealList(normalized),
    queryFn: () => postService.getAdminPostAppeals(normalized),
    placeholderData: keepPreviousData,
    enabled: options?.enabled ?? true,
    staleTime: 30 * 1000,
  });
}

export function useInfiniteAdminPostAppealsHistoryQuery(
  postId: string | null,
  limit = 10,
) {
  return useInfiniteQuery({
    queryKey: postKeys.adminPostAppealHistory(postId ?? ''),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      postService.getAdminPostAppealsHistory(postId!, {
        page: pageParam,
        limit,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasNextPage ? lastPage.meta.page + 1 : undefined,
    enabled: Boolean(postId),
    staleTime: 15 * 1000,
  });
}

export function useRestoreAdminPostAppealMutation() {
  const queryClient = useQueryClient();

  return useMutation<AdminPostAppealItem, unknown, string>({
    mutationFn: (appealId: string) =>
      postService.restorePostAppealAsAdmin(appealId),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: postKeys.adminAppeals() });
      void queryClient.invalidateQueries({ queryKey: postKeys.adminLists() });
      void queryClient.invalidateQueries({ queryKey: postKeys.adminStats() });
      void queryClient.invalidateQueries({ queryKey: postKeys.adminAppeals() });
      void queryClient.invalidateQueries({ queryKey: postKeys.lists() });
      void queryClient.invalidateQueries({
        queryKey: postKeys.detail(updated.postId),
      });
      void queryClient.invalidateQueries({
        queryKey: postKeys.adminDetail(updated.postId),
      });
    },
  });
}

export function useRejectAdminPostAppealMutation() {
  const queryClient = useQueryClient();

  return useMutation<AdminPostAppealItem, unknown, RejectPostAppealPayload>({
    mutationFn: ({ appealId, evidence }: RejectPostAppealPayload) =>
      postService.rejectPostAppealAsAdmin(appealId, evidence),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: postKeys.adminAppeals() });
      void queryClient.invalidateQueries({ queryKey: postKeys.adminStats() });
      void queryClient.invalidateQueries({ queryKey: postKeys.lists() });
      void queryClient.invalidateQueries({
        queryKey: postKeys.detail(updated.postId),
      });
    },
  });
}
