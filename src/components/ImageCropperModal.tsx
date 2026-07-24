import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Cropper from 'cropperjs';
import 'cropperjs/dist/cropper.css';
import { 
  Crop, Palette, Sun, Sliders, Sparkles, RotateCcw, RotateCw, 
  FlipHorizontal, FlipVertical, RefreshCw, Check, Maximize2, 
  ZoomIn, ZoomOut, Aperture, EyeOff, Layers, Image as ImageIcon
} from 'lucide-react';

interface ImageCropperModalProps {
  imageSrc: string | null;
  onClose: () => void;
  onConfirm: (processedBase64: string) => void;
}

interface FilterState {
  brightness: number;  // 0 - 200%, default 100
  contrast: number;    // 0 - 200%, default 100
  grayscale: number;   // 0 - 100%, default 0
  saturation: number;  // 0 - 200%, default 100
  sepia: number;       // 0 - 100%, default 0
  invert: number;      // 0 - 100%, default 0
  blur: number;        // 0 - 10px, default 0
}

const DEFAULT_FILTERS: FilterState = {
  brightness: 100,
  contrast: 100,
  grayscale: 0,
  saturation: 100,
  sepia: 0,
  invert: 0,
  blur: 0,
};

const PRESETS: { name: string; filters: FilterState }[] = [
  { name: '原图', filters: { ...DEFAULT_FILTERS } },
  { name: '鲜艳', filters: { brightness: 105, contrast: 115, grayscale: 0, saturation: 145, sepia: 0, invert: 0, blur: 0 } },
  { name: '黑白', filters: { brightness: 105, contrast: 120, grayscale: 100, saturation: 100, sepia: 0, invert: 0, blur: 0 } },
  { name: '怀旧', filters: { brightness: 95, contrast: 105, grayscale: 0, saturation: 100, sepia: 75, invert: 0, blur: 0 } },
  { name: '高对比', filters: { brightness: 110, contrast: 150, grayscale: 0, saturation: 120, sepia: 0, invert: 0, blur: 0 } },
  { name: '电影感', filters: { brightness: 95, contrast: 130, grayscale: 0, saturation: 115, sepia: 25, invert: 0, blur: 0 } },
  { name: '反相', filters: { brightness: 100, contrast: 100, grayscale: 0, saturation: 100, sepia: 0, invert: 100, blur: 0 } },
  { name: '柔焦', filters: { brightness: 105, contrast: 95, grayscale: 0, saturation: 105, sepia: 0, invert: 0, blur: 2 } },
];

const ASPECT_RATIOS = [
  { label: '自由', value: NaN },
  { label: '1:1', value: 1 },
  { label: '4:3', value: 4 / 3 },
  { label: '16:9', value: 16 / 9 },
  { label: '3:2', value: 3 / 2 },
  { label: '9:16', value: 9 / 16 },
];

export const ImageCropperModal: React.FC<ImageCropperModalProps> = ({
  imageSrc,
  onClose,
  onConfirm,
}) => {
  const [activeTab, setActiveTab] = useState<'crop' | 'filter'>('crop');
  const [aspectRatio, setAspectRatio] = useState<number>(16 / 9);
  const [modalScale, setModalScale] = useState<number>(1.0);

  // Filters state
  const [filters, setFilters] = useState<FilterState>({ ...DEFAULT_FILTERS });

  // Flips state
  const [scaleX, setScaleX] = useState<number>(1);
  const [scaleY, setScaleY] = useState<number>(1);

  // Cropper ref
  const cropperRef = useRef<Cropper | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Construct CSS filter string
  const getFilterString = (f: FilterState) => {
    return `brightness(${f.brightness}%) contrast(${f.contrast}%) grayscale(${f.grayscale}%) saturate(${f.saturation}%) sepia(${f.sepia}%) invert(${f.invert}%) blur(${f.blur}px)`;
  };

  // Count active filter modifications
  const isModified = 
    filters.brightness !== 100 ||
    filters.contrast !== 100 ||
    filters.grayscale !== 0 ||
    filters.saturation !== 100 ||
    filters.sepia !== 0 ||
    filters.invert !== 0 ||
    filters.blur !== 0;

  // Destroy cropper on unmount
  useEffect(() => {
    return () => {
      if (cropperRef.current) {
        cropperRef.current.destroy();
        cropperRef.current = null;
      }
    };
  }, []);

  // Helper to get cropper container DOM element
  const getCropperContainer = (cropper: any): HTMLElement | null => {
    if (!cropper) return null;
    return cropper.container || cropper.cropper || (cropper.element ? cropper.element.parentElement : null);
  };

  // Sync filters real-time preview to CropperJS elements
  useEffect(() => {
    if (cropperRef.current) {
      const container = getCropperContainer(cropperRef.current);
      if (container) {
        const filterStr = getFilterString(filters);
        const imgs = container.querySelectorAll('img');
        imgs.forEach((img: HTMLImageElement) => {
          img.style.filter = filterStr;
        });
      }
    }
  }, [filters]);

  // Init CropperJS
  const handleImageLoad = () => {
    if (imgRef.current) {
      if (cropperRef.current) {
        cropperRef.current.destroy();
      }
      cropperRef.current = new Cropper(imgRef.current, {
        aspectRatio: aspectRatio,
        viewMode: 1,
        dragMode: 'move',
        autoCropArea: 0.9,
        ready() {
          if (cropperRef.current) {
            const container = getCropperContainer(cropperRef.current);
            if (container) {
              const filterStr = getFilterString(filters);
              const imgs = container.querySelectorAll('img');
              imgs.forEach((img: HTMLImageElement) => {
                img.style.filter = filterStr;
              });
            }
          }
        },
      });
    }
  };

  // Set Aspect Ratio
  const handleSetAspectRatio = (ratio: number) => {
    setAspectRatio(ratio);
    if (cropperRef.current) {
      cropperRef.current.setAspectRatio(ratio);
    }
  };

  // Rotation & Flips
  const handleRotate = (degree: number) => {
    if (cropperRef.current) {
      cropperRef.current.rotate(degree);
    }
  };

  const handleFlipX = () => {
    const nextScaleX = scaleX === 1 ? -1 : 1;
    setScaleX(nextScaleX);
    if (cropperRef.current) {
      cropperRef.current.scaleX(nextScaleX);
    }
  };

  const handleFlipY = () => {
    const nextScaleY = scaleY === 1 ? -1 : 1;
    setScaleY(nextScaleY);
    if (cropperRef.current) {
      cropperRef.current.scaleY(nextScaleY);
    }
  };

  const handleResetCrop = () => {
    if (cropperRef.current) {
      cropperRef.current.reset();
      setScaleX(1);
      setScaleY(1);
    }
  };

  // Reset Filters
  const handleResetFilters = () => {
    setFilters({ ...DEFAULT_FILTERS });
  };

  // Confirm and bake filter into output canvas
  const handleConfirm = () => {
    if (!cropperRef.current) return;

    const croppedCanvas = cropperRef.current.getCroppedCanvas();
    if (!croppedCanvas) return;

    // Offscreen canvas for filter baking
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = croppedCanvas.width;
    finalCanvas.height = croppedCanvas.height;

    const ctx = finalCanvas.getContext('2d');
    if (ctx) {
      const filterStr = getFilterString(filters);
      ctx.filter = filterStr;
      ctx.drawImage(croppedCanvas, 0, 0);
      const finalBase64 = finalCanvas.toDataURL('image/png');
      onConfirm(finalBase64);
    } else {
      onConfirm(croppedCanvas.toDataURL('image/png'));
    }
  };

  if (!imageSrc) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 z-[300] flex items-center justify-center p-4 backdrop-blur-md select-none overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.88, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.88, y: 20 }}
          style={{ transform: `scale(${modalScale})` }}
          onClick={(e) => e.stopPropagation()}
          className="bg-[var(--bg-primary)] rounded-3xl w-full max-w-3xl overflow-hidden flex flex-col shadow-2xl border border-[var(--border)] relative my-auto transition-transform"
        >
          {/* Header */}
          <div className="p-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-secondary)]/50">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center">
                <ImageIcon size={20} />
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base text-[var(--text-primary)]">
                  图片高级处理与编辑
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">裁剪缩放、旋转翻转与滤镜调色</p>
              </div>
            </div>

            {/* Modal Zoom & Close Toolbar */}
            <div className="flex items-center gap-1.5 bg-[var(--bg-primary)] rounded-xl p-1 border border-[var(--border)]">
              <button
                onClick={() => setModalScale(s => Math.max(0.6, Number((s - 0.1).toFixed(1))))}
                title="缩小弹窗"
                className="p-1.5 hover:bg-[var(--bg-secondary)] rounded-lg text-[var(--text-secondary)] transition-colors cursor-pointer"
              >
                <ZoomOut size={15} />
              </button>
              <span className="text-[10px] font-mono font-bold text-[var(--text-secondary)] px-1">
                {Math.round(modalScale * 100)}%
              </span>
              <button
                onClick={() => setModalScale(s => Math.min(1.5, Number((s + 0.1).toFixed(1))))}
                title="放大弹窗"
                className="p-1.5 hover:bg-[var(--bg-secondary)] rounded-lg text-[var(--text-secondary)] transition-colors cursor-pointer"
              >
                <ZoomIn size={15} />
              </button>

              <div className="w-px h-4 bg-[var(--border)] mx-0.5" />

              <button
                onClick={onClose}
                className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                title="关闭"
              >
                <Maximize2 size={15} className="rotate-45" />
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-2 bg-[var(--bg-secondary)]/20">
            <div className="flex items-center gap-2 bg-[var(--bg-secondary)] p-1 rounded-2xl border border-[var(--border)]">
              <button
                onClick={() => setActiveTab('crop')}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'crop'
                    ? 'bg-[var(--bg-primary)] text-blue-600 shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Crop size={14} />
                裁剪与翻转
              </button>

              <button
                onClick={() => setActiveTab('filter')}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer relative ${
                  activeTab === 'filter'
                    ? 'bg-[var(--bg-primary)] text-blue-600 shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Palette size={14} />
                滤镜与调色
                {isModified && (
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                )}
              </button>
            </div>

            {/* Quick Status Tag */}
            {isModified && (
              <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-full font-medium border border-amber-200/50">
                <Sparkles size={12} />
                <span>已自定义色彩调节</span>
                <button
                  onClick={handleResetFilters}
                  className="ml-1 text-[10px] underline hover:opacity-80 cursor-pointer"
                >
                  重置
                </button>
              </div>
            )}
          </div>

          {/* Main Content Area (Cropper Canvas & Controls) */}
          <div className="flex flex-col md:flex-row h-[380px] sm:h-[420px]">
            {/* Left: Cropper Viewport */}
            <div className="flex-1 relative bg-slate-900/90 p-4 flex items-center justify-center overflow-hidden">
              <img
                ref={imgRef}
                src={imageSrc}
                onLoad={handleImageLoad}
                className="max-h-full max-w-full block"
                alt="Source Crop Target"
              />
            </div>

            {/* Right Side Control Panel */}
            <div className="w-full md:w-80 bg-[var(--bg-primary)] border-t md:border-t-0 md:border-l border-[var(--border)] p-4 flex flex-col justify-between overflow-y-auto">
              
              {/* CROP TAB CONTROLS */}
              {activeTab === 'crop' && (
                <div className="space-y-4">
                  {/* Aspect Ratio Presets */}
                  <div>
                    <label className="text-xs font-bold text-[var(--text-primary)] mb-2 block flex items-center gap-1.5">
                      <Crop size={14} className="text-blue-500" />
                      剪裁比例 (Aspect Ratio):
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {ASPECT_RATIOS.map((item) => (
                        <button
                          key={item.label}
                          onClick={() => handleSetAspectRatio(item.value)}
                          className={`py-1.5 text-xs font-medium rounded-xl border transition-all cursor-pointer ${
                            (Number.isNaN(aspectRatio) && Number.isNaN(item.value)) || aspectRatio === item.value
                              ? 'bg-blue-50 text-blue-600 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800 font-bold'
                              : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border)] hover:bg-[var(--bg-primary)]'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Rotate & Flip Tools */}
                  <div className="space-y-2 pt-2 border-t border-[var(--border)]">
                    <label className="text-xs font-bold text-[var(--text-primary)] block">
                      方向与翻转:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleRotate(-90)}
                        className="py-2 px-3 bg-[var(--bg-secondary)] border border-[var(--border)] hover:bg-[var(--bg-primary)] text-[var(--text-primary)] rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <RotateCcw size={14} />
                        左转 90°
                      </button>

                      <button
                        onClick={() => handleRotate(90)}
                        className="py-2 px-3 bg-[var(--bg-secondary)] border border-[var(--border)] hover:bg-[var(--bg-primary)] text-[var(--text-primary)] rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <RotateCw size={14} />
                        右转 90°
                      </button>

                      <button
                        onClick={handleFlipX}
                        className={`py-2 px-3 border rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          scaleX === -1
                            ? 'bg-blue-50 text-blue-600 border-blue-300 dark:bg-blue-950 dark:text-blue-300'
                            : 'bg-[var(--bg-secondary)] border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg-primary)]'
                        }`}
                      >
                        <FlipHorizontal size={14} />
                        水平镜像
                      </button>

                      <button
                        onClick={handleFlipY}
                        className={`py-2 px-3 border rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          scaleY === -1
                            ? 'bg-blue-50 text-blue-600 border-blue-300 dark:bg-blue-950 dark:text-blue-300'
                            : 'bg-[var(--bg-secondary)] border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg-primary)]'
                        }`}
                      >
                        <FlipVertical size={14} />
                        垂直镜像
                      </button>
                    </div>
                  </div>

                  {/* Reset Crop */}
                  <div className="pt-2 border-t border-[var(--border)]">
                    <button
                      onClick={handleResetCrop}
                      className="w-full py-2 text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw size={13} />
                      重置所有裁剪旋转
                    </button>
                  </div>
                </div>
              )}

              {/* FILTERS TAB CONTROLS */}
              {activeTab === 'filter' && (
                <div className="space-y-3">
                  {/* Presets */}
                  <div>
                    <label className="text-xs font-bold text-[var(--text-primary)] mb-1.5 block flex items-center gap-1.5">
                      <Sparkles size={14} className="text-amber-500" />
                      快速色彩预设:
                    </label>
                    <div className="grid grid-cols-4 gap-1">
                      {PRESETS.map((preset) => (
                        <button
                          key={preset.name}
                          onClick={() => setFilters({ ...preset.filters })}
                          className="py-1 px-1.5 text-[11px] font-medium bg-[var(--bg-secondary)] hover:bg-blue-50 dark:hover:bg-blue-950 border border-[var(--border)] rounded-lg text-[var(--text-primary)] transition-all cursor-pointer text-center truncate"
                        >
                          {preset.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sliders Container */}
                  <div className="space-y-2.5 pt-2 border-t border-[var(--border)]">
                    {/* Brightness */}
                    <div>
                      <div className="flex justify-between text-xs font-medium text-[var(--text-primary)] mb-0.5">
                        <span className="flex items-center gap-1">
                          <Sun size={13} className="text-amber-500" />
                          亮度 (Brightness)
                        </span>
                        <span className="font-mono text-slate-500">{filters.brightness}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="200"
                        value={filters.brightness}
                        onChange={(e) => setFilters({ ...filters, brightness: Number(e.target.value) })}
                        className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                      />
                    </div>

                    {/* Contrast */}
                    <div>
                      <div className="flex justify-between text-xs font-medium text-[var(--text-primary)] mb-0.5">
                        <span className="flex items-center gap-1">
                          <Sliders size={13} className="text-blue-500" />
                          对比度 (Contrast)
                        </span>
                        <span className="font-mono text-slate-500">{filters.contrast}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="200"
                        value={filters.contrast}
                        onChange={(e) => setFilters({ ...filters, contrast: Number(e.target.value) })}
                        className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                      />
                    </div>

                    {/* Grayscale */}
                    <div>
                      <div className="flex justify-between text-xs font-medium text-[var(--text-primary)] mb-0.5">
                        <span className="flex items-center gap-1">
                          <Palette size={13} className="text-purple-500" />
                          黑白/灰度 (Grayscale)
                        </span>
                        <span className="font-mono text-slate-500">{filters.grayscale}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={filters.grayscale}
                        onChange={(e) => setFilters({ ...filters, grayscale: Number(e.target.value) })}
                        className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                      />
                    </div>

                    {/* Saturation */}
                    <div>
                      <div className="flex justify-between text-xs font-medium text-[var(--text-primary)] mb-0.5">
                        <span className="flex items-center gap-1">
                          <Aperture size={13} className="text-emerald-500" />
                          饱和度 (Saturation)
                        </span>
                        <span className="font-mono text-slate-500">{filters.saturation}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="200"
                        value={filters.saturation}
                        onChange={(e) => setFilters({ ...filters, saturation: Number(e.target.value) })}
                        className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                      />
                    </div>

                    {/* Sepia */}
                    <div>
                      <div className="flex justify-between text-xs font-medium text-[var(--text-primary)] mb-0.5">
                        <span className="flex items-center gap-1">
                          <Layers size={13} className="text-orange-500" />
                          怀旧复古 (Sepia)
                        </span>
                        <span className="font-mono text-slate-500">{filters.sepia}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={filters.sepia}
                        onChange={(e) => setFilters({ ...filters, sepia: Number(e.target.value) })}
                        className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                      />
                    </div>

                    {/* Invert */}
                    <div>
                      <div className="flex justify-between text-xs font-medium text-[var(--text-primary)] mb-0.5">
                        <span className="flex items-center gap-1">
                          <FlipHorizontal size={13} className="text-pink-500" />
                          底片反相 (Invert)
                        </span>
                        <span className="font-mono text-slate-500">{filters.invert}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={filters.invert}
                        onChange={(e) => setFilters({ ...filters, invert: Number(e.target.value) })}
                        className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                      />
                    </div>

                    {/* Blur */}
                    <div>
                      <div className="flex justify-between text-xs font-medium text-[var(--text-primary)] mb-0.5">
                        <span className="flex items-center gap-1">
                          <EyeOff size={13} className="text-slate-400" />
                          高斯模糊 (Blur)
                        </span>
                        <span className="font-mono text-slate-500">{filters.blur}px</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        step="0.5"
                        value={filters.blur}
                        onChange={(e) => setFilters({ ...filters, blur: Number(e.target.value) })}
                        className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                      />
                    </div>
                  </div>

                  {/* Reset Filters */}
                  <div className="pt-2 border-t border-[var(--border)]">
                    <button
                      onClick={handleResetFilters}
                      className="w-full py-1.5 text-xs font-medium text-amber-600 dark:text-amber-400 hover:underline transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <RefreshCw size={12} />
                      重置所有调色参数
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer Action Bar */}
          <div className="p-4 border-t border-[var(--border)] flex justify-between items-center bg-[var(--bg-secondary)]/50">
            <span className="text-xs text-[var(--text-secondary)] hidden sm:block">
              拖拽四个边角调整裁剪框，支持滤镜调色即时渲染
            </span>

            <div className="flex gap-3 ml-auto">
              <button
                onClick={onClose}
                className="px-5 py-2 border border-[var(--border)] bg-[var(--bg-primary)] hover:bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-xl transition-colors cursor-pointer font-medium text-xs sm:text-sm"
              >
                取消
              </button>
              <button
                onClick={handleConfirm}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl transition-all cursor-pointer font-bold text-xs sm:text-sm shadow-md flex items-center gap-1.5"
              >
                <Check size={16} />
                确认插入文档
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
