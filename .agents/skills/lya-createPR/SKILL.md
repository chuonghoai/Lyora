---
name: lya-createPR
description: >-
  Chuẩn bị code hiện tại và tạo Pull Request từ branch hiện tại vào dev.
---

# lya-createPR

Mục đích: Chuẩn bị code hiện tại và tạo Pull Request từ branch hiện tại -> `dev`.

## Dependencies
- [Shared Git Rules](../../rules/shared-git-rules.md)

## Quy trình thực hiện (Workflow)

### Step 1 — Check status
Kiểm tra: current branch, working tree, staged/unstaged changes, untracked files, commits chưa push.

### Step 2 — Scope validation
Xác định rõ phạm vi thay đổi giữa các workspace:
- `lyora_backend`:
- `lyora_client`:
- `lyora_admin`:
- `web_shared`:
**Ràng buộc:** KHÔNG được tự ý commit các file không liên quan hoặc file rác từ build artifacts.

### Step 3 — Push
Push code lên remote. 
**Lưu ý:** Trước các thao tác có khả năng thay đổi remote repository, phải kiểm tra trạng thái và đảm bảo branch đúng.

### Step 4 — Create PR URL
Tạo GitHub Pull Request URL với: `base = dev`, `head = current branch`.
URL phải được tạo sao cho user có thể click mở trực tiếp trên trình duyệt.

### Step 5 — PR Body Template
Nếu có thể prefill, hãy điền sẵn nội dung theo template sau:
```markdown
## Summary

## Changes
- Backend (`lyora_backend`):
- Web Client (`lyora_client`):
- Web Admin (`lyora_admin`):
- Shared Resources (`web_shared`):

## Implementation
- Architecture compliance (web_architecture / backend_architecture)
- Reused shared components from `@lyora/web-shared`

## Testing
- Unit / Integration Tests

## Checklist
- [ ] Tested
- [ ] Architecture compliant
- [ ] No unrelated changes
- [ ] ESLint verified (`npm run lint`)
- [ ] No backend secrets leaked into frontend/shared
```

**STOP CONDITION:** KHÔNG ĐƯỢC TỰ MERGE PR.
