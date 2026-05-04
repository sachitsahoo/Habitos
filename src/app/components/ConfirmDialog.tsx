import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useDarkMode } from '../context/DarkModeContext';

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirm',
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { isDark } = useDarkMode();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
      if (e.key === 'Enter') onConfirm();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onCancel, onConfirm]);

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div
        className={`relative z-10 w-full max-w-xs rounded-2xl p-6 shadow-2xl border ${
          isDark ? 'bg-[#2A3D55] border-[#4A5E72]' : 'bg-white border-[#D4D2CA]'
        }`}
        onClick={e => e.stopPropagation()}
      >
        <p className={`font-semibold text-base mb-1 ${isDark ? 'text-[#E8E6E0]' : 'text-[#2D2D2D]'}`}>
          {title}
        </p>
        <p className={`text-sm mb-5 leading-relaxed ${isDark ? 'text-[#ABABAB]' : 'text-[#6B6B6B]'}`}>
          {message}
        </p>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            disabled={loading}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 ${
              isDark ? 'bg-[#354D67] text-[#C8C8C8] hover:text-[#E8E6E0]' : 'bg-[#E8E6E0] text-[#6B6B6B] hover:text-[#2D2D2D]'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-60 ${
              destructive
                ? 'bg-[#C84C4C] hover:bg-[#B03C3C] text-white'
                : isDark
                  ? 'bg-[#7AA897] hover:bg-[#669989] text-[#1A2332]'
                  : 'bg-[#6B9B8C] hover:bg-[#5A8B7D] text-white'
            }`}
          >
            {loading ? 'Please wait…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
