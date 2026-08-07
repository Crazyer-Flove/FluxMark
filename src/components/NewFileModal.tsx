import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, FilePlus, Folder } from 'lucide-react';

interface NewFileModalProps {
  isOpen: boolean;
  directoryName?: string | null;
  onClose: () => void;
  onConfirm: (fileName: string) => void;
}

export const NewFileModal: React.FC<NewFileModalProps> = ({
  isOpen,
  directoryName,
  onClose,
  onConfirm,
}) => {
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setFileName('');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let trimmed = fileName.trim();
    if (!trimmed) {
      setError('请输入文件名');
      return;
    }

    if (!trimmed.endsWith('.md') && !trimmed.endsWith('.txt')) {
      trimmed += '.md';
    }

    onConfirm(trimmed);
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border)] rounded-2xl shadow-2xl max-w-md w-full p-5 overflow-hidden"
        >
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-[var(--accent)]/10 text-[var(--accent)] rounded-lg">
                <FilePlus size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold">新建 Markdown 文档</h3>
                {directoryName && (
                  <p className="text-[11px] text-[var(--text-secondary)] flex items-center gap-1 mt-0.5">
                    <Folder size={12} className="text-amber-500" />
                    <span>保存至文件夹: <strong className="text-[var(--text-primary)]">{directoryName}</strong></span>
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-[var(--bg-secondary)] rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                文档名称 (自动补全 .md 后缀)
              </label>
              <input
                type="text"
                value={fileName}
                onChange={(e) => {
                  setFileName(e.target.value);
                  setError('');
                }}
                placeholder="例如: 极简写作指南.md"
                autoFocus
                className="w-full px-3.5 py-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition-all"
              />
              {error && <p className="text-red-500 text-[11px] mt-1">{error}</p>}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] rounded-lg font-medium transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs bg-[var(--accent)] text-white font-bold rounded-lg hover:opacity-90 active:scale-95 transition-all shadow-xs"
              >
                创建文件
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
