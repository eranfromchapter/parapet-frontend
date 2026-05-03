'use client';

import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export type UploadStatus = 'idle' | 'uploading' | 'processing' | 'success' | 'error';

interface UploadStatusBadgeProps {
  status: UploadStatus;
  message?: string;
  progress?: number;
  onRetry?: () => void;
}

export function UploadStatusBadge({
  status,
  message,
  progress,
  onRetry,
}: UploadStatusBadgeProps) {
  if (status === 'idle') return null;

  return (
    <div
      className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs font-medium ${
        status === 'success'
          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
          : status === 'error'
          ? 'bg-red-50 border-red-200 text-red-800'
          : 'bg-blue-50 border-blue-200 text-blue-800'
      }`}
    >
      {status === 'uploading' && <Loader2 size={14} className="animate-spin shrink-0" />}
      {status === 'processing' && <Loader2 size={14} className="animate-spin shrink-0" />}
      {status === 'success' && <CheckCircle2 size={14} className="shrink-0" />}
      {status === 'error' && <AlertCircle size={14} className="shrink-0" />}
      <span className="flex-1 truncate">{message || status}</span>
      {status === 'uploading' && progress != null && (
        <span className="tabular-nums">{Math.round(progress)}%</span>
      )}
      {status === 'error' && onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="ml-2 underline font-semibold whitespace-nowrap"
        >
          Retry
        </button>
      )}
    </div>
  );
}
