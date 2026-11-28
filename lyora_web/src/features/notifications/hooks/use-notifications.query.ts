import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationsService } from "../services/notifications.service";
import { notificationsKeys } from "./notifications.keys";

export function useNotificationsQuery() {
  return useQuery({
    queryKey: notificationsKeys.mine(),
    queryFn: () => notificationsService.getMine(),
    staleTime: 5_000,
  });
}

export function useMarkNotificationReadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsService.markRead(id),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: notificationsKeys.all }),
  });
}

export function useMarkAllNotificationsReadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsService.markAllRead(),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: notificationsKeys.all }),
  });
}
