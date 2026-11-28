export const friendsKeys = {
  all: ["friends"] as const,
  accepted: () => [...friendsKeys.all, "accepted"] as const,
  searches: () => [...friendsKeys.all, "search"] as const,
  search: (query: string) => [...friendsKeys.all, "search", query] as const,
  receivedRequests: () => [...friendsKeys.all, "received-requests"] as const,
};
