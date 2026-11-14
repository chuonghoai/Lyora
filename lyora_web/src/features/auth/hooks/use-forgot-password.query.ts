import {
  useMutation,
  type UseMutationOptions,
} from '@tanstack/react-query';
import { authService } from '../services/auth.service';
import type {
  OtpSentResponse,
  ResetPasswordPayload,
  SendOtpPayload,
  VerifyForgotOtpPayload,
  VerifyForgotOtpResponse,
} from '../types/auth.types';

export type UseSendForgotPasswordOtpMutationOptions = Omit<
  UseMutationOptions<OtpSentResponse, unknown, SendOtpPayload>,
  'mutationFn'
>;

export function useSendForgotPasswordOtpMutation(
  options?: UseSendForgotPasswordOtpMutationOptions,
) {
  return useMutation({
    ...options,
    mutationFn: async (payload: SendOtpPayload) => {
      return authService.sendForgotPasswordOtp(payload);
    },
  });
}

export type UseVerifyForgotPasswordOtpMutationOptions = Omit<
  UseMutationOptions<VerifyForgotOtpResponse, unknown, VerifyForgotOtpPayload>,
  'mutationFn'
>;

export function useVerifyForgotPasswordOtpMutation(
  options?: UseVerifyForgotPasswordOtpMutationOptions,
) {
  return useMutation({
    ...options,
    mutationFn: async (payload: VerifyForgotOtpPayload) => {
      return authService.verifyForgotPasswordOtp(payload);
    },
  });
}

export type UseResetPasswordMutationOptions = Omit<
  UseMutationOptions<void, unknown, ResetPasswordPayload>,
  'mutationFn'
>;

export function useResetPasswordMutation(
  options?: UseResetPasswordMutationOptions,
) {
  return useMutation({
    ...options,
    mutationFn: async (payload: ResetPasswordPayload) => {
      return authService.resetPassword(payload);
    },
  });
}
