/* eslint-disable no-console */
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class AppLogger {
  private isDev = import.meta.env.DEV;

  private formatMessage(level: LogLevel, context: string, message: string): string {
    const timestamp = new Date().toLocaleTimeString();
    return `[${timestamp}] [${context}] [${level.toUpperCase()}]: ${message}`;
  }

  debug(context: string, message: string, ...args: unknown[]): void {
    if (this.isDev) {
      console.debug(this.formatMessage('debug', context, message), ...args);
    }
  }

  info(context: string, message: string, ...args: unknown[]): void {
    if (this.isDev) {
      console.info(this.formatMessage('info', context, message), ...args);
    }
  }

  warn(context: string, message: string, ...args: unknown[]): void {
    console.warn(this.formatMessage('warn', context, message), ...args);
  }

  error(context: string, message: string, ...args: unknown[]): void {
    console.error(this.formatMessage('error', context, message), ...args);
  }
}

export const logger = new AppLogger();
