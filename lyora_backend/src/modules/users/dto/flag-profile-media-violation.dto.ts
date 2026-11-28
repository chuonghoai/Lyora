import { Transform } from 'class-transformer';
import { IsString, MaxLength, MinLength } from 'class-validator';
import type { User } from '../entities/user.entity';

export class FlagProfileMediaViolationDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'Lý do đánh dấu vi phạm phải là chuỗi ký tự' })
  @MinLength(5, {
    message: 'Vui lòng nhập lý do đánh dấu vi phạm tối thiểu 5 ký tự',
  })
  @MaxLength(500, { message: 'Lý do đánh dấu vi phạm tối đa 500 ký tự' })
  reason: string;
}

export interface ProfileMediaViolationDto {
  reason: string;
  flaggedAt: string | null;
  evidenceUrl: string | null;
}

export function buildAvatarViolation(
  user?: Partial<User> | null,
): ProfileMediaViolationDto | null {
  if (!user?.avatarViolationReason?.trim()) {
    return null;
  }
  return {
    reason: user.avatarViolationReason.trim(),
    flaggedAt: user.avatarViolationFlaggedAt
      ? user.avatarViolationFlaggedAt.toISOString()
      : null,
    evidenceUrl: user.avatarViolationEvidenceUrl ?? user.avatarUrl ?? null,
  };
}

export function buildCoverViolation(
  user?: Partial<User> | null,
): ProfileMediaViolationDto | null {
  if (!user?.coverViolationReason?.trim()) {
    return null;
  }
  return {
    reason: user.coverViolationReason.trim(),
    flaggedAt: user.coverViolationFlaggedAt
      ? user.coverViolationFlaggedAt.toISOString()
      : null,
    evidenceUrl: user.coverViolationEvidenceUrl ?? user.coverUrl ?? null,
  };
}
