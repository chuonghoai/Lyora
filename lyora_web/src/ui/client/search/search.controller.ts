import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useFriendSearchQuery } from '@/features/friends';
import { useInfinitePostsQuery } from '@/features/posts';

export type SearchResultTab = 'all' | 'people' | 'posts' | 'pages';

export function useSearchController() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = (searchParams.get('q') ?? '').trim();
  const tabParam = searchParams.get('tab');
  const activeTab: SearchResultTab =
    tabParam === 'people' || tabParam === 'posts' || tabParam === 'pages' ? tabParam : 'all';
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

  return {
    query,
    activeTab,
    people: peopleQuery.data?.items ?? [],
    posts,
    isLoadingPeople: peopleQuery.isFetching,
    isLoadingPosts: postsQuery.isFetching,
    handleSelectTab,
  };
}

export type SearchController = ReturnType<typeof useSearchController>;
