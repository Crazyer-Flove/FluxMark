import React, { useState, useEffect } from 'react';
import { 
  Printer, Image as ImageIcon, X, Sparkles, 
  CheckCircle2, Loader2, Bookmark, Download, Zap, Eye, Layout
} from 'lucide-react';

export interface PDFExportOptions {
  pageRangeType: 'all' | 'custom';
  customPages: string;
  pageQuality: 'standard' | 'high'; // 150DPI vs 300DPI
}

export interface ImageExportOptions {
  padding: 'tight' | 'standard' | 'relaxed'; // 16px, 32px, 48px
  pixelRatio: 1 | 2 | 3;
  bgColorType: 'theme' | 'white' | 'dark';
}

export interface PDFExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'pdf' | 'image';
  onExportPDF: (options: PDFExportOptions) => Promise<void>;
  onExportImage: (options: ImageExportOptions) => Promise<void>;
  // Backward compatibility alias for single export prop
  onExport?: (options: PDFExportOptions) => Promise<void>;
  docName: string;
  currentThemeName: string;
  wordCount?: number;
  isGenerating: boolean;
  progressPercent?: number;
  progressStatusText?: string;
}

export const PDFExportModal: React.FC<PDFExportModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'pdf',
  onExportPDF,
  onExportImage,
  onExport,
  docName,
  currentThemeName,
  wordCount = 0,
  isGenerating,
  progressPercent = 0,
  progressStatusText = '',
}) => {
  const [activeTab, setActiveTab] = useState<'pdf' | 'image'>('pdf');

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  const [pdfOptions, setPdfOptions] = useState<PDFExportOptions>({
    pageRangeType: 'all',
    customPages: '1, 3-5, 7',
    pageQuality: 'high',
  });

  const [imageOptions, setImageOptions] = useState<ImageExportOptions>({
    padding: 'standard',
    pixelRatio: 2,
    bgColorType: 'theme',
  });

  if (!isOpen) return null;

  const handleStartExportPDF = async () => {
    if (onExportPDF) {
      await onExportPDF(pdfOptions);
    } else if (onExport) {
      await onExport(pdfOptions);
    }
  };

  const handleStartExportImage = async () => {
    if (onExportImage) {
      await onExportImage(imageOptions);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 pdf-export-modal-root">
      <div 
        className="w-full max-w-lg bg-[var(--bg-primary)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden text-[var(--text-primary)] flex flex-col font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Title & Tab Switcher */}
        <div className="px-5 pt-4 pb-3 border-b border-[var(--border)] bg-[var(--bg-secondary)]/50 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                {activeTab === 'pdf' ? <Printer size={18} /> : <ImageIcon size={18} />}
              </div>
              <div>
                <h3 className="font-bold text-base leading-tight flex items-center gap-2">
                  {activeTab === 'pdf' ? '导出 PDF 文档' : '导出长图海报'}
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/80 dark:text-blue-400 border border-blue-500/30">
                    {activeTab === 'pdf' ? 'A4 矢量适配' : '高清像素抓取'}
                  </span>
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5 truncate max-w-[280px]">
                  文档: [{docName || '未命名文档'}]
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              disabled={isGenerating}
              className="p-1.5 hover:bg-[var(--bg-secondary)] rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer disabled:opacity-50"
            >
              <X size={18} />
            </button>
          </div>

          {/* Tab Navigation Segmented Control */}
          <div className="grid grid-cols-2 p-1 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl gap-1">
            <button
              type="button"
              disabled={isGenerating}
              onClick={() => setActiveTab('pdf')}
              className={`py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'pdf'
                  ? 'bg-[var(--bg-primary)] text-blue-600 dark:text-blue-400 shadow-xs border border-[var(--border)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Printer size={14} />
              <span>📄 PDF 矢量文档</span>
            </button>

            <button
              type="button"
              disabled={isGenerating}
              onClick={() => setActiveTab('image')}
              className={`py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'image'
                  ? 'bg-[var(--bg-primary)] text-blue-600 dark:text-blue-400 shadow-xs border border-[var(--border)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <ImageIcon size={14} />
              <span>🖼️ 高清网页长图</span>
            </button>
          </div>
        </div>

        {/* Modal Body Content */}
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {activeTab === 'pdf' ? (
            /* ======================================================== */
            /*                      PDF TAB CONTENT                     */
            /* ======================================================== */
            <div className="space-y-4">
              {/* Page Range Selection */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
                  <Bookmark size={13} className="text-blue-500" />
                  <span>导出页数范围</span>
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={isGenerating}
                    onClick={() => setPdfOptions(prev => ({ ...prev, pageRangeType: 'all' }))}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                      pdfOptions.pageRangeType === 'all'
                        ? 'bg-blue-500/10 border-blue-500 text-[var(--text-primary)] font-bold shadow-2xs'
                        : 'bg-[var(--bg-secondary)] border-[var(--border)] text-[var(--text-secondary)]'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs">导出全部页面</span>
                      {pdfOptions.pageRangeType === 'all' && <CheckCircle2 size={15} className="text-blue-500" />}
                    </div>
                    <div className="text-[10px] font-normal opacity-80 truncate">
                      完整输出全部 A4 页码
                    </div>
                  </button>

                  <button
                    type="button"
                    disabled={isGenerating}
                    onClick={() => setPdfOptions(prev => ({ ...prev, pageRangeType: 'custom' }))}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                      pdfOptions.pageRangeType === 'custom'
                        ? 'bg-blue-500/10 border-blue-500 text-[var(--text-primary)] font-bold shadow-2xs'
                        : 'bg-[var(--bg-secondary)] border-[var(--border)] text-[var(--text-secondary)]'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs">自定义页码 / 范围</span>
                      {pdfOptions.pageRangeType === 'custom' && <CheckCircle2 size={15} className="text-blue-500" />}
                    </div>
                    <div className="text-[10px] font-normal opacity-80 truncate">
                      指定单页 (如 1) 或范围 (如 1-3)
                    </div>
                  </button>
                </div>

                {/* Custom Page Input Field */}
                {pdfOptions.pageRangeType === 'custom' && (
                  <div className="p-3.5 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl space-y-2.5 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[var(--text-primary)]">指定输出页码与范围：</span>
                      <span className="text-[10px] text-[var(--text-secondary)] font-medium">支持单页、连续区间或组合</span>
                    </div>
                    <input
                      type="text"
                      disabled={isGenerating}
                      value={pdfOptions.customPages}
                      onChange={(e) => setPdfOptions(prev => ({ ...prev, customPages: e.target.value }))}
                      placeholder="如: 1, 3-5, 7 或 2, 4"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-hidden focus:border-blue-500 font-mono shadow-2xs"
                    />
                    <div className="flex flex-wrap gap-1.5 pt-1 border-t border-[var(--border)]/60">
                      <span className="text-[10px] text-[var(--text-secondary)] self-center">快速预设：</span>
                      {['1', '1-3', '1, 3, 5', '1, 3-5, 7'].map(sample => (
                        <button
                          key={sample}
                          type="button"
                          disabled={isGenerating}
                          onClick={() => setPdfOptions(prev => ({ ...prev, customPages: sample }))}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-blue-500 hover:border-blue-400 transition-colors cursor-pointer"
                        >
                          {sample}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Quality & Resolution Selection */}
              <div className="space-y-2.5 pt-2 border-t border-[var(--border)]">
                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
                  <Zap size={13} className="text-blue-500" />
                  <span>渲染精度与采样质量</span>
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={isGenerating}
                    onClick={() => setPdfOptions(prev => ({ ...prev, pageQuality: 'standard' }))}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                      pdfOptions.pageQuality === 'standard'
                        ? 'bg-blue-500/10 border-blue-500 text-[var(--text-primary)] font-bold shadow-2xs'
                        : 'bg-[var(--bg-secondary)] border-[var(--border)] text-[var(--text-secondary)]'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs">⚡ 标准清晰 (150 DPI)</span>
                      {pdfOptions.pageQuality === 'standard' && <CheckCircle2 size={15} className="text-blue-500" />}
                    </div>
                    <div className="text-[10px] font-normal opacity-80 truncate">
                      快速渲染，适合屏幕阅读与网络传输
                    </div>
                  </button>

                  <button
                    type="button"
                    disabled={isGenerating}
                    onClick={() => setPdfOptions(prev => ({ ...prev, pageQuality: 'high' }))}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                      pdfOptions.pageQuality === 'high'
                        ? 'bg-blue-500/10 border-blue-500 text-[var(--text-primary)] font-bold shadow-2xs'
                        : 'bg-[var(--bg-secondary)] border-[var(--border)] text-[var(--text-secondary)]'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs">🌟 矢量超清 (300 DPI)</span>
                      {pdfOptions.pageQuality === 'high' && <CheckCircle2 size={15} className="text-blue-500" />}
                    </div>
                    <div className="text-[10px] font-normal opacity-80 truncate">
                      出版级高分辨率，适合正式打印归档
                    </div>
                  </button>
                </div>
              </div>

              {/* Document Specs Card */}
              <div className="p-3 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl text-xs space-y-1.5 text-[var(--text-secondary)]">
                <div className="flex justify-between items-center">
                  <span>当前应用主题：</span>
                  <span className="font-bold text-[var(--text-primary)] px-2 py-0.5 rounded bg-[var(--bg-primary)] border border-[var(--border)]">
                    {currentThemeName || '默认主题'}
                  </span>
                </div>
                {wordCount > 0 && (
                  <div className="flex justify-between items-center">
                    <span>文档正文总字数：</span>
                    <span className="font-mono font-medium text-[var(--text-primary)]">{wordCount} 字</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* ======================================================== */
            /*                    IMAGE TAB CONTENT                     */
            /* ======================================================== */
            <div className="space-y-4">
              {/* Canvas Padding Style */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
                  <Layout size={13} className="text-blue-500" />
                  <span>画布内边距边框</span>
                </label>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    disabled={isGenerating}
                    onClick={() => setImageOptions(prev => ({ ...prev, padding: 'tight' }))}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                      imageOptions.padding === 'tight'
                        ? 'bg-blue-500/10 border-blue-500 text-[var(--text-primary)] font-bold shadow-2xs'
                        : 'bg-[var(--bg-secondary)] border-[var(--border)] text-[var(--text-secondary)]'
                    }`}
                  >
                    <span className="text-xs">紧凑 (16px)</span>
                    <span className="text-[10px] opacity-75 font-normal">适应手机小屏</span>
                  </button>

                  <button
                    type="button"
                    disabled={isGenerating}
                    onClick={() => setImageOptions(prev => ({ ...prev, padding: 'standard' }))}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                      imageOptions.padding === 'standard'
                        ? 'bg-blue-500/10 border-blue-500 text-[var(--text-primary)] font-bold shadow-2xs'
                        : 'bg-[var(--bg-secondary)] border-[var(--border)] text-[var(--text-secondary)]'
                    }`}
                  >
                    <span className="text-xs">标准 (32px)</span>
                    <span className="text-[10px] opacity-75 font-normal">优雅呼吸感</span>
                  </button>

                  <button
                    type="button"
                    disabled={isGenerating}
                    onClick={() => setImageOptions(prev => ({ ...prev, padding: 'relaxed' }))}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                      imageOptions.padding === 'relaxed'
                        ? 'bg-blue-500/10 border-blue-500 text-[var(--text-primary)] font-bold shadow-2xs'
                        : 'bg-[var(--bg-secondary)] border-[var(--border)] text-[var(--text-secondary)]'
                    }`}
                  >
                    <span className="text-xs">宽裕 (48px)</span>
                    <span className="text-[10px] opacity-75 font-normal">海报级留白</span>
                  </button>
                </div>
              </div>

              {/* Background Style Options */}
              <div className="space-y-2.5 pt-2 border-t border-[var(--border)]">
                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
                  <Eye size={13} className="text-blue-500" />
                  <span>长图渲染底色</span>
                </label>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    disabled={isGenerating}
                    onClick={() => setImageOptions(prev => ({ ...prev, bgColorType: 'theme' }))}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                      imageOptions.bgColorType === 'theme'
                        ? 'bg-blue-500/10 border-blue-500 text-[var(--text-primary)] font-bold shadow-2xs'
                        : 'bg-[var(--bg-secondary)] border-[var(--border)] text-[var(--text-secondary)]'
                    }`}
                  >
                    <span className="text-xs truncate">跟随主题</span>
                    <span className="text-[10px] opacity-75 font-normal truncate">[{currentThemeName}]</span>
                  </button>

                  <button
                    type="button"
                    disabled={isGenerating}
                    onClick={() => setImageOptions(prev => ({ ...prev, bgColorType: 'white' }))}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                      imageOptions.bgColorType === 'white'
                        ? 'bg-blue-500/10 border-blue-500 text-[var(--text-primary)] font-bold shadow-2xs'
                        : 'bg-[var(--bg-secondary)] border-[var(--border)] text-[var(--text-secondary)]'
                    }`}
                  >
                    <span className="text-xs">纯白无瑕</span>
                    <span className="text-[10px] opacity-75 font-normal">经典白底</span>
                  </button>

                  <button
                    type="button"
                    disabled={isGenerating}
                    onClick={() => setImageOptions(prev => ({ ...prev, bgColorType: 'dark' }))}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                      imageOptions.bgColorType === 'dark'
                        ? 'bg-blue-500/10 border-blue-500 text-[var(--text-primary)] font-bold shadow-2xs'
                        : 'bg-[var(--bg-secondary)] border-[var(--border)] text-[var(--text-secondary)]'
                    }`}
                  >
                    <span className="text-xs">深邃暗黑</span>
                    <span className="text-[10px] opacity-75 font-normal">高对比黑底</span>
                  </button>
                </div>
              </div>

              {/* Pixel Ratio / Quality */}
              <div className="space-y-2.5 pt-2 border-t border-[var(--border)]">
                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
                  <Zap size={13} className="text-blue-500" />
                  <span>图像密度 (Pixel Density)</span>
                </label>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    disabled={isGenerating}
                    onClick={() => setImageOptions(prev => ({ ...prev, pixelRatio: 1 }))}
                    className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                      imageOptions.pixelRatio === 1
                        ? 'bg-blue-500/10 border-blue-500 text-[var(--text-primary)] font-bold shadow-2xs'
                        : 'bg-[var(--bg-secondary)] border-[var(--border)] text-[var(--text-secondary)]'
                    }`}
                  >
                    <span className="text-xs">标准 (1x)</span>
                  </button>

                  <button
                    type="button"
                    disabled={isGenerating}
                    onClick={() => setImageOptions(prev => ({ ...prev, pixelRatio: 2 }))}
                    className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                      imageOptions.pixelRatio === 2
                        ? 'bg-blue-500/10 border-blue-500 text-[var(--text-primary)] font-bold shadow-2xs'
                        : 'bg-[var(--bg-secondary)] border-[var(--border)] text-[var(--text-secondary)]'
                    }`}
                  >
                    <span className="text-xs">高清 (2x)</span>
                  </button>

                  <button
                    type="button"
                    disabled={isGenerating}
                    onClick={() => setImageOptions(prev => ({ ...prev, pixelRatio: 3 }))}
                    className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                      imageOptions.pixelRatio === 3
                        ? 'bg-blue-500/10 border-blue-500 text-[var(--text-primary)] font-bold shadow-2xs'
                        : 'bg-[var(--bg-secondary)] border-[var(--border)] text-[var(--text-secondary)]'
                    }`}
                  >
                    <span className="text-xs">超清 (3x)</span>
                  </button>
                </div>
              </div>

              {/* Image Specs Card */}
              <div className="p-3 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl text-xs space-y-1.5 text-[var(--text-secondary)]">
                <div className="flex justify-between items-center">
                  <span>长图输出格式：</span>
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400">PNG 高保真图像</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>网页全景捕获：</span>
                  <span className="text-[var(--text-primary)]">无损完整高度拼接</span>
                </div>
              </div>
            </div>
          )}

          {/* Real-time Progress Bar during generation */}
          {isGenerating ? (
            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-2xl space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between text-xs font-bold text-blue-600 dark:text-blue-400">
                <span className="flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin text-blue-500" />
                  <span>{progressStatusText || '正在进行高精度 Canvas 渲染中...'}</span>
                </span>
                <span className="font-mono text-sm px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-600 dark:text-blue-300 font-extrabold">
                  {Math.min(100, Math.max(0, Math.round(progressPercent)))}%
                </span>
              </div>

              <div className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] h-3.5 rounded-full overflow-hidden p-0.5 relative shadow-inner">
                <div 
                  className="bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-500 h-full rounded-full transition-all duration-300 relative overflow-hidden shadow-xs"
                  style={{ width: `${Math.min(100, Math.max(4, progressPercent))}%` }}
                >
                  <div className="absolute inset-0 bg-white/25 animate-pulse" />
                </div>
              </div>

              <div className="flex justify-between items-center text-[10px] text-[var(--text-secondary)] font-medium">
                <span>实时状态：全景 HTML5 DOM 节点采样</span>
                <span>{progressPercent >= 100 ? '导出成功！' : '请稍候...'}</span>
              </div>
            </div>
          ) : (
            /* Informational Banner */
            <div className="p-3 bg-blue-50/80 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/60 rounded-xl text-blue-800 dark:text-blue-200 text-xs flex items-start gap-2.5">
              <Sparkles size={16} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                {activeTab === 'pdf' ? (
                  <span><b>A4 矢量精密切割：</b>智能切分每页 A4 布局，自动避让断行并生成标准离线 PDF。</span>
                ) : (
                  <span><b>全景高精长图：</b>原汁原味还原编辑器视觉排版与图片渲染，一键生成无缝 PNG 长图。</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-[var(--border)] bg-[var(--bg-secondary)]/50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isGenerating}
            className="px-4 py-2 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            取消
          </button>

          {activeTab === 'pdf' ? (
            <button
              type="button"
              onClick={handleStartExportPDF}
              disabled={isGenerating}
              className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>正在导出 PDF...</span>
                </>
              ) : (
                <>
                  <Printer size={15} />
                  <span>生成并导出 PDF</span>
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStartExportImage}
              disabled={isGenerating}
              className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>正在生成长图...</span>
                </>
              ) : (
                <>
                  <Download size={15} />
                  <span>生成并导出长图</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export const ExportModal = PDFExportModal;
