/**
 * Logger utility — EROS-D5: warn/error are ALWAYS emitted (observable in
 * production); info/debug stay dev-only to keep prod logs high-signal.
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogParams {
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
}

const isDevelopment = process.env.NODE_ENV === 'development';

const formatMessage = (params: LogParams): string => {
  const timestamp = new Date().toISOString();
  const { level, message, context } = params;

  if (context) {
    return `[${timestamp}] [${level.toUpperCase()}] ${message} | ${JSON.stringify(context)}`;
  }

  return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
};

export const logger = {
  info: (message: string, context?: Record<string, unknown>) => {
    if (isDevelopment) {
      console.info(formatMessage({ level: 'info', message, context }));
    }
  },

  warn: (message: string, context?: Record<string, unknown>) => {
    console.warn(formatMessage({ level: 'warn', message, context }));
  },

  error: (message: string, context?: Record<string, unknown>) => {
    console.error(formatMessage({ level: 'error', message, context }));
  },

  debug: (message: string, context?: Record<string, unknown>) => {
    if (isDevelopment) {
      console.debug(formatMessage({ level: 'debug', message, context }));
    }
  },
};

export default logger;
