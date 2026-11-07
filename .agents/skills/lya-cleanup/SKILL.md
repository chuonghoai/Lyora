---
name: lya-cleanup
description: >-
  Kiểm tra workspace sau khi hoàn thành task và dọn dẹp các file rác, file debug trong Monorepo.
---

# lya-cleanup

Mục đích: Kiểm tra workspace sau khi hoàn thành task trong dự án Lyora Monorepo (gồm `lyora_backend`, `lyora_client`, `lyora_admin`, `web_shared`).

## Dependencies
- [Shared Git Rules](../../rules/shared-git-rules.md)

## Quy trình thực hiện (Workflow)

### Step 1 — Scan Workspace
Tìm các file có thể là rác trong toàn bộ các workspace:
- Temporary files (`.tmp`, `.bak`)
- Generated reports không cần thiết
- Debug logs, output dumps
- Unused artifacts
- Build cache rác không thuộc `.gitignore` (ví dụ `dist/` rải rác ngoài thư mục build)
- Temporary scratch scripts

### Step 2 — Verification
**Ràng buộc nghiêm ngặt:** 
- KHÔNG được xóa source code (`src/`), configuration (`package.json`, `tsconfig*.json`, `vite.config.ts`, `nest-cli.json`), hoặc tài liệu kiến trúc.
- KHÔNG xóa tài nguyên dùng chung trong `web_shared`.
- Trước khi xóa file không rõ mục đích, phải YÊU CẦU USER XÁC NHẬN.

### Step 3 — Cleanup
Tiến hành xóa file an toàn sau khi đã được xác nhận (nếu cần).
