import React, { useState } from 'react';
import { 
  Palette, Sparkles, Grid, Sliders, X, Check, RotateCcw, 
  Layers, Eye, Wand2, Compass, MoveRight, Maximize2, Repeat, MoveVertical, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export type PatternType = 'none' | 'dots' | 'grid' | 'stripes' | 'mesh' | 'waves';
export type GradientType = 'linear' | 'radial' | 'solid';
export type SlideTransitionType = 'none' | 'slide-x' | 'fade' | 'slide-y' | 'zoom' | 'flip';

export interface PresBgConfig {
  presetId: string;
  gradientType: GradientType;
  colorStart: string;
  colorMiddle?: string;
  colorEnd: string;
  gradientAngle: number; // in degrees
  pattern: PatternType;
  patternOpacity: number; // 0 to 1
  cardStyle: 'glass' | 'solid' | 'bordered' | 'minimal';
  transitionType: SlideTransitionType;
}

export const DEFAULT_PRES_BG_CONFIG: PresBgConfig = {
  presetId: 'theme',
  gradientType: 'linear',
  colorStart: '#020617',
  colorMiddle: '#0f172a',
  colorEnd: '#020617',
  gradientAngle: 135,
  pattern: 'none',
  patternOpacity: 0.25,
  cardStyle: 'glass',
  transitionType: 'fade',
};

export interface PresetOption {
  id: string;
  name: string;
  tag: string;
  desc: string;
  config: PresBgConfig;
}

export const PRES_BG_PRESETS: PresetOption[] = [
  {
    id: 'slate',
    name: '暗夜极简',
    tag: '经典默认',
    desc: '高质感深灰 Slate 渐变底色，专注高效讲演',
    config: {
      presetId: 'slate',
      gradientType: 'linear',
      colorStart: '#020617',
      colorMiddle: '#0f172a',
      colorEnd: '#020617',
      gradientAngle: 135,
      pattern: 'none',
      patternOpacity: 0,
      cardStyle: 'glass',
      transitionType: 'slide-x',
    }
  },
  {
    id: 'aurora',
    name: '极光梦幻',
    tag: '紫蓝光晕',
    desc: '深邃夜空融入靛蓝与紫罗兰微光弥散',
    config: {
      presetId: 'aurora',
      gradientType: 'radial',
      colorStart: '#1e1b4b',
      colorMiddle: '#090d16',
      colorEnd: '#020617',
      gradientAngle: 135,
      pattern: 'mesh',
      patternOpacity: 0.35,
      cardStyle: 'glass',
      transitionType: 'fade',
    }
  },
  {
    id: 'ocean',
    name: '深海星空',
    tag: '蔚蓝邃夜',
    desc: '沉静蓝灰多维渐变，营造科技严谨氛围',
    config: {
      presetId: 'ocean',
      gradientType: 'linear',
      colorStart: '#030712',
      colorMiddle: '#0b192c',
      colorEnd: '#075985',
      gradientAngle: 145,
      pattern: 'mesh',
      patternOpacity: 0.25,
      cardStyle: 'glass',
      transitionType: 'slide-x',
    }
  },
  {
    id: 'emerald',
    name: '翡翠沉香',
    tag: '质感暗绿',
    desc: '优雅深翠与黑灰交织，沉稳自然舒缓视觉',
    config: {
      presetId: 'emerald',
      gradientType: 'linear',
      colorStart: '#022c22',
      colorMiddle: '#0f172a',
      colorEnd: '#064e3b',
      gradientAngle: 120,
      pattern: 'dots',
      patternOpacity: 0.2,
      cardStyle: 'glass',
      transitionType: 'slide-y',
    }
  },
  {
    id: 'dot-matrix',
    name: '科技点阵',
    tag: '数字矩阵',
    desc: '精细微光点阵排布，呈现现代化科技质感',
    config: {
      presetId: 'dot-matrix',
      gradientType: 'linear',
      colorStart: '#090d16',
      colorMiddle: '#111827',
      colorEnd: '#030712',
      gradientAngle: 135,
      pattern: 'dots',
      patternOpacity: 0.4,
      cardStyle: 'glass',
      transitionType: 'zoom',
    }
  },
  {
    id: 'blueprint',
    name: '架构图纸',
    tag: '精细网格',
    desc: '高精度蓝图微光网格，适合技术汇报与设计展示',
    config: {
      presetId: 'blueprint',
      gradientType: 'linear',
      colorStart: '#030712',
      colorMiddle: '#0f172a',
      colorEnd: '#1e1b4b',
      gradientAngle: 135,
      pattern: 'grid',
      patternOpacity: 0.35,
      cardStyle: 'glass',
      transitionType: 'slide-x',
    }
  },
  {
    id: 'warm-sunset',
    name: '暖阳落日',
    tag: '温润霞光',
    desc: '琥珀赤褐与暗夜过渡，带给观众温馨沉浸感',
    config: {
      presetId: 'warm-sunset',
      gradientType: 'linear',
      colorStart: '#1c1917',
      colorMiddle: '#31121d',
      colorEnd: '#0c0a09',
      gradientAngle: 135,
      pattern: 'stripes',
      patternOpacity: 0.2,
      cardStyle: 'glass',
      transitionType: 'fade',
    }
  },
  {
    id: 'cosmic-mesh',
    name: '星云微光',
    tag: '多重弥散',
    desc: '柔和双色柔光晕染，打破单调呈现高级感',
    config: {
      presetId: 'cosmic-mesh',
      gradientType: 'radial',
      colorStart: '#111827',
      colorMiddle: '#312e81',
      colorEnd: '#030712',
      gradientAngle: 180,
      pattern: 'waves',
      patternOpacity: 0.25,
      cardStyle: 'glass',
      transitionType: 'flip',
    }
  },
  {
    id: 'pure-dark',
    name: '极致深黑',
    tag: '零干扰黑底',
    desc: '纯黑背景突出主体，最高对比度清晰视效',
    config: {
      presetId: 'pure-dark',
      gradientType: 'solid',
      colorStart: '#000000',
      colorMiddle: '#000000',
      colorEnd: '#000000',
      gradientAngle: 0,
      pattern: 'none',
      patternOpacity: 0,
      cardStyle: 'solid',
      transitionType: 'fade',
    }
  },
  {
    id: 'soft-paper',
    name: '雅致浅羊皮',
    tag: '明亮舒适',
    desc: '温润米白与暖浅灰渐变，高雅亮色放映氛围',
    config: {
      presetId: 'soft-paper',
      gradientType: 'linear',
      colorStart: '#fef3c7',
      colorMiddle: '#f3f4f6',
      colorEnd: '#e2e8f0',
      gradientAngle: 135,
      pattern: 'dots',
      patternOpacity: 0.15,
      cardStyle: 'solid',
      transitionType: 'slide-x',
    }
  }
];

// Helper to compute background style
export function getPresBgStyle(config: PresBgConfig): React.CSSProperties {
  if (config.presetId === 'theme') return { backgroundColor: 'var(--bg-secondary)' };
  if (config.gradientType === 'solid') {
    return { backgroundColor: config.colorStart };
  }
  
  if (config.gradientType === 'radial') {
    return {
      background: `radial-gradient(circle at 50% 30%, ${config.colorStart} 0%, ${config.colorMiddle || config.colorStart} 55%, ${config.colorEnd} 100%)`
    };
  }

  // linear
  const mid = config.colorMiddle ? `, ${config.colorMiddle} 50%` : '';
  return {
    background: `linear-gradient(${config.gradientAngle}deg, ${config.colorStart} 0%${mid}, ${config.colorEnd} 100%)`
  };
}

// Helper to render background pattern element
export function renderPresPatternOverlay(config: PresBgConfig) {
  if (config.pattern === 'none' || config.patternOpacity <= 0) return null;

  const opacity = config.patternOpacity;

  if (config.pattern === 'dots') {
    return (
      <div 
        className="absolute inset-0 pointer-events-none transition-opacity duration-300"
        style={{
          opacity,
          backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.4) 1.2px, transparent 1.2px)',
          backgroundSize: '24px 24px'
        }}
      />
    );
  }

  if (config.pattern === 'grid') {
    return (
      <div 
        className="absolute inset-0 pointer-events-none transition-opacity duration-300"
        style={{
          opacity,
          backgroundImage: 'linear-gradient(to right, rgba(255, 255, 255, 0.2) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.2) 1px, transparent 1px)',
          backgroundSize: '32px 32px'
        }}
      />
    );
  }

  if (config.pattern === 'stripes') {
    return (
      <div 
        className="absolute inset-0 pointer-events-none transition-opacity duration-300"
        style={{
          opacity,
          backgroundImage: 'repeating-linear-gradient(45deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.08) 12px, transparent 12px, transparent 24px)'
        }}
      />
    );
  }

  if (config.pattern === 'mesh') {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden transition-opacity duration-300" style={{ opacity }}>
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-indigo-500/30 blur-[100px]" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-blue-500/25 blur-[100px]" />
      </div>
    );
  }

  if (config.pattern === 'waves') {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden transition-opacity duration-300" style={{ opacity }}>
        <div className="absolute top-[10%] right-[10%] w-[60%] h-[60%] rounded-full bg-purple-600/20 blur-[120px]" />
        <div className="absolute bottom-[10%] left-[10%] w-[50%] h-[50%] rounded-full bg-rose-500/15 blur-[120px]" />
      </div>
    );
  }

  return null;
}

interface PresBgModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: PresBgConfig;
  onChange: (newConfig: PresBgConfig) => void;
  onReset: () => void;
}

export const PresBgModal: React.FC<PresBgModalProps> = ({
  isOpen,
  onClose,
  config,
  onChange,
  onReset,
}) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets');

  if (!isOpen) return null;

  const handleSelectPreset = (preset: PresetOption) => {
    onChange({ ...preset.config });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                <Palette size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>演示放映模式背景与纹理设置</span>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    Pro
                  </span>
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">选择预设高级暗调渐变、科技纹理或自主定制放映底色</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation Tabs & Live Mini Preview Banner */}
          <div className="p-6 border-b border-slate-800/80 bg-slate-950/40 flex flex-col gap-4 shrink-0">
            {/* Live Mini Preview */}
            <div className="relative w-full h-28 rounded-2xl overflow-hidden border border-slate-700/60 shadow-inner flex items-center justify-center transition-all duration-500"
                 style={getPresBgStyle(config)}>
              {renderPresPatternOverlay(config)}
              
              {/* Mini Slide Card Mockup */}
              <div className="z-10 w-64 h-20 bg-slate-900/90 border border-slate-700/80 rounded-xl p-3 shadow-2xl flex flex-col justify-center gap-1.5 backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <div className="h-2 w-20 bg-blue-400/80 rounded-full" />
                  <div className="h-1.5 w-6 bg-slate-600 rounded-full" />
                </div>
                <div className="h-1.5 w-40 bg-slate-400/60 rounded-full" />
                <div className="h-1.5 w-32 bg-slate-500/40 rounded-full" />
              </div>

              <div className="absolute bottom-2 right-3 z-10 px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-700 text-[10px] text-slate-300 font-mono flex items-center gap-1.5">
                <Eye size={12} className="text-blue-400" />
                <span>实时放映效果预览</span>
              </div>
            </div>

            {/* Tab Switches */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
                <button
                  onClick={() => setActiveTab('presets')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'presets' 
                      ? 'bg-blue-600 text-white shadow-md font-semibold' 
                      : 'text-[var(--text-secondary)] hover:text-slate-200'
                  }`}
                >
                  <Sparkles size={14} />
                  精选主题画廊 (Presets)
                </button>

                <button
                  onClick={() => setActiveTab('custom')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'custom' 
                      ? 'bg-blue-600 text-white shadow-md font-semibold' 
                      : 'text-[var(--text-secondary)] hover:text-slate-200'
                  }`}
                >
                  <Sliders size={14} />
                  极客自定义参数 (Custom)
                </button>
              </div>

              <button
                onClick={onReset}
                className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-amber-400 transition-colors px-3 py-1.5 rounded-xl hover:bg-slate-800/60 border border-transparent hover:border-slate-700 cursor-pointer"
                title="恢复默认 Slate 质感背景"
              >
                <RotateCcw size={13} />
                重置默认
              </button>
            </div>
          </div>

          {/* Tab Content Body */}
          <div className="p-6 overflow-y-auto flex-1 no-scrollbar space-y-6">
            {activeTab === 'presets' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                <button type="button" className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-4 text-left"
                  onClick={()=>onChange({...DEFAULT_PRES_BG_CONFIG, presetId:'theme', pattern:'none', transitionType:'fade'})}>跟随界面主题</button>
                {PRES_BG_PRESETS.filter(preset=>['pure-dark','soft-paper'].includes(preset.id)).map((preset) => {
                  const isSelected = config.presetId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => handleSelectPreset(preset)}
                      className={`group relative text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2.5 overflow-hidden ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/40 shadow-lg' 
                          : 'border-slate-800 hover:border-slate-700 bg-slate-950/50 hover:bg-slate-950'
                      }`}
                    >
                      {/* Mini Card Preview */}
                      <div 
                        className="h-20 w-full rounded-xl relative overflow-hidden border border-slate-700/50 flex items-center justify-center transition-transform group-hover:scale-[1.02]"
                        style={getPresBgStyle(preset.config)}
                      >
                        {renderPresPatternOverlay(preset.config)}
                        
                        <div className="w-24 h-12 rounded-md bg-slate-900/90 border border-slate-700/60 p-1.5 flex flex-col justify-center gap-1 backdrop-blur-xs">
                          <div className="h-1 w-10 bg-blue-400/80 rounded-full" />
                          <div className="h-1 w-16 bg-slate-500/50 rounded-full" />
                        </div>

                        {isSelected && (
                          <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-md">
                            <Check size={12} />
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-100 group-hover:text-blue-400 transition-colors">
                          {preset.name}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                          {preset.tag}
                        </span>
                      </div>

                      <p className="text-[11px] text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                        {preset.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-6">
                {/* Custom Gradient Options */}
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-4">
                  <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                    <Wand2 size={14} className="text-blue-400" />
                    <span>渐变色彩与类型控制</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1.5">渐变模式</label>
                      <select
                        value={config.gradientType}
                        onChange={(e) => onChange({ ...config, presetId: 'custom', gradientType: e.target.value as GradientType })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-blue-500"
                      >
                        <option value="linear">线性渐变 (Linear)</option>
                        <option value="radial">径向中心发散 (Radial)</option>
                        <option value="solid">纯色填充 (Solid Color)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1.5">起始颜色 (Start Color)</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={config.colorStart}
                          onChange={(e) => onChange({ ...config, presetId: 'custom', colorStart: e.target.value })}
                          className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                        />
                        <input
                          type="text"
                          value={config.colorStart}
                          onChange={(e) => onChange({ ...config, presetId: 'custom', colorStart: e.target.value })}
                          className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1.5">结束颜色 (End Color)</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={config.colorEnd}
                          onChange={(e) => onChange({ ...config, presetId: 'custom', colorEnd: e.target.value })}
                          className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                        />
                        <input
                          type="text"
                          value={config.colorEnd}
                          onChange={(e) => onChange({ ...config, presetId: 'custom', colorEnd: e.target.value })}
                          className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {config.gradientType === 'linear' && (
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-[var(--text-secondary)] mb-1">
                        <span>渐变角度 ({config.gradientAngle}°)</span>
                        <Compass size={13} className="text-blue-400" />
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="360"
                        value={config.gradientAngle}
                        onChange={(e) => onChange({ ...config, presetId: 'custom', gradientAngle: Number(e.target.value) })}
                        className="w-full accent-blue-500 cursor-pointer"
                      />
                    </div>
                  )}
                </div>

                {/* Pattern Overlay Options */}
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-4">
                  <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                    <Grid size={14} className="text-indigo-400" />
                    <span>叠加纹理与遮罩样式</span>
                  </h4>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { id: 'none', label: '无纹理 (None)' },
                      { id: 'dots', label: '科技点阵 (Dots)' },
                      { id: 'grid', label: '架构网格 (Grid)' },
                      { id: 'stripes', label: '立体斜纹 (Stripes)' },
                      { id: 'mesh', label: '深空极光光晕 (Mesh)' },
                      { id: 'waves', label: '柔光云雾 (Waves)' }
                    ].map((p) => (
                      <button
                        key={p.id}
                        onClick={() => onChange({ ...config, presetId: 'custom', pattern: p.id as PatternType })}
                        className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer flex items-center justify-between ${
                          config.pattern === p.id 
                            ? 'border-blue-500 bg-blue-500/20 text-white' 
                            : 'border-slate-800 bg-slate-900 text-[var(--text-secondary)] hover:text-slate-200'
                        }`}
                      >
                        <span>{p.label}</span>
                        {config.pattern === p.id && <Check size={14} className="text-blue-400" />}
                      </button>
                    ))}
                  </div>

                  {config.pattern !== 'none' && (
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-[var(--text-secondary)] mb-1">
                        <span>纹理透明度 ({Math.round(config.patternOpacity * 100)}%)</span>
                        <Layers size={13} className="text-indigo-400" />
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={config.patternOpacity}
                        onChange={(e) => onChange({ ...config, presetId: 'custom', patternOpacity: Number(e.target.value) })}
                        className="w-full accent-indigo-500 cursor-pointer"
                      />
                    </div>
                  )}
                </div>

                {/* Transition Animation Options */}
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-4">
                  <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                    <Zap size={14} className="text-amber-400" />
                    <span>幻灯片翻页过渡动画 (Slide Transition)</span>
                  </h4>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                    {[
                      { id: 'none', label: '无动画', desc: '立即切页', icon: <MoveRight size={14} /> },
                      { id: 'fade', label: '柔和淡入', desc: '经典渐隐渐现', icon: <Sparkles size={14} /> },
                      { id: 'slide-y', label: '纵向推移', desc: '上下无缝滑动', icon: <MoveVertical size={14} /> },
                      { id: 'zoom', label: '3D 缩放', desc: '立体层级展演', icon: <Maximize2 size={14} /> },
                      { id: 'flip', label: '视效翻转', desc: '空间维化切页', icon: <Repeat size={14} /> },
                    ].map((t) => (
                      <button
                        key={t.id}
                        onClick={() => onChange({ ...config, presetId: 'custom', transitionType: t.id as SlideTransitionType })}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col items-center gap-1.5 text-center ${
                          (config.transitionType || 'slide-x') === t.id 
                            ? 'border-amber-500/80 bg-amber-500/15 text-amber-200 shadow-md font-semibold' 
                            : 'border-slate-800 bg-slate-900 text-[var(--text-secondary)] hover:text-slate-200 hover:border-slate-700'
                        }`}
                      >
                        <div className="p-1.5 rounded-lg bg-slate-800/80 border border-slate-700">
                          {t.icon}
                        </div>
                        <span className="text-xs font-bold">{t.label}</span>
                        <span className="text-[10px] text-[var(--text-secondary)] scale-90">{t.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Action Bar */}
          <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between shrink-0">
            <span className="text-xs text-[var(--text-secondary)]">
              更改将实时同步并自动保存至本地放映设置
            </span>

            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all shadow-lg shadow-blue-600/20 cursor-pointer active:scale-95"
            >
              确定并保存
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
