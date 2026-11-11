import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, Volume2, VolumeX, RotateCcw, Plus, Trash2, 
  ZoomIn, ZoomOut, Maximize2, Shuffle, Settings, Play, 
  Check, UserMinus, Trophy, Sparkles, UserCheck
} from 'lucide-react';

interface StudentPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_STUDENTS = ['张伟', '李娜', '王强', '刘洋', '陈静', '赵磊', '孙敏', '周杰', '吴超', '郭婷'];

const SLICE_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', 
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
  '#14b8a6', '#d946ef', '#0284c7', '#22c55e', '#eab308'
];

export const StudentPickerModal: React.FC<StudentPickerModalProps> = ({ isOpen, onClose }) => {
  // --- States ---
  const [students, setStudents] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('fluxmark_students');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_STUDENTS;
  });

  const [excludedStudents, setExcludedStudents] = useState<string[]>([]);
  const [autoExclude, setAutoExclude] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [modalScale, setModalScale] = useState(1.0);
  const [activeTab, setActiveTab] = useState<'wheel' | 'manage'>('wheel');

  // Input states for managing student list
  const [rawInput, setRawInput] = useState('');
  const [newStudentName, setNewStudentName] = useState('');

  // Wheel animation states
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [selectedWinner, setSelectedWinner] = useState<string | null>(null);
  const [showWinnerCard, setShowWinnerCard] = useState(false);

  // Audio Context Ref
  const audioCtxRef = useRef<AudioContext | null>(null);
  const lastSliceIdxRef = useRef<number>(-1);

  // Filter available students
  const availableStudents = students.filter(s => !excludedStudents.includes(s));

  // Sync students to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('fluxmark_students', JSON.stringify(students));
    } catch (e) {
      console.error(e);
    }
  }, [students]);

  // Audio helper methods
  const getAudioContext = () => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  const playTickSound = () => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch (e) {
      // ignore audio errors
    }
  };

  const playWinSound = () => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);

        gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.1);
        gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + idx * 0.1 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.1 + 0.6);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + idx * 0.1);
        osc.stop(ctx.currentTime + idx * 0.1 + 0.6);
      });
    } catch (e) {
      // ignore audio errors
    }
  };

  // Start Spin Handler
  const startSpin = () => {
    if (isSpinning || availableStudents.length === 0) return;

    setShowWinnerCard(false);
    setSelectedWinner(null);
    setIsSpinning(true);

    const pool = availableStudents;
    const numSlices = pool.length;
    const sliceAngle = 360 / numSlices;

    // Select a random winner index
    const winnerIdx = Math.floor(Math.random() * numSlices);
    const winnerName = pool[winnerIdx];

    // Compute target angle
    // Note: Needle is at top (270 degrees or 0 degrees in SVG reference).
    // Let's place top needle at 0° (top). Each slice starts at sliceAngle * i.
    // Center of slice i is sliceAngle * i + sliceAngle / 2.
    // To land slice i under top pointer (0 deg), total wheel rotation must align slice center with pointer.
    const sliceCenterAngle = winnerIdx * sliceAngle + sliceAngle / 2;
    // Top is 270 deg (or 0 deg if 12 o'clock). SVG rotation revolves clockwise.
    // Pointer is at top (12 o'clock, -90° / 270°).
    // Target stop angle = 360 * 5 rounds + (360 - sliceCenterAngle)
    const extraRounds = 360 * (5 + Math.floor(Math.random() * 3));
    const targetAngle = rotationAngle + extraRounds + (360 - (rotationAngle % 360)) + (360 - sliceCenterAngle);

    const startTime = performance.now();
    const duration = 4000; // 4 seconds duration
    const startAngle = rotationAngle;

    // Cubic ease-out function
    const easeOutCubic = (t: number): number => {
      return 1 - Math.pow(1 - t, 3);
    };

    const animateWheel = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const easedProgress = easeOutCubic(progress);

      const currentAngle = startAngle + (targetAngle - startAngle) * easedProgress;
      setRotationAngle(currentAngle);

      // Check slice tick sound
      const normalizedAngle = (currentAngle % 360 + 360) % 360;
      // Current slice under pointer at top
      const currentPointerAngle = (360 - normalizedAngle) % 360;
      const currentSliceIdx = Math.floor(currentPointerAngle / sliceAngle) % numSlices;

      if (currentSliceIdx !== lastSliceIdxRef.current) {
        lastSliceIdxRef.current = currentSliceIdx;
        playTickSound();
      }

      if (progress < 1) {
        requestAnimationFrame(animateWheel);
      } else {
        setIsSpinning(false);
        setSelectedWinner(winnerName);
        setShowWinnerCard(true);
        playWinSound();

        if (autoExclude) {
          setExcludedStudents(prev => [...prev, winnerName]);
        }
      }
    };

    requestAnimationFrame(animateWheel);
  };

  // Add single student
  const handleAddStudent = () => {
    const trimmed = newStudentName.trim();
    if (trimmed && !students.includes(trimmed)) {
      setStudents(prev => [...prev, trimmed]);
      setNewStudentName('');
    }
  };

  // Bulk save
  const handleBatchSave = () => {
    const list = rawInput
      .split(/[\n,，\s]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    if (list.length > 0) {
      // Remove duplicates
      const unique = Array.from(new Set(list));
      setStudents(unique);
      setExcludedStudents([]);
      setActiveTab('wheel');
    }
  };

  // Reset to default list
  const handleResetDefault = () => {
    setStudents(DEFAULT_STUDENTS);
    setExcludedStudents([]);
  };

  // Reset excluded students pool
  const handleResetExclusions = () => {
    setExcludedStudents([]);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 z-[2000] flex items-center justify-center p-4 backdrop-blur-md select-none overflow-y-auto"
        onClick={onClose}
      >
        <motion.div 
          initial={{ scale: 0.85, y: 20 }} 
          animate={{ scale: 1, y: 0 }} 
          exit={{ scale: 0.85, y: 20 }}
          style={{ transform: `scale(${modalScale})` }}
          onClick={(e) => e.stopPropagation()}
          className="bg-[var(--bg-primary)] rounded-3xl w-full max-w-lg p-6 shadow-2xl flex flex-col gap-5 border border-[var(--border)] transition-transform relative my-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center">
                <Trophy size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                  课堂随机点名抽奖转盘
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-mono font-bold">
                    {availableStudents.length} 人在池中
                  </span>
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">公平高效，增添课堂交互趣味</p>
              </div>
            </div>

            {/* Header Toolbar (Audio, Scale & Close) */}
            <div className="flex items-center gap-1.5 bg-[var(--bg-secondary)] rounded-xl p-1 border border-[var(--border)]">
              {/* Audio Sound Toggle */}
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  soundEnabled 
                    ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40' 
                    : 'text-[var(--text-secondary)] hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
                title={soundEnabled ? '音效已开启' : '音效已静音'}
              >
                {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>

              <div className="w-px h-4 bg-[var(--border)]" />

              {/* Zoom Out */}
              <button
                onClick={() => setModalScale(s => Math.max(0.6, Number((s - 0.1).toFixed(1))))}
                title="缩小弹窗"
                className="p-1.5 hover:bg-[var(--bg-primary)] rounded-lg text-[var(--text-secondary)] transition-colors cursor-pointer"
              >
                <ZoomOut size={15} />
              </button>
              <span className="text-[10px] font-mono font-bold text-[var(--text-secondary)] px-1">
                {Math.round(modalScale * 100)}%
              </span>
              {/* Zoom In */}
              <button
                onClick={() => setModalScale(s => Math.min(1.8, Number((s + 0.1).toFixed(1))))}
                title="放大弹窗"
                className="p-1.5 hover:bg-[var(--bg-primary)] rounded-lg text-[var(--text-secondary)] transition-colors cursor-pointer"
              >
                <ZoomIn size={15} />
              </button>

              <div className="w-px h-4 bg-[var(--border)]" />

              {/* Close button */}
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-red-50 text-[var(--text-secondary)] hover:text-red-500 rounded-lg transition-colors cursor-pointer"
              >
                <Maximize2 size={15} className="rotate-45" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center justify-between gap-2 bg-[var(--bg-secondary)] p-1 rounded-2xl border border-[var(--border)]">
            <button
              onClick={() => setActiveTab('wheel')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'wheel'
                  ? 'bg-[var(--bg-primary)] text-[var(--accent)] shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Shuffle size={14} />
              抽奖转盘
            </button>
            <button
              onClick={() => {
                setActiveTab('manage');
                setRawInput(students.join('\n'));
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'manage'
                  ? 'bg-[var(--bg-primary)] text-[var(--accent)] shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Settings size={14} />
              学生名单设置 ({students.length})
            </button>
          </div>

          {/* TAB 1: WHEEL TURNTABLE VIEW */}
          {activeTab === 'wheel' && (
            <div className="flex flex-col items-center gap-6 py-2">
              {availableStudents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
                  <div className="p-4 bg-amber-50 rounded-full text-amber-500">
                    <Users size={32} />
                  </div>
                  <p className="text-sm font-bold text-[var(--text-primary)]">当前没有可调用的学生名单</p>
                  <p className="text-xs text-[var(--text-secondary)] max-w-xs">
                    可能所有学生都已被排除，或者学生名单为空。
                  </p>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={handleResetExclusions}
                      className="px-4 py-2 bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300 rounded-xl text-xs font-bold hover:bg-blue-100 transition-all cursor-pointer"
                    >
                      重置排他池 ({excludedStudents.length}人已排)
                    </button>
                    <button
                      onClick={() => setActiveTab('manage')}
                      className="px-4 py-2 bg-[var(--accent)] text-white rounded-xl text-xs font-bold hover:opacity-90 transition-all cursor-pointer"
                    >
                      录入新名单
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Wheel Container */}
                  <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center my-2">
                    {/* Outer Glowing Ring */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-400 via-pink-500 to-blue-500 opacity-30 blur-md animate-pulse pointer-events-none" />

                    {/* Top Pointer Needle */}
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center filter drop-shadow-md pointer-events-none">
                      <div className="w-5 h-6 bg-red-600 clip-triangle" style={{ clipPath: 'polygon(50% 100%, 0 0, 100% 0)' }} />
                      <div className="w-3 h-3 bg-amber-400 rounded-full -mt-2 border-2 border-white" />
                    </div>

                    {/* SVG Wheel */}
                    <div 
                      className="w-full h-full rounded-full shadow-2xl border-4 border-white dark:border-slate-800 overflow-hidden relative"
                      style={{
                        transform: `rotate(${rotationAngle}deg)`,
                        transition: isSpinning ? 'none' : 'transform 0.2s ease-out'
                      }}
                    >
                      <svg viewBox="0 0 100 100" className="w-full h-full">
                        {availableStudents.map((name, i) => {
                          const total = availableStudents.length;
                          const sliceAngle = 360 / total;
                          const startAngle = i * sliceAngle;
                          const endAngle = (i + 1) * sliceAngle;

                          // SVG Arc calculations
                          const x1 = 50 + 50 * Math.cos((Math.PI * startAngle) / 180);
                          const y1 = 50 + 50 * Math.sin((Math.PI * startAngle) / 180);
                          const x2 = 50 + 50 * Math.cos((Math.PI * endAngle) / 180);
                          const y2 = 50 + 50 * Math.sin((Math.PI * endAngle) / 180);

                          const largeArcFlag = sliceAngle > 180 ? 1 : 0;
                          const pathData = `M 50 50 L ${x1} ${y1} A 50 50 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

                          // Color
                          const color = SLICE_COLORS[i % SLICE_COLORS.length];

                          // Text angle
                          const midAngle = startAngle + sliceAngle / 2;
                          const textRadius = 32; // Distance from center
                          const tx = 50 + textRadius * Math.cos((Math.PI * midAngle) / 180);
                          const ty = 50 + textRadius * Math.sin((Math.PI * midAngle) / 180);

                          return (
                            <g key={i}>
                              <path d={pathData} fill={color} stroke="#ffffff" strokeWidth="0.8" />
                              <text
                                x={tx}
                                y={ty}
                                fill="#ffffff"
                                fontSize={total > 12 ? "3.2" : total > 8 ? "4" : "4.8"}
                                fontWeight="bold"
                                textAnchor="middle"
                                dominantBaseline="central"
                                transform={`rotate(${midAngle + 90}, ${tx}, ${ty})`}
                                style={{ textShadow: '0px 1px 2px rgba(0,0,0,0.5)' }}
                              >
                                {name.length > 4 ? name.substring(0, 3) + '..' : name}
                              </text>
                            </g>
                          );
                        })}
                      </svg>
                    </div>

                    {/* Center Button / Hub */}
                    <button
                      onClick={startSpin}
                      disabled={isSpinning}
                      className={`absolute z-20 w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-white dark:border-slate-800 shadow-2xl flex flex-col items-center justify-center transition-all cursor-pointer select-none active:scale-90 ${
                        isSpinning 
                          ? 'bg-slate-400 text-white cursor-not-allowed' 
                          : 'bg-gradient-to-tr from-amber-500 to-red-500 hover:from-amber-600 hover:to-red-600 text-white hover:scale-105 shadow-amber-500/50'
                      }`}
                    >
                      <Play size={20} className={isSpinning ? 'animate-spin' : 'ml-0.5'} />
                      <span className="text-[11px] font-black tracking-widest mt-0.5">
                        {isSpinning ? '抽取中' : '开始点名'}
                      </span>
                    </button>
                  </div>

                  {/* Winner Result Overlay Modal/Banner */}
                  <AnimatePresence>
                    {showWinnerCard && selectedWinner && (
                      <motion.div
                        initial={{ scale: 0.5, opacity: 0, y: 10 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.5, opacity: 0 }}
                        className="w-full bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 p-0.5 rounded-3xl shadow-xl"
                      >
                        <div className="bg-[var(--bg-primary)] p-5 rounded-[22px] flex flex-col items-center gap-3 text-center">
                          <div className="flex items-center gap-2 text-amber-500">
                            <Sparkles size={20} className="animate-bounce" />
                            <span className="text-xs font-extrabold uppercase tracking-widest">恭喜中选</span>
                            <Sparkles size={20} className="animate-bounce" />
                          </div>

                          <div className="text-3xl sm:text-4xl font-extrabold text-[var(--text-primary)] tracking-wide font-sans py-1">
                            🎉 {selectedWinner} 先生/女士
                          </div>

                          <div className="flex items-center justify-center gap-2 w-full pt-1">
                            <button
                              onClick={startSpin}
                              className="px-4 py-2 bg-[var(--bg-secondary)] hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[var(--text-primary)] rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                              <RotateCcw size={14} />
                              再抽一次
                            </button>

                            <button
                              onClick={() => {
                                setExcludedStudents(prev => [...prev, selectedWinner]);
                                setShowWinnerCard(false);
                              }}
                              className="px-4 py-2 bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-300 hover:bg-red-100 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                              <UserMinus size={14} />
                              本轮排除该学生
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Settings & Exclusion Bar */}
                  <div className="flex items-center justify-between w-full pt-2 border-t border-[var(--border)] text-xs text-[var(--text-secondary)]">
                    <label className="flex items-center gap-2 cursor-pointer select-none hover:text-[var(--text-primary)]">
                      <input
                        type="checkbox"
                        checked={autoExclude}
                        onChange={(e) => setAutoExclude(e.target.checked)}
                        className="rounded text-amber-500 focus:ring-amber-400 w-4 h-4 cursor-pointer"
                      />
                      <span>抽中后自动排除该学生 (不重复点名)</span>
                    </label>

                    {excludedStudents.length > 0 && (
                      <button
                        onClick={handleResetExclusions}
                        className="text-amber-600 dark:text-amber-400 hover:underline text-xs font-medium cursor-pointer"
                      >
                        恢复全部 ({excludedStudents.length}人已排除)
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 2: MANAGE STUDENT LIST VIEW */}
          {activeTab === 'manage' && (
            <div className="flex flex-col gap-4 py-1">
              {/* Add single student input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddStudent();
                    }
                  }}
                  placeholder="输入学生姓名后按回车添加..."
                  className="flex-1 px-3.5 py-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-amber-500"
                />
                <button
                  onClick={handleAddStudent}
                  className="px-4 py-2 bg-[var(--accent)] text-white rounded-xl text-xs font-bold hover:opacity-90 transition-all flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Plus size={14} />
                  添加
                </button>
              </div>

              {/* Current Student Chips */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] font-medium">
                  <span>已录入学生列表 ({students.length}人):</span>
                  <button
                    onClick={handleResetDefault}
                    className="text-blue-500 hover:underline text-[11px] cursor-pointer"
                  >
                    恢复示例演示名单
                  </button>
                </div>

                <div className="p-3 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl max-h-36 overflow-y-auto flex flex-wrap gap-1.5">
                  {students.map((st, idx) => (
                    <span 
                      key={idx}
                      className="px-2.5 py-1 bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-primary)] flex items-center gap-1.5 shadow-2xs group"
                    >
                      <span>{st}</span>
                      <button
                        onClick={() => setStudents(students.filter((_, i) => i !== idx))}
                        className="text-[var(--text-secondary)] hover:text-red-500 rounded-full p-0.5 transition-colors cursor-pointer"
                        title="删除该学生"
                      >
                        <Trash2 size={12} />
                      </button>
                    </span>
                  ))}
                  {students.length === 0 && (
                    <span className="text-xs text-[var(--text-secondary)] italic py-2">暂无学生，请在下方批量粘贴或上方输入添加。</span>
                  )}
                </div>
              </div>

              {/* Bulk paste / edit textarea */}
              <div className="space-y-1.5 pt-2 border-t border-[var(--border)]">
                <label className="text-xs text-[var(--text-secondary)] font-medium block">
                  批量粘贴/修改全班名单 (支持按换行、空格或逗号分隔):
                </label>
                <textarea
                  rows={4}
                  value={rawInput}
                  onChange={(e) => setRawInput(e.target.value)}
                  placeholder="示例：&#10;张伟&#10;李娜&#10;王强, 刘洋, 陈静"
                  className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl text-xs font-mono text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                />
              </div>

              {/* Save & Reset controls */}
              <div className="flex justify-between items-center pt-2">
                <button
                  onClick={() => {
                    setStudents([]);
                    setRawInput('');
                  }}
                  className="px-3 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  清空全部名单
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveTab('wheel')}
                    className="px-4 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-xl text-xs font-medium cursor-pointer"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleBatchSave}
                    className="px-5 py-2 bg-[var(--accent)] text-white rounded-xl text-xs font-bold hover:opacity-90 transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                  >
                    <Check size={14} />
                    确认并使用此名单
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
