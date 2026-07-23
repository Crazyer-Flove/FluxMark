import React, { useState } from 'react';
import { Highlighter, Check, X, RotateCcw, Palette, Sparkles, Sliders } from 'lucide-react';
import { Editor } from '@tiptap/react';

export interface HighlightColorPreset {
  id: string;
  name: string;
  color: string; // Background highlight color hex
  textColor: string; // Recommended text color for contrast
  border: string;
}

export const HIGHLIGHT_PRESETS: HighlightColorPreset[] = [
  { id: 'yellow', name: '荧光黄', color: '#fef08a', textColor: '#854d0e', border: '#fde047' },
  { id: 'green', name: '薄荷绿', color: '#bbf7d0', textColor: '#166534', border: '#86efac' },
  { id: 'blue', name: '柔冰蓝', color: '#bfdbfe', textColor: '#1e40af', border: '#93c5fd' },
  { id: 'pink', name: '蜜桃粉', color: '#fbcfe8', textColor: '#9d174d', border: '#f472b6' },
  { id: 'orange', name: '暖柿橘', color: '#fed7aa', textColor: '#9a3412', border: '#fb923c' },
  { id: 'purple', name: '薰衣紫', color: '#e9d5ff', textColor: '#6b21a8', border: '#c084fc' },
  { id: 'red', name: '警示红', color: '#fecaca', textColor: '#991b1b', border: '#fca5a5' },
  { id: 'gray', name: '优雅灰', color: '#e2e8f0', textColor: '#334155', border: '#cbd5e1' },
];

interface HighlightPopoverProps {
  editor: Editor | null;
  onApplyHighlight: (color: string) => void;
  onClearHighlight: () => void;
  currentColor?: string | null;
  onClose?: () => void;
  className?: string;
}

export const HighlightPopover: React.FC<HighlightPopoverProps> = ({
  editor,
  onApplyHighlight,
  onClearHighlight,
  currentColor,
  onClose,
  className = '',
}) => {
  const [customColor, setCustomColor] = useState<string>(currentColor || '#fef08a');
  const [activeTab, setActiveTab] = useState<'preset' | 'custom'>('preset');

  const isHighlighted = editor?.isActive('highlight');
  const activeHighlightAttrs = editor?.getAttributes('highlight');
  const activeHighlightColor = activeHighlightAttrs?.color || currentColor || '#fef08a';

  return (
    <div 
      className={`bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-3 w-72 flex flex-col gap-3 select-none backdrop-blur-md z-50 transition-all ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700/80">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 rounded-lg">
            <Highlighter size={16} />
          </div>
          <div>
            <span className="text-xs font-bold block leading-tight">文本高亮调色盘</span>
            <span className="text-[10px] text-slate-400 font-medium">支持多色预设与自定义画笔</span>
          </div>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Mode Tabs */}
      <div className="flex bg-slate-100 dark:bg-slate-700/60 p-0.5 rounded-xl text-xs font-medium">
        <button
          onClick={() => setActiveTab('preset')}
          className={`flex-1 py-1 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'preset'
              ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-bold shadow-xs'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Palette size={13} />
          <span>经典淡彩</span>
        </button>
        <button
          onClick={() => setActiveTab('custom')}
          className={`flex-1 py-1 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'custom'
              ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-bold shadow-xs'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Sliders size={13} />
          <span>自定义调色</span>
        </button>
      </div>

      {/* Preset Colors Grid */}
      {activeTab === 'preset' ? (
        <div className="grid grid-cols-4 gap-2">
          {HIGHLIGHT_PRESETS.map((preset) => {
            const isSelected = isHighlighted && activeHighlightColor.toLowerCase() === preset.color.toLowerCase();
            return (
              <button
                key={preset.id}
                onClick={() => onApplyHighlight(preset.color)}
                title={`高亮颜色：${preset.name}`}
                className={`group relative flex flex-col items-center justify-center p-2 rounded-xl border transition-all cursor-pointer ${
                  isSelected 
                    ? 'border-blue-500 ring-2 ring-blue-400/40 shadow-xs scale-105' 
                    : 'border-slate-200/80 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:scale-102'
                }`}
                style={{ backgroundColor: preset.color }}
              >
                <div 
                  className="text-[11px] font-bold tracking-tight truncate max-w-full px-1 py-0.5 rounded"
                  style={{ color: preset.textColor }}
                >
                  {preset.name}
                </div>
                {isSelected && (
                  <div className="absolute -top-1 -right-1 bg-blue-600 text-white rounded-full p-0.5 shadow-xs">
                    <Check size={10} strokeWidth={3} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      ) : (
        /* Custom Color Picker Tab */
        <div className="flex flex-col gap-2.5 bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
          <div className="flex items-center gap-2">
            <input 
              type="color" 
              value={customColor}
              onChange={(e) => setCustomColor(e.target.value)}
              className="w-9 h-9 rounded-lg cursor-pointer border border-slate-300 dark:border-slate-600 bg-transparent p-0.5"
            />
            <div className="flex-1 min-w-0">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">十六进制颜色</span>
              <input 
                type="text" 
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
                className="w-full text-xs font-mono font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded-md text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={() => onApplyHighlight(customColor)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shrink-0 shadow-xs"
            >
              应用
            </button>
          </div>
        </div>
      )}

      {/* Live Sample Preview */}
      <div className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-700/50 flex items-center justify-between text-xs">
        <span className="text-slate-400 text-[10px] font-bold">高亮效果预览:</span>
        <span 
          className="px-2 py-0.5 rounded-sm font-medium transition-all"
          style={{ backgroundColor: activeHighlightColor, color: '#1e293b' }}
        >
          样例文本 Highlight
        </span>
      </div>

      {/* Bottom Actions */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-700/80 flex items-center justify-between gap-2">
        <button
          onClick={onClearHighlight}
          disabled={!isHighlighted}
          className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-red-50 dark:bg-slate-700 dark:hover:bg-red-950/40 text-slate-600 hover:text-red-600 dark:text-slate-300 dark:hover:text-red-400 rounded-xl text-xs font-medium transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:hover:bg-slate-100 disabled:hover:text-slate-600 cursor-pointer"
        >
          <RotateCcw size={13} />
          <span>清除高亮</span>
        </button>

        <button
          onClick={() => onApplyHighlight('#fef08a')}
          className="py-1.5 px-3 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer border border-amber-200/60 dark:border-amber-800/60"
        >
          <Sparkles size={13} />
          <span>一键经典黄</span>
        </button>
      </div>
    </div>
  );
};
