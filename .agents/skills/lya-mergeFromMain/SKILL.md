---
name: lya-mergeFromMain
description: >-
  Đồng bộ code mới nhất từ remote branch origin/main vào branch hiện tại của developer bằng Git Fetch và Merge an toàn, phát hiện sớm và hỏi xác nhận khi có merge conflict, tuyệt đối không làm mất thay đổi cục bộ và không tự push lên remote.
---

# lya-mergeFromMain

Mục đích: Đồng bộ code mới nhất từ remote branch `main` (`origin/main`) vào branch làm việc hiện tại của developer theo quy trình **an toàn dữ liệu tuyệt đối**, phát hiện và báo cáo minh bạch khi xảy ra **merge conflict**, chỉ giải quyết conflict khi developer xác nhận đồng ý, và **không tự ý push hoặc thay đổi branch ngoài phạm vi được phép**.

> [!CAUTION]
> **NGUYÊN TẮC BẮT BUỘC VỀ AN TOÀN GIT:**
> - **KHÔNG** checkout hoặc chuyển sang branch khác (`main`, v.v.).
> - **KHÔNG** merge branch hiện tại vào `main`.
> - **KHÔNG** tự ý commit, stash, reset hoặc xóa bỏ các thay đổi chưa commit của developer.
> - **KHÔNG** sử dụng `git reset --hard`, `git clean`, `git checkout -- .`, `git merge --abort` khi chưa được developer cho phép.
> - **KHÔNG** push hoặc force push lên remote repository.
> - **KHÔNG** tự ý giải quyết merge conflict (hoặc chọn `ours`/`theirs`) khi chưa có sự đồng ý rõ ràng từ developer.

## Dependencies (Quy tắc phải tuân thủ)
- [Shared Git Rules](../../rules/shared-git-rules.md)
- [Shared Reporting Rules](../../rules/shared-reporting-rules.md)
- [Shared Workflow](../../rules/shared-workflow.md)

---

## Quy trình thực hiện (Workflow 6 bước)

*(Lưu ý môi trường Shell: Trên Windows PowerShell KHÔNG sử dụng toán tử `&&`; hãy tách dòng hoặc nối lệnh bằng `;` và kiểm tra `$LASTEXITCODE`. Các lệnh Git bên dưới chạy tương thích cả trên Windows PowerShell và Git Bash).*

### Bước 1 — Kiểm tra trạng thái Git ban đầu
Trước khi fetch hoặc merge bất kỳ thay đổi nào, thực thi các lệnh kiểm tra:
```powershell
git branch --show-current
git status --short
git remote -v
git ls-remote --heads origin main
```
Kiểm tra và áp dụng nghiêm ngặt các điều kiện dừng sau:
1. **Kiểm tra branch hiện tại:**
   - Nếu `git branch --show-current` trả về rỗng (trạng thái `detached HEAD`): DỪNG và yêu cầu developer checkout đúng feature branch trước khi tiếp tục.
   - Nếu branch hiện tại là `main`: Thông báo rằng **đang ở trên branch `main`, không cần merge `main` vào chính nó**, xuất báo cáo kết thúc an toàn (hoặc gợi ý dùng `git pull origin main` nếu muốn cập nhật `main`).
2. **Kiểm tra Working Tree:**
   - Nếu `git status --short` có bất kỳ thay đổi nào chưa commit (staged, unstaged hoặc untracked files có nguy cơ xung đột): **DỪNG NGAY LẬP TỨC**, liệt kê danh sách các file đang thay đổi và yêu cầu developer chủ động commit hoặc xử lý trước khi tiếp tục.
   - **Tuyệt đối không** tự ý chạy `git add`, `git commit`, `git stash`, `git reset`, hay discard thay đổi của developer.
3. **Kiểm tra Remote & Branch `main`:**
   - Xác định remote đang sử dụng (mặc định `origin`). Nếu không có remote hợp lệ hoặc `git ls-remote --heads origin main` không tìm thấy branch `main` trên remote -> **DỪNG NGAY**, báo cáo chính xác lỗi kết nối/cấu hình remote.

### Bước 2 — Fetch code mới nhất từ Remote
Chỉ fetch nhánh `main` mới nhất từ remote (không sử dụng dữ liệu `origin/main` cũ đang lưu cục bộ):
```powershell
git fetch origin main
git rev-parse --short HEAD
git rev-parse --short origin/main
git log -n 1 --oneline origin/main
```
- Xác nhận lệnh `git fetch origin main` kết thúc với exit code `0`. Nếu thất bại (lỗi mạng, xác thực hoặc remote), dừng quy trình và xuất báo cáo `FAILED`.

### Bước 3 — Kiểm tra lịch sử & quan hệ Commit
Kiểm tra chính xác tương quan giữa `HEAD` (branch hiện tại) và `origin/main`:
```powershell
git rev-list --left-right --count HEAD...origin/main
git log --oneline HEAD..origin/main
git log --oneline origin/main..HEAD
```
Xác định rõ:
- Số commit **behind** (`HEAD..origin/main`): `origin/main` có bao nhiêu commit mới mà branch hiện tại chưa có.
- Số commit **ahead** (`origin/main..HEAD`): branch hiện tại có bao nhiêu commit riêng chưa nằm trên `origin/main`.
- Trạng thái phân nhánh:
  - `behind === 0`: Branch hiện tại đã chứa toàn bộ commit mới nhất của `origin/main` -> **Không cần merge**, thông báo rõ cho developer và kết thúc với trạng thái `SUCCESS`.
  - `behind > 0 && ahead === 0`: Branch hiện tại chỉ đi sau `origin/main` (có thể fast-forward merge).
  - `behind > 0 && ahead > 0`: Hai branch đã **diverged** (cùng có commit mới riêng).

Thông báo ngắn gọn tình trạng (`ahead`, `behind`, số commit sắp tích hợp từ `origin/main`) cho developer trước khi chạy lệnh merge.

### Bước 4 — Merge `origin/main` vào branch hiện tại
Thực thi lệnh merge trực tiếp trên branch hiện tại:
```powershell
git merge origin/main
```
**Điều kiện bắt buộc trong bước này:**
- Chỉ merge `origin/main` vào branch hiện tại.
- Không checkout sang `main`, không merge ngược branch hiện tại vào `main`.
- Không push bất kỳ thay đổi nào lên remote.
- Không tự ý tạo commit thủ công ngoài merge commit (hoặc fast-forward) do Git thực hiện.
- Không sử dụng bất kỳ lệnh phá hủy dữ liệu nào (`git reset --hard`, `git clean`, `git checkout -- .`).

### Bước 5 — Xử lý khi xuất hiện Merge Conflict
Nếu lệnh `git merge origin/main` trả về mã lỗi khác `0` và Git báo có conflict (`CONFLICT (...)`, hoặc có đường dẫn chưa hợp nhất):

1. **Dừng toàn bộ quy trình xử lý ngay lập tức.**
2. **Không chỉnh sửa** bất kỳ file conflict nào, **không tự động chọn `ours` hoặc `theirs`**.
3. **Không chạy** `git merge --abort` hoặc `git reset` khi chưa được developer cho phép.
4. Thu thập thông tin chẩn đoán (chỉ dùng lệnh đọc):
   ```powershell
   git status --short
   git diff --name-only --diff-filter=U
   git log -n 3 --oneline HEAD...origin/main
   ```
   - Danh sách đầy đủ các file xảy ra conflict.
   - Loại conflict theo trạng thái Git (`UU`: both modified, `AA`: both added, `DU`/`UD`: deleted by us/them, `DD`: both deleted).
   - Trạng thái merge hiện tại (`MERGE_HEAD` đang tồn tại).
   - Nguyên nhân conflict sơ bộ (những thay đổi chạm cùng vùng code giữa branch hiện tại và `origin/main`).
5. **Thông báo rõ ràng cho developer** danh sách file và chi tiết conflict phát hiện được, sau đó **BẮT BUỘC hỏi nguyên văn** (qua `ask_question` hoặc câu hỏi trực tiếp):

   > **"Đã phát hiện merge conflict khi merge `origin/main` vào branch hiện tại. Bạn có muốn agent AI tiến hành phân tích và xử lý toàn bộ conflict không?"**

   Tùy chọn đề xuất khi gọi `ask_question`:
   - `Đồng ý — Để AI phân tích và xử lý conflict (bảo toàn logic cả hai phía)`
   - `Không — Giữ nguyên trạng thái conflict để developer tự xử lý`

6. **Rẽ nhánh hành vi theo quyết định của developer:**
   - **Nếu developer KHÔNG đồng ý:**
     - Giữ nguyên trạng thái conflict hiện tại (`MERGE_HEAD` nguyên vẹn).
     - Tuyệt đối không chỉnh sửa bất kỳ file nào đang conflict và không chạy `git merge --abort`.
     - Thông báo developer có thể tự giải quyết thủ công hoặc yêu cầu agent tiếp tục sau, rồi xuất báo cáo `CONFLICT`.
   - **Nếu developer ĐỒNG Ý:**
     - Đọc toàn bộ file conflict, so sánh thay đổi từ cả hai phía (`HEAD` và `origin/main`) kèm lịch sử commit liên quan để hiểu đúng ngữ cảnh nghiệp vụ.
     - Giải quyết từng conflict theo hướng **bảo toàn logic hợp lệ của cả hai branch**; **tuyệt đối không** chọn máy móc toàn bộ `ours` hoặc `theirs`, không tự ý xóa tính năng hoặc phá vỡ nghiệp vụ đang hoạt động.
     - Nếu thiếu ngữ cảnh để quyết định logic đúng tại một điểm conflict cụ thể -> **dừng lại và hỏi developer** thay vì suy đoán.
     - Sau khi chỉnh sửa xong toàn bộ file conflict, kiểm tra lại không còn conflict marker (`<<<<<<<`, `=======`, `>>>>>>>`):
       ```powershell
       git diff --check
       Select-String -Path (git diff --name-only --diff-filter=U) -Pattern '^(<<<<<<<|=======|>>>>>>>)'
       ```
     - Stage các file đã xử lý xong (`git add <resolved-files>`).
     - Chạy kiểm tra build/lint/test phù hợp với phạm vi workspace của các file đã thay đổi (`lyora_backend` và/hoặc `lyora_web`). Nếu phát hiện lỗi logic hoặc test fail do giải quyết conflict, sửa cho đúng và kiểm tra lại trước khi hoàn tất merge.
     - Chỉ hoàn tất merge (`git commit --no-edit` hoặc `git merge --continue`) sau khi toàn bộ conflict đã được giải quyết sạch sẽ và kiểm tra đạt chuẩn.

### Bước 6 — Kiểm tra sau khi Merge thành công
Sau khi merge không conflict hoặc sau khi hoàn tất giải quyết conflict:
1. Kiểm tra trạng thái Git sạch:
   ```powershell
   git status --short
   ```
2. Kiểm tra lịch sử commit gần nhất để xác nhận merge commit / fast-forward hợp lệ:
   ```powershell
   git log -n 5 --oneline --graph
   ```
3. Xác nhận branch hiện tại không còn behind `origin/main` (`0` commits):
   ```powershell
   git rev-list --count HEAD..origin/main
   ```
4. Kiểm tra chắc chắn không còn bất kỳ conflict marker (`<<<<<<<`, `=======`, `>>>>>>>`) nào còn sót lại (`git diff --check`).
5. Chạy kiểm tra phù hợp (lint / build / test) theo phạm vi file thay đổi từ `origin/main` nếu môi trường cho phép.
6. **Không tự ý push code lên remote.**

---

## Quy định an toàn Git (Mandatory Safety Rules)

1. Không checkout hoặc chuyển branch ngoài yêu cầu.
2. Không tự ý commit các thay đổi trước đó của developer.
3. Không tự ý stash hoặc xóa thay đổi chưa commit.
4. Không reset lịch sử Git (`git reset --hard`, `git rebase` ngoài phạm vi).
5. Không force push (`git push --force`, `--force-with-lease`).
6. Không push lên remote (`git push`).
7. Không tự động xử lý conflict khi chưa được developer đồng ý.
8. Không bỏ qua lỗi Git hoặc báo merge thành công khi chưa xác minh thực tế qua đầu ra lệnh.
9. Nếu xảy ra lỗi ngoài dự kiến (mạng, permission, trạng thái Git bất thường), dừng ngay và báo cáo nguyên nhân chính xác.

---

## Báo cáo kết quả (Output Format)

Sau khi kết thúc quy trình (dù `SUCCESS`, `CONFLICT` hay `FAILED`), bắt buộc xuất báo cáo theo cấu trúc chuẩn dưới đây (chỉ điền dữ liệu thật đã quan sát từ kết quả lệnh Git/Build/Test):

```markdown
### Git Merge Report

**Branch information**
- Current branch: `<branch>`
- Remote: `<remote>`
- Source branch: `origin/main`
- Initial working tree status: `<Clean / Dirty (liệt kê ngắn gọn)>`

**Merge information**
- Fetch status: `<Success / Failed>`
- Main latest commit: `<short-hash> <message>`
- Merge result: `<Already up to date / Fast-forward / Merge commit <hash> / Conflict paused / Not executed>`
- Number of commits integrated: `<N>`

**Conflict information**
- Conflict detected: `Yes` / `No`
- Conflicted files: `<Danh sách file hoặc "Không có">`
- Resolution status: `<Resolved by developer approval / Waiting for developer decision / Kept unresolved / Not applicable>`

**Validation**
- Git status: `<Clean / MERGE_HEAD active / Dirty>`
- Conflict markers: `<0 markers remaining / Chưa xử lý>`
- Build/Test result: `<Kết quả thực tế hoặc lý do chưa chạy>`

**Final status**
- `<SUCCESS | CONFLICT | FAILED>`: `<Mô tả kết quả cụ thể>`
```
