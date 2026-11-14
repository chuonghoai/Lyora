# Shared Git Rules

Mọi thao tác liên quan đến Git của Agent phải tuân thủ các quy định sau:

1. **Luôn kiểm tra trạng thái trước khi thao tác:**
   Sử dụng các lệnh:
   - `git status`
   - `git branch --show-current`
   - `git diff`
   - `git log`

2. **Các hành động bị NGHIÊM CẤM (trừ khi có sự cho phép rõ ràng từ user):**
   - KHÔNG force push.
   - KHÔNG `git reset --hard` gây mất code khi chưa được xác nhận.
   - KHÔNG `checkout` làm mất các thay đổi chưa được commit (uncommitted changes).
   - KHÔNG xóa branch khác branch đang thao tác hoặc review.
   - KHÔNG commit các file không liên quan đến scope của task.
   - KHÔNG merge Pull Request / branch khi chưa được user phê duyệt (approve).
   - KHÔNG xóa branch trước khi merge thành công.

3. **Cẩn trọng khi thay đổi remote:**
   - Trước các thao tác có khả năng thay đổi remote repository, phải kiểm tra trạng thái và đảm bảo đang thao tác trên đúng branch.

4. **Chiến lược nhánh và Git Workflow (Branching Strategy):**
   - **`main` là branch chính duy nhất** được sử dụng trong toàn bộ quy trình phát triển (commit, push, review, pull request).
   - **KHÔNG sử dụng, không yêu cầu tạo hoặc duy trì branch `dev`** cũng như các branch trung gian không cần thiết.
   - **Bắt đầu công việc:** Luôn đồng bộ code mới nhất từ remote qua `git pull origin main`.
   - **So sánh code (Diff/Compare):** Khi cần kiểm tra khác biệt với code remote hoặc code gốc, so sánh với `origin/main` (hoặc `main`).
   - **Hoàn thành công việc:** Commit và push code trực tiếp lên `main` (hoặc tạo Pull Request nếu làm việc trên feature branch riêng), tuân thủ đầy đủ các bước kiểm tra và phê duyệt.
   - **Pull Request (PR):** Nếu có tạo PR, branch đích (base branch) bắt buộc phải là `main`. Tuyệt đối không tạo PR hướng về `dev`.
   - **Merge & Conflict:** Merge code trực tiếp vào `main` (sau khi user chấp thuận), không merge qua branch `dev` trung gian. Nếu xảy ra conflict, rebase hoặc merge giải quyết trực tiếp trên nền `main`.
