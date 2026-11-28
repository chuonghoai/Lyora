import { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useFriendSearchQuery } from '@/features/friends';
import { useInfinitePostsQuery } from '@/features/posts';
import { ROUTES } from '@/routes/paths';

export type SearchResultTab = 'all' | 'people' | 'posts';

export function useSearchController() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const query = (searchParams.get('q') ?? '').trim();
  const tabParam = searchParams.get('tab');
  const activeTab: SearchResultTab =
    tabParam === 'people' || tabParam === 'posts' ? tabParam : 'all';

  const peopleQuery = useFriendSearchQuery(query);
  const postsQuery = useInfinitePostsQuery(
    { search: query, limit: 10, filter: 'all' },
    { enabled: query.length >= 2 },
  );

  const posts = useMemo(
    () => postsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [postsQuery.data],
  );

  const handleSelectTab = (tab: SearchResultTab) => {
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous);
      if (tab === 'all') next.delete('tab');
      else next.set('tab', tab);
      return next;
    });
  };

  const handleRetryPeople = () => {
    void peopleQuery.refetch();
  };

  const handleRetryPosts = () => {
    void postsQuery.refetch();
  };

  const handleLoadMorePosts = () => {
    if (postsQuery.hasNextPage && !postsQuery.isFetchingNextPage) {
      void postsQuery.fetchNextPage();
    }
  };

  const handleBackToFeed = () => {
    navigate(ROUTES.CLIENT.ROOT);
  };

  return {
    query,
    activeTab,
    people: peopleQuery.data?.items ?? [],
    posts,
    isLoadingPeople: peopleQuery.isFetching,
    isPeopleError: peopleQuery.isError,
    isLoadingPosts: postsQuery.isLoading,
    isPostsError: postsQuery.isError,
    hasNextPostsPage: Boolean(postsQuery.hasNextPage),
    isFetchingNextPosts: postsQuery.isFetchingNextPage,
    handleSelectTab,
    handleRetryPeople,
    handleRetryPosts,
    handleLoadMorePosts,
    handleBackToFeed,
  };
}

export type SearchController = ReturnType<typeof useSearchController>;
