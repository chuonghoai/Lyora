import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from '@tanstack/react-query';
import { authService } from '../services/auth.service';
import type {
  AuthSession,
  OtpSentResponse,
  RegisterCredentials,
  SendOtpPayload,
} from '../types/auth.types';
import { authKeys } from './auth.keys';

export type UseSendRegisterOtpMutationOptions = Omit<
  UseMutationOptions<OtpSentResponse, unknown, SendOtpPayload>,
  'mutationFn'
>;

export function useSendRegisterOtpMutation(
  options?: UseSendRegisterOtpMutationOptions,
) {
  return useMutation({
    ...options,
    mutationFn: async (payload: SendOtpPayload) => {
      return authService.sendRegisterOtp(payload);
    },
  });
}

export type UseRegisterMutationOptions = Omit<
  UseMutationOptions<AuthSession, unknown, RegisterCredentials>,
  'mutationFn'
>;

export function useRegisterMutation(options?: UseRegisterMutationOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    ...options,
    mutationFn: async (credentials: RegisterCredentials) => {
      return authService.register(credentials);
    },
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: authKeys.session() });
      options?.onSuccess?.(...args);
    },
  });
}
