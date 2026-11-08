# Shared Architecture Rules

Mọi thay đổi liên quan đến mã nguồn (code) đều phải tuân thủ nghiêm ngặt các quy định về kiến trúc (Architecture) của dự án Lyora Monorepo.

## Source of Truth (Nguồn chân lý)
- **Unified Web Frontend (`lyora_web`)**: Mọi code frontend (bao gồm Client Portal `src/features/client`, Admin Portal `src/features/admin` và Shared `src/shared`) phải tuân thủ tài liệu trong `architecture_web/`.
- **Shared Web Resources (`lyora_web/src/shared`)**: Mọi tài nguyên dùng chung giữa Client và Admin (components, hooks, utils, types, API client) bắt buộc đặt tại `lyora_web/src/shared/` (import qua `@shared`).
- **Backend API (`lyora_backend`)**: Mọi code backend API phải tuân thủ tài liệu trong `architecture_backend/`.
- **UI Design System**: Mọi thành phần giao diện phải tuân thủ token màu sắc và typography thống nhất trong `DESIGN.md`.
- **Code Quality**: Bắt buộc sử dụng ESLint cho cả `lyora_web` và `lyora_backend`.

Tài liệu Architecture là nguồn chân lý. Không được tự tạo convention mới trái với các tài liệu này.

## Quy tắc xử lý mâu thuẫn (Conflict Resolution)
Nếu Implementation Plan (hoặc giải pháp dự kiến) mâu thuẫn với Architecture hiện tại:
1. KHÔNG tự ý bỏ qua Architecture.
2. Nêu rõ điểm mâu thuẫn (conflict).
3. Giải thích nguyên nhân tại sao lại có mâu thuẫn.
4. Đưa ra phương án điều chỉnh để phù hợp với Architecture.
5. Nếu thực sự cần phải phá vỡ (bypass) Architecture, phải yêu cầu user XÁC NHẬN (confirm) rõ ràng.

## Quy tắc khi tài liệu không quy định
Nếu document không quy định về một vấn đề cụ thể:
1. Kiểm tra pattern đang được sử dụng trong codebase hiện tại (thông qua tìm kiếm mã nguồn và Git history).
2. Ưu tiên sử dụng pattern nhất quán với mã nguồn hiện tại.
3. Chỉ đề xuất convention mới khi thực sự cần thiết và hợp lý.
