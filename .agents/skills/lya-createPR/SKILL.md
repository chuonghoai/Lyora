---
name: lya-createPR
description: >-
  Chuẩn bị code hiện tại và tạo Pull Request từ branch hiện tại vào main.
---

# lya-createPR

Mục đích: Chuẩn bị code hiện tại và tạo Pull Request từ branch hiện tại -> `main`.

## Dependencies
- [Shared Git Rules](../../rules/shared-git-rules.md)

## Quy trình thực hiện (Workflow)

### Step 1 — Check status
Kiểm tra: current branch, working tree, staged/unstaged changes, untracked files, commits chưa push.

### Step 2 — Scope validation
Xác định rõ phạm vi thay đổi giữa các workspace:
- `lyora_backend`: Backend NestJS API
- `lyora_web`: Unified Web Frontend (`core`, `features`, `ui`, `routes`)
**Ràng buộc:** KHÔNG được tự ý commit các file không liên quan hoặc file rác từ build artifacts.

### Step 3 — Push
Push code lên remote. 
**Lưu ý:** Trước các thao tác có khả năng thay đổi remote repository, phải kiểm tra trạng thái và đảm bảo branch đúng.

### Step 4 — Create PR URL
Tạo GitHub Pull Request URL với: `base = main`, `head = current branch`.
URL phải được tạo sao cho user có thể click mở trực tiếp trên trình duyệt.

### Step 5 — PR Body Template
Nếu có thể prefill, hãy điền sẵn nội dung theo template sau:
```markdown
## Summary

## Changes
- Backend (`lyora_backend`):
- Frontend (`lyora_web`):
  - Core (`src/core`):
  - Data Layer (`src/features`):
  - UI Layer (`src/ui`):

## Implementation
- Architecture compliance (`architecture_web/` / `architecture_backend/`)
- Reused core components & primitives from `@core`
- View-Controller separation enforced

## Testing
- Unit / Integration Tests

## Checklist
- [ ] Tested (Backend & Frontend)
- [ ] Architecture compliant
- [ ] No unrelated changes
- [ ] ESLint verified (`npm run lint`)
- [ ] No backend secrets leaked into frontend
```

**STOP CONDITION:** KHÔNG ĐƯỢC TỰ MERGE PR.
