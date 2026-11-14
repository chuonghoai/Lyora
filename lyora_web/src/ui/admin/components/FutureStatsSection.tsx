import React from 'react';
import { FutureMetricIcon } from './AdminIcons';

interface FutureStatModule {
  id: 'posts' | 'engagement' | 'comments' | 'messaging' | 'ai' | 'activity' | 'moderation';
  title: string;
  description: string;
  plannedEndpoint: string;
}

// TODO: Kết nối từng module bên dưới với endpoint API thực tế khi backend hoàn thiện.
const FUTURE_STAT_MODULES: FutureStatModule[] = [
  {
    id: 'posts',
    title: 'Thống kê bài viết',
    description: 'Tổng số bài viết mới, tốc độ xuất bản theo ngày và trạng thái hiển thị.',
    plannedEndpoint: '/posts/statistics',
  },
  {
    id: 'engagement',
    title: 'Tương tác bài viết',
    description: 'Tổng hợp lượt thích, phản hồi cảm xúc và lượt chia sẻ trong cộng đồng.',
    plannedEndpoint: '/engagements/statistics',
  },
  {
    id: 'comments',
    title: 'Thống kê bình luận',
    description: 'Lưu lượng bình luận mới và tỷ lệ thảo luận trên mỗi bài đăng.',
    plannedEndpoint: '/comments/statistics',
  },
  {
    id: 'messaging',
    title: 'Thống kê nhắn tin',
    description: 'Mật độ hội thoại trực tiếp và lượng tin nhắn trao đổi thời gian thực.',
    plannedEndpoint: '/messages/statistics',
  },
  {
    id: 'ai',
    title: 'Sử dụng tính năng AI',
    description: 'Tần suất gọi trợ lý AI, gợi ý nội dung và hỗ trợ kiểm duyệt tự động.',
    plannedEndpoint: '/ai/statistics',
  },
  {
    id: 'activity',
    title: 'Hoạt động nền tảng',
    description: 'Phiên truy cập đồng thời và nhịp tương tác theo khung giờ cao điểm.',
    plannedEndpoint: '/analytics/activity',
  },
  {
    id: 'moderation',
    title: 'Kiểm duyệt nội dung',
    description: 'Hàng đợi báo cáo vi phạm, nội dung cần rà soát và kết quả xử lý của đội ngũ quản trị.',
    plannedEndpoint: '/moderation/statistics',
  },
];

export const FutureStatsSection: React.FC = () => {
  return (
    <section aria-labelledby="future-stats-heading" className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 id="future-stats-heading" className="text-base font-semibold text-foreground">
            Phân hệ thống kê dự kiến
          </h2>
          <p className="text-xs text-muted mt-0.5">
            Cấu trúc chờ sẵn cho các nhóm chỉ số cộng đồng khi API backend tương ứng được mở khóa.
          </p>
        </div>
        <span className="self-start sm:self-auto inline-flex items-center rounded-full border border-border bg-card px-2.5 py-0.5 text-xs font-medium text-muted">
          7 phân hệ đang quy hoạch
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {FUTURE_STAT_MODULES.map((item, idx) => {
          const isFullRowAnchor = idx === FUTURE_STAT_MODULES.length - 1;

          return (
            <article
              key={item.id}
              className={[
                'rounded-xl border border-border bg-card p-5 flex flex-col justify-between gap-4',
                isFullRowAnchor ? 'sm:col-span-2 xl:col-span-3' : '',
              ].join(' ')}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-muted">
                      <FutureMetricIcon kind={item.id} className="w-4 h-4" />
                    </span>
                    <h3 className="text-sm font-semibold text-foreground truncate">{item.title}</h3>
                  </div>

                  <span className="shrink-0 rounded-full border border-border bg-background px-2 py-0.5 text-[11px] font-medium text-muted">
                    Sắp ra mắt
                  </span>
                </div>

                <p className="text-xs text-muted leading-relaxed">{item.description}</p>
              </div>

              {/* Khung trạng thái chờ API — tuyệt đối không chèn số liệu giả */}
              <div className="rounded-lg border border-dashed border-border bg-background/60 px-3 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-muted">Chưa kết nối dữ liệu</span>
                <code className="font-mono text-[11px] text-muted">{item.plannedEndpoint}</code>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};

