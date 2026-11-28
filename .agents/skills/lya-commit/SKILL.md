---
name: lya-commit
description: >-
  Tự động hóa quy trình phân tích code changes, kiểm tra bảo mật và phạm vi, suy luận commit message theo Conventional Commits, staging có chọn lọc, commit và push an toàn lên đúng remote branch hiện tại mà không đụng branch main.
---

# lya-commit

Mục đích: Tự động hóa quy trình **Git Commit và Git Push** dựa trên những thay đổi code thực tế trong working tree hiện tại — không yêu cầu developer cung cấp commit message thủ công — đồng thời bảo đảm **an toàn dữ liệu, kiểm soát phạm vi commit, rà soát thông tin nhạy cảm và xác minh thực tế qua đầu ra lệnh Git**.

> [!CAUTION]
> **NGUYÊN TẮC BẮT BUỘC VỀ AN TOÀN GIT & DỮ LIỆU:**
> - **KHÔNG** commit trực tiếp hoặc push lên branch `main` *(quy tắc bảo vệ riêng của `/lya-commit` luôn được ưu tiên cao nhất so với các ngoại lệ thông thường)*.
> - **KHÔNG** tự ý `git checkout` hoặc chuyển branch.
> - **KHÔNG** đưa toàn bộ working tree vào staging bằng `git add .` hoặc `git add -A` khi chưa xác minh từng file thuộc phạm vi công việc hiện tại.
> - **KHÔNG** commit `.env`, secret, API key, access token, private key, credentials hoặc dữ liệu nhạy cảm; không tự ý sửa hoặc xóa file để loại bỏ secret.
> - **KHÔNG** tự ý `git stash`, `git reset`, `git clean` hoặc discard thay đổi của developer.
> - **KHÔNG** sửa đổi lịch sử commit (`git commit --amend`, `git rebase`, `git push --force`, `--force-with-lease`).
> - **KHÔNG** tự ý xử lý merge/rebase conflict hoặc tự động `git push -u` tạo tracking branch khi chưa được developer xác nhận.
> - **KHÔNG** báo thành công nếu chưa xác minh thực tế bằng lệnh Git.

## Dependencies (Quy tắc phải tuân thủ)
- [Shared Git Rules](../../rules/shared-git-rules.md)
- [Shared Reporting Rules](../../rules/shared-reporting-rules.md)
- [Shared Workflow](../../rules/shared-workflow.md)

---

## Quy trình thực hiện (Workflow 7 bước)

*(Lưu ý tương thích Shell — Windows PowerShell & Git Bash: Trên Windows PowerShell KHÔNG sử dụng toán tử `&&`; hãy viết mỗi lệnh trên một dòng riêng (hoặc nối với kiểm tra `$LASTEXITCODE`). Khi truyền ref `@{u}`, hãy đặt trong dấu ngoặc kép `"@{u}"` để tránh PowerShell parse nhầm. Với commit message nhiều đoạn, truyền nhiều cờ `-m "<subject>" -m "<body>"`. Khi chạy script trong workspace, dùng `npm --prefix <workspace> run <script>` thay vì `cd ... && ...`.)*

### Bước 1 — Kiểm tra trạng thái Git

Trước khi đọc diff hay thay đổi bất kỳ trạng thái nào, thực thi các lệnh kiểm tra:

```powershell
git branch --show-current
git remote -v
git status --short
git status -sb
git rev-parse -q --verify MERGE_HEAD
git rev-parse -q --verify REBASE_HEAD
git rev-parse -q --verify CHERRY_PICK_HEAD
git log -5 --oneline
```

*(Lưu ý: Các lệnh `git rev-parse -q --verify ...` chỉ trả về commit hash và exit code `0` nếu đang ở giữa trạng thái merge/rebase/cherry-pick tương ứng; nếu bình thường sẽ trả rỗng.)*

Xác định đầy đủ:
- Branch hiện tại (`git branch --show-current`).
- Remote đang sử dụng (`git remote -v`).
- Upstream tracking branch (`git rev-parse --abbrev-ref --symbolic-full-name "@{u}"`, nếu có).
- Toàn bộ thay đổi đang staged, unstaged và file untracked (`git status --short`).
- Quy chuẩn commit message gần nhất của repo qua `git log -5 --oneline`.

**Các trường hợp dừng bắt buộc (trạng thái `BLOCKED`, không thực hiện commit/push):**
1. **Đang ở branch `main`:** Không thực hiện commit hoặc push. Thông báo rõ cho developer chuyển/làm việc trên feature branch phù hợp và kết thúc.
2. **Trạng thái `detached HEAD`** (`git branch --show-current` rỗng): Dừng và yêu cầu developer kiểm tra/checkout đúng branch làm việc.
3. **Không có thay đổi nào** (`git status --short` rỗng): Thông báo không có code changes để commit và kết thúc an toàn.
4. **Đang có merge, rebase hoặc cherry-pick chưa hoàn tất** (`MERGE_HEAD`, `REBASE_HEAD`, `CHERRY_PICK_HEAD` tồn tại hoặc `git status` báo `merge`/`rebase in progress`, có file conflict `UU`/`AA`/`DD`): Dừng ngay lập tức, tuyệt đối không tự ý giải quyết conflict hay abort, và thông báo cho developer.
5. **Không xác định được remote hợp lệ** (`git remote -v` rỗng hoặc remote mục tiêu không tồn tại): Dừng ngay và thông báo cho developer, tuyệt đối không tự ý cấu hình hoặc thêm remote.
6. **Branch chưa có upstream tracking branch:** Ghi nhận rõ tình trạng chưa có upstream (`No upstream configured`). Nếu không xác định được đích push an toàn, không tự ý thiết lập upstream/remote; tại Bước 7 bắt buộc dừng lại và hỏi xác nhận developer trước khi dùng `git push -u`.

---

### Bước 2 — Phân tích code changes & Kiểm tra bảo mật

Kiểm tra toàn bộ thay đổi hiện có trong working tree và staging area (bao gồm Modified, Added, Deleted, Renamed, Staged, Unstaged trên cả source code, cấu hình, dependency, documentation và tests):

```powershell
git status --short
git diff --stat
git diff
git diff --cached --stat
git diff --cached
git log -5 --oneline
```

Đối với các file mới chưa được tracking (`??` trong `git status --short`), đọc nội dung thực tế bằng công cụ đọc file trước khi phân loại hoặc quyết định staging.

**Yêu cầu phân tích:**
1. Đọc nội dung diff thực tế, **không** chỉ suy đoán dựa vào tên file.
2. Hiểu rõ mục đích kỹ thuật và nghiệp vụ của các thay đổi.
3. Nhận diện các nhóm thay đổi có liên quan đến nhau.
4. Phân biệt chính xác bản chất thay đổi: tính năng mới (`feat`), sửa lỗi (`fix`), tái cấu trúc (`refactor`), tối ưu hiệu năng (`perf`), định dạng/giao diện thuần túy (`style`), kiểm thử (`test`), tài liệu (`docs`), build/dependency (`build`), CI/CD (`ci`) hoặc bảo trì (`chore`).
5. **Không suy luận** hoặc bịa đặt những thay đổi không tồn tại trong diff thực tế.

**Kiểm tra bảo mật (Bắt buộc):**
- Rà soát tên file và nội dung diff/untracked files nhằm phát hiện:
  - File nhạy cảm: `.env`, `.env.local`, `.env.production`, `.env.*` *(ngoại trừ template mẫu không chứa giá trị thật như `.env.example`)*, `*.pem`, `*.key`, `*.p12`, `*.pfx`, `id_rsa*`, `*secret*`, `*credentials*`.
  - Chuỗi nhạy cảm trong diff: private key (`-----BEGIN ... PRIVATE KEY-----`), API key, access token, refresh token, JWT bí mật, Bearer token thật, chuỗi kết nối DB chứa password thật, mật khẩu/credential hardcode.
- **Nếu phát hiện dữ liệu nhạy cảm hoặc file có nguy cơ cao:**
  - **DỪNG NGAY LẬP TỨC** (`BLOCKED`).
  - Thông báo chính xác đường dẫn file và vị trí nghi ngờ cho developer.
  - **Tuyệt đối không** tự ý xóa file hay chỉnh sửa nội dung file để loại bỏ secret.

---

### Bước 3 — Suy luận commit message

Từ kết quả phân tích diff ở Bước 2, tự động suy luận commit message theo chuẩn **Conventional Commits** đang áp dụng trong dự án:

```text
<type>(<scope>): <description>
```

Nếu thay đổi gồm nhiều điểm quan trọng cần giải thích, bổ sung **commit body** (cách tiêu đề một dòng trống, liệt kê ngắn gọn các ý chính dựa đúng trên diff).

**Bảng các loại commit (`type`) được phép sử dụng:**

| Type | Mục đích |
|---|---|
| `feat` | Bổ sung tính năng mới |
| `fix` | Sửa lỗi |
| `refactor` | Tái cấu trúc code, không thay đổi chức năng |
| `perf` | Cải thiện hiệu năng |
| `style` | Thay đổi định dạng hoặc giao diện không ảnh hưởng logic |
| `test` | Bổ sung hoặc chỉnh sửa kiểm thử |
| `docs` | Cập nhật tài liệu |
| `build` | Thay đổi cấu hình build hoặc dependency |
| `ci` | Thay đổi CI/CD |
| `chore` | Các công việc bảo trì khác |

**Quy tắc đặt tiêu đề commit:**
1. Ngắn gọn, súc tích, phản ánh đúng thay đổi quan trọng nhất.
2. Viết bằng **tiếng Anh**.
3. Ưu tiên động từ ở **dạng mệnh lệnh** (`implement`, `resolve`, `add`, `update`, `refactor`, `optimize`, `remove`, ...), không viết hoa chữ cái đầu mô tả sau dấu `:`, không kết thúc bằng dấu chấm.
4. **Cấm** viết tiêu đề chung chung như `update code`, `fix bugs`, `changes` hoặc `implement features`.
5. Không đưa thông tin không tồn tại trong diff.
6. Không tự bịa mã issue hoặc ticket nếu không có căn cứ rõ ràng từ branch/diff.
7. Nếu nhiều thay đổi cùng phục vụ một mục đích, chọn `type` và `scope` đại diện chính xác nhất (gợi ý scope trong Lyora: `backend`, `web`, `admin`, `client`, `auth`, `posts`, `chat`, `notifications`, `core`, `skills`, `docs`, ...).
8. Nếu phát hiện **nhiều nhóm thay đổi độc lập** (ví dụ: một tính năng backend + một bản sửa lỗi không liên quan hoặc cập nhật skill riêng), cân nhắc **tách thành từng commit riêng biệt** thay vì gộp tùy tiện.

**Ví dụ chuẩn:**
- `feat(auth): implement Google OAuth authentication`
- `fix(chat): resolve message synchronization issue`
- `refactor(admin): simplify dashboard data management`
- `perf(client): optimize report list rendering`
- `test(api): add integration tests for report endpoints`
- `docs(readme): update project setup instructions`

---

### Bước 4 — Kiểm tra phạm vi commit (Staging có chọn lọc)

Đây là bước **bắt buộc** trước khi staging:
1. Chỉ commit những file/thay đổi thuộc phạm vi công việc hiện tại.
2. Không commit file không liên quan, file debug tạm thời hoặc thay đổi ngoài phạm vi.
3. **Tuyệt đối không** chạy mù quáng `git add .` hoặc `git add -A` khi chưa kiểm tra và xác nhận danh sách từng file.
4. Đối chiếu cả các file đã staged sẵn (`git diff --cached --name-only`) và chưa staged (`git status --short`) để tránh bỏ sót file cần thiết hoặc đưa nhầm file thừa vào commit.
5. **Nếu xuất hiện file không rõ mục đích** hoặc thay đổi có dấu hiệu thuộc một task/công việc khác -> **DỪNG LẠI** (`BLOCKED`) và hỏi developer xác nhận (qua `ask_question` hoặc câu hỏi trực tiếp) danh sách file cần giữ/loại khỏi commit.
6. Không tự ý xóa file hoặc sửa code chỉ để làm cho commit hợp lệ.

Sau khi xác định chính xác từng file cần commit, tiến hành staging có chọn lọc:

```powershell
git add -- "<path/to/file1>" "<path/to/file2>"
```

*(Nếu cần loại bỏ file đã lỡ staged nhưng không thuộc phạm vi commit, chỉ dùng `git restore --staged -- "<path/to/file>"` để unstage an toàn; không dùng các lệnh làm mất thay đổi trong working tree).*

---

### Bước 5 — Kiểm tra trước khi commit

Sau khi staging có chọn lọc và trước khi tạo commit, kiểm tra lại toàn diện:

```powershell
git status --short
git diff --cached --stat
git diff --cached
```

Xác minh đủ 5 hạng mục sau:
1. Kiểm tra lại toàn bộ `git diff --cached` thực tế sẽ được commit.
2. Bảo đảm không chứa secret, `.env` hay thông tin nhạy cảm.
3. Bảo đảm không sót file ngoài phạm vi công việc.
4. Bảo đảm các thay đổi trong staging nhất quán 100% với `type`, `scope`, `title` (và `body`) dự kiến.
5. Chạy các lệnh kiểm tra phù hợp với workspace có code thay đổi (nếu dự án có script tương ứng; với thay đổi thuần tài liệu/skill không đụng code ứng dụng thì ghi rõ lý do không áp dụng hoặc bỏ qua build/test code):
   - Nếu phạm vi có `lyora_backend/`:
     ```powershell
     npm --prefix lyora_backend run lint
     npm --prefix lyora_backend run build
     npm --prefix lyora_backend test
     ```
   - Nếu phạm vi có `lyora_web/`:
     ```powershell
     npm --prefix lyora_web run lint
     npm --prefix lyora_web run build
     npm --prefix lyora_web test
     ```
   *(Có thể chạy test tập trung vào module/spec liên quan trước khi chạy full suite nếu cần tối ưu thời gian, nhưng phải báo cáo chính xác phạm vi lệnh đã chạy và kết quả thực tế).*

**Nguyên tắc:** Tuyệt đối không bỏ qua lỗi lint, typecheck, build hay test fail rồi tuyên bố commit đã được xác thực. Nếu kiểm tra thất bại, dừng lại (`BLOCKED` hoặc `FAILED`) và báo cáo nguyên nhân cụ thể cho developer.

---

### Bước 6 — Tạo Commit & Xác minh

Sau khi mọi kiểm tra ở Bước 5 đều đạt:

1. Tạo commit với message đã suy luận:
   - Tiêu đề đơn:
     ```powershell
     git commit -m "<type>(<scope>): <description>"
     ```
   - Có commit body mô tả các điểm chính:
     ```powershell
     git commit -m "<type>(<scope>): <description>" -m "<summary body>"
     ```
2. Xác minh commit vừa tạo và nội dung bên trong:
   ```powershell
   git log -1
   git show --stat --oneline HEAD
   git status --short
   ```
   Kiểm tra commit hash, message và danh sách file đã commit đúng với kế hoạch. Nếu lệnh `git commit` lỗi (pre-commit hook fail, lock file, ...), dừng ngay, ghi nhận nguyên nhân và không tự ý sửa code hoặc vượt hook.

**Cấm tuyệt đối ở bước này (và toàn bộ quy trình):**
- `git commit --amend`
- `git reset`
- `git rebase`
- `git push --force` (hoặc `--force-with-lease`)

---

### Bước 7 — Push lên GitHub & Xác minh

Sau khi commit cục bộ thành công:

1. Xác nhận lại branch hiện tại (tuyệt đối không phải `main`) và remote mục tiêu:
   ```powershell
   git branch --show-current
   git remote -v
   ```
2. Kiểm tra upstream tracking branch của branch hiện tại:
   ```powershell
   git rev-parse --abbrev-ref --symbolic-full-name "@{u}"
   ```
3. **Nếu branch CHƯA có upstream (`@{u}` trả lỗi hoặc chưa thiết lập tracking branch):**
   - **KHÔNG** tự ý chạy `git push -u`, không tự tạo tracking branch mới và không push lên branch khác.
   - Thông báo rõ cho developer rằng commit cục bộ đã tạo thành công (`COMMITTED`), nhưng branch hiện tại chưa có upstream tracking branch, và **hỏi xác nhận của developer** trước khi thực hiện `git push -u <remote> <current-branch>`.
4. **Nếu branch ĐÃ có upstream:**
   - Fetch trạng thái mới nhất của branch tương ứng trên remote:
     ```powershell
     git fetch <remote> <current-branch>
     git rev-list --left-right --count HEAD...<remote>/<current-branch>
     ```
   - Nếu remote branch đã có commit mới mà local chưa có (số commit bên phải `> 0`, có nguy cơ non-fast-forward reject):
     - **DỪNG LẠI** với trạng thái `COMMITTED`.
     - Thông báo cho developer về sự chênh lệch với remote; **tuyệt đối không** tự ý `rebase`, `reset` hoặc `push --force`.
   - Nếu có thể push fast-forward an toàn (số commit bên phải `== 0`):
     ```powershell
     git push <remote> <current-branch>
     ```
5. **Xác minh sau khi push:**
   ```powershell
   git status -sb
   git rev-parse --short HEAD
   git rev-parse --short <remote>/<current-branch>
   ```
   Chỉ xác nhận `SUCCESS` khi exit code của `git push` là `0` và hash của `HEAD` khớp chính xác với `<remote>/<current-branch>`.

---

## Quy định an toàn bắt buộc (Mandatory Safety Rules)

1. Không commit trực tiếp trên branch `main`.
2. Không push lên branch `main`.
3. Không tự ý checkout hoặc chuyển branch.
4. Không commit secret, credentials hoặc dữ liệu nhạy cảm.
5. Không commit những thay đổi không thuộc phạm vi công việc hiện tại.
6. Không tự ý stash, reset, clean hoặc discard changes.
7. Không tự ý amend hoặc rewrite commit history.
8. Không force push.
9. Không tự ý xử lý merge conflict hoặc rebase conflict.
10. Nếu phát hiện rủi ro mất dữ liệu, dừng lại và hỏi developer.
11. Không báo thành công nếu chưa xác minh Git thực sự hoàn tất thao tác.

---

## Báo cáo kết quả (Output Format)

Sau khi kết thúc quy trình (dù kết quả là `SUCCESS`, `COMMITTED`, `BLOCKED` hay `FAILED`), bắt buộc xuất báo cáo theo đúng cấu trúc dưới đây, chỉ điền dữ liệu thật quan sát từ đầu ra lệnh Git và công cụ kiểm tra:

```markdown
### Git Commit & Push Report

**Branch information**
- Current branch: `<branch>`
- Remote: `<remote>`
- Upstream branch: `<upstream hoặc "Chưa thiết lập">`

**Code changes analysis**
- Total changed files: `<N>`
- Added: `<N hoặc danh sách>`
- Modified: `<N hoặc danh sách>`
- Deleted: `<N hoặc danh sách>`
- Renamed: `<N hoặc danh sách>`
- Main change summary: `<Tóm tắt ngắn gọn các thay đổi dựa trên diff thực tế>`

**Commit information**
- Commit type: `<feat | fix | refactor | perf | style | test | docs | build | ci | chore | Chưa tạo>`
- Commit scope: `<scope hoặc "Không có">`
- Commit title: `<type>(<scope>): <description> (hoặc "Chưa tạo")`
- Commit hash: `<short-hash hoặc "Chưa tạo">`
- Files committed: `<Danh sách file đã commit hoặc "Chưa có">`

**Validation**
- Sensitive data check: `<Passed (0 secrets detected) | Blocked (<chi tiết>)>`
- Build/Lint/Test: `<Kết quả thực tế kèm phạm vi lệnh đã chạy, hoặc lý do chưa chạy/N/A>`
- Git working tree status: `<Clean | Còn thay đổi ngoài phạm vi: ...>`

**Push information**
- Push status: `<Success | Skipped (chờ xác nhận -u / non-fast-forward) | Not executed | Failed>`
- Remote branch: `<remote>/<branch>`
- GitHub synchronization status: `<Up to date with <remote>/<branch> | Ahead by N commit(s) | Diverged | Unknown>`

**Final status**
- `<SUCCESS | COMMITTED | BLOCKED | FAILED>`: `<Mô tả kết quả cụ thể>`
```

Định nghĩa giá trị `Final status`:
- `SUCCESS`: Commit và push thành công.
- `COMMITTED`: Commit thành công nhưng chưa push được.
- `BLOCKED`: Dừng vì phát hiện rủi ro hoặc cần developer xác nhận.
- `FAILED`: Commit hoặc push thất bại, kèm nguyên nhân.
