import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '@/core';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught React exception:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-[#cbd5e1] shadow-[0_8px_30px_rgba(0,0,0,0.08)] text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-[#0f172a]">
              Đã xảy ra lỗi không mong muốn
            </h2>
            <p className="text-sm text-[#475569]">
              Hệ thống ghi nhận sự cố gián đoạn trong giao diện hiển thị. Vui lòng tải lại trang hoặc thử lại sau.
            </p>
            {this.state.error && (
              <pre className="text-xs bg-[#f1f5f9] text-[#334155] p-3 rounded-lg overflow-x-auto text-left max-h-32">
                {this.state.error.message}
              </pre>
            )}
            <div className="pt-2">
              <Button variant="primary" onClick={this.handleReload} className="w-full">
                Tải lại trang
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

