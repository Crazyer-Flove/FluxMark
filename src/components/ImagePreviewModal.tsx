import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Image as ImageIcon, Download, ExternalLink, Plus, Check, FileText } from 'lucide-react';
import { PreviewImageInfo } from '../types';

interface ImagePreviewModalProps {
  isOpen: boolean;
  imageInfo: PreviewImageInfo | null;
  onClose: () => void;
  onInsertToEditor: (url: string, name: string) => void;
}

export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
  isOpen,
  imageInfo,
  onClose,
  onInsertToEditor,
}) => {
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const [inserted, setInserted] = useState(false);

  useEffect(() => {
    if (imageInfo?.url) {
      setInserted(false);
      const img = new Image();
      img.onload = () => {
        setDimensions({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.src = imageInfo.url;
    } else {
      setDimensions(null);
    }
  }, [imageInfo]);

  if (!isOpen || !imageInfo) return null;

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '未知大小';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleInsert = () => {
    onInsertToEditor(imageInfo.relativePath || imageInfo.url, imageInfo.name);
    setInserted(true);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = imageInfo.url;
    a.download = imageInfo.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] bg-black/75 backdrop-blur-md flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border)] rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="px-5 py-3.5 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-secondary)]/50">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-lg shrink-0">
                <ImageIcon size={18} />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold truncate">{imageInfo.name}</h3>
                <p className="text-[11px] text-[var(--text-secondary)]">
                  {formatFileSize(imageInfo.size)}
                  {dimensions && ` • ${dimensions.width} × ${dimensions.height} px`}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-[var(--bg-secondary)] rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Image Display Container */}
          <div className="flex-1 p-6 flex items-center justify-center bg-black/20 overflow-auto min-h-[280px] max-h-[58vh]">
            <img
              src={imageInfo.url}
              alt={imageInfo.name}
              className="max-w-full max-h-[52vh] object-contain rounded-lg shadow-lg border border-slate-700/30"
            />
          </div>

          {/* Actions Footer */}
          <div className="px-5 py-3.5 border-t border-[var(--border)] flex items-center justify-between bg-[var(--bg-secondary)]/30 gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownload}
                className="px-3 py-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--bg-secondary)] text-xs font-medium text-[var(--text-secondary)] flex items-center gap-1.5 transition-colors"
              >
                <Download size={14} />
                <span>下载图片</span>
              </button>
              <a
                href={imageInfo.url}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--bg-secondary)] text-xs font-medium text-[var(--text-secondary)] flex items-center gap-1.5 transition-colors"
              >
                <ExternalLink size={14} />
                <span>新标签打开</span>
              </a>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-1.5 rounded-lg text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] font-medium transition-colors"
              >
                关闭
              </button>
              <button
                onClick={handleInsert}
                disabled={inserted}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 text-white shadow-sm transition-all ${
                  inserted
                    ? 'bg-emerald-600'
                    : 'bg-[var(--accent)] hover:opacity-90 active:scale-95'
                }`}
              >
                {inserted ? (
                  <>
                    <Check size={14} />
                    <span>已插入文档</span>
                  </>
                ) : (
                  <>
                    <Plus size={14} />
                    <span>插入到当前文档</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
