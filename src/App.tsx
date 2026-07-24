import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  FileText, Save, Download, Image as ImageIcon, 
  Monitor, Layout, Sun, Moon, Droplets, 
  ChevronLeft, ChevronRight, Maximize2, ZoomIn, ZoomOut, PanelLeftClose, PanelLeft,
  Folder, FilePlus, ChevronDown, Superscript as SuperscriptIcon, Subscript as SubscriptIcon,
  Type, Palette, AlignCenter, AlignLeft, Trash2, Printer, MousePointer2, Pencil, Eraser, Timer, RefreshCcw, Target,
  FileCode, Share2, HelpCircle, FileDown, Upload, Bold, Italic, List, ListTodo, Heading1, Heading2, Quote, Highlighter, Video as VideoIcon,
  Undo, Redo, Wand2,
  AlertCircle, Check, Plus, BookOpen, Keyboard, UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toCanvas } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { saveAs } from 'file-saver';
import * as docx from 'docx';
import Cropper from 'cropperjs';
import 'cropperjs/dist/cropper.css';
import katex from 'katex';
import 'katex/dist/katex.min.css';

// Tiptap Imports
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from 'tiptap-markdown';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import Image from 'tiptap-extension-resize-image';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Superscript from '@tiptap/extension-superscript';
import Subscript from '@tiptap/extension-subscript';
import TextAlign from '@tiptap/extension-text-align';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { common, createLowlight } from 'lowlight';

import { CustomCodeBlock } from './extensions/CustomCodeBlock';
import { CustomBlockquote } from './extensions/CustomBlockquote';
import { InlineMath } from './extensions/InlineMath';
import { BlockMath } from './extensions/BlockMath';
import { Video } from './extensions/Video';
import { HeadingSuggestion } from './extensions/HeadingSuggestion';
import { EmojiSuggestion } from './extensions/EmojiSuggestion';
import { AIChat } from './components/AIChat';
import { DocumentOutlineStats } from './components/DocumentOutlineStats';
import { HighlightPopover } from './components/HighlightPopover';
import { StudentPickerModal } from './components/StudentPickerModal';
import { ImageCropperModal } from './components/ImageCropperModal';
import { Sparkles as SparklesIcon } from 'lucide-react';

const lowlight = createLowlight(common);

// --- Types ---
type Theme = 'light' | 'dark' | 'ocean' | 'warm' | 'mint';
type SidebarTab = 'outline' | 'resources';

interface ThemeOption {
  id: Theme;
  name: string;
  desc: string;
  icon: React.ReactNode;
  bgHex: string;
  accentHex: string;
}

const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'light',
    name: '默认简约',
    desc: '经典亮白优雅布局，高对比度清爽界面',
    icon: <Sun size={16} />,
    bgHex: '#ffffff',
    accentHex: '#1161f3',
  },
  {
    id: 'dark',
    name: '暗夜极客',
    desc: '深色极客黑灰调，夜间灵感专注创作',
    icon: <Moon size={16} />,
    bgHex: '#0f172a',
    accentHex: '#38bdf8',
  },
  {
    id: 'ocean',
    name: '深海幽蓝',
    desc: '深邃沉静海洋蓝，平和高效编写体验',
    icon: <Droplets size={16} />,
    bgHex: '#0b192c',
    accentHex: '#008dda',
  },
  {
    id: 'warm',
    name: '暖阳复古',
    desc: '温润羊皮纸米黄，长时间阅读舒适护眼',
    icon: <BookOpen size={16} />,
    bgHex: '#fdfbf7',
    accentHex: '#d97706',
  },
  {
    id: 'mint',
    name: '薄荷清新',
    desc: '自然舒缓翡翠绿，缓解视疲劳清爽宜人',
    icon: <SparklesIcon size={16} />,
    bgHex: '#f2fbf7',
    accentHex: '#059669',
  },
];

export interface FontOption {
  id: string;
  name: string;
  category: 'sans' | 'serif' | 'mono';
  categoryLabel: string;
  value: string;
  sample: string;
}

export const FONT_OPTIONS: FontOption[] = [
  {
    id: 'default',
    name: '系统默认 (Sans)',
    category: 'sans',
    categoryLabel: '无衬线',
    value: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    sample: 'Aa 简约现代'
  },
  {
    id: 'inter',
    name: 'Inter (Modern Sans)',
    category: 'sans',
    categoryLabel: '无衬线',
    value: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    sample: 'Aa Modern Sans'
  },
  {
    id: 'times',
    name: 'Times New Roman (Serif)',
    category: 'serif',
    categoryLabel: '衬线体',
    value: '"Times New Roman", Times, "Songti SC", SimSun, serif',
    sample: 'Aa Classic Serif'
  },
  {
    id: 'georgia',
    name: 'Georgia (Warm Serif)',
    category: 'serif',
    categoryLabel: '衬线体',
    value: 'Georgia, "Times New Roman", "Songti SC", serif',
    sample: 'Aa Elegant Serif'
  },
  {
    id: 'jetbrains',
    name: 'JetBrains Mono (Mono)',
    category: 'mono',
    categoryLabel: '等宽体',
    value: '"JetBrains Mono", Consolas, Monaco, "Courier New", monospace',
    sample: 'Aa Code Mono'
  },
  {
    id: 'fira',
    name: 'Fira Code (Code Mono)',
    category: 'mono',
    categoryLabel: '等宽体',
    value: '"Fira Code", Consolas, Monaco, "Courier New", monospace',
    sample: 'Aa Dev Monospace'
  },
  {
    id: 'songti',
    name: '经典宋体 (Songti)',
    category: 'serif',
    categoryLabel: '衬线体',
    value: '"Songti SC", "STSong", "SimSun", serif',
    sample: '字 典雅宋体'
  },
  {
    id: 'kaiti',
    name: '书香楷体 (Kaiti)',
    category: 'serif',
    categoryLabel: '衬线体',
    value: '"Kaiti SC", "STKaiti", "KaiTi", serif',
    sample: '字 润雅楷书'
  },
];

interface SelectionState {
  top: number;
  left: number;
  visible: boolean;
  text: string;
  range: Range | null;
}

const FluxLogo = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 100 100" 
    fill="currentColor" 
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Top Bar */}
    <rect x="10" y="10" width="80" height="32" rx="2" />
    {/* Bottom Left Stem */}
    <rect x="10" y="48" width="28" height="42" rx="2" />
    {/* Bottom Right Block */}
    <rect x="44" y="48" width="46" height="42" rx="2" />
  </svg>
);

const PRESET_COLORS = [
  { name: '红', value: '#ef4444' },
  { name: '绿', value: '#10b981' },
  { name: '蓝', value: '#3b82f6' },
  { name: '紫', value: '#8b5cf6' },
  { name: '黑', value: '#1e293b' },
  { name: '白', value: '#ffffff' },
  { name: '黄', value: '#f59e0b' },
  { name: '橙', value: '#f97316' },
  { name: '青', value: '#06b6d4' },
  { name: '青绿', value: '#14b8a6' },
];

// --- Utils ---
const transformMarkdownToMathHTML = (markdown: string) => {
  // Store code blocks to avoid replacing content inside them
  const codes: string[] = [];
  let temp = markdown.replace(/```[\s\S]*?```/g, (match) => {
    codes.push(match);
    return `__CODE_BLOCK_${codes.length - 1}__`;
  });
  temp = temp.replace(/`[^`]+`/g, (match) => {
    codes.push(match);
    return `__CODE_INLINE_${codes.length - 1}__`;
  });

  // Now replace math delimiters with our recognized data-type tags
  temp = temp
    .replace(/\$\$([\s\S]+?)\$\$/g, (match, latex) => {
      // Basic escaping check for HTML
      const escapedLatex = latex.replace(/"/g, '&quot;');
      return `<div data-type="block-math" data-latex="${escapedLatex}"></div>`;
    })
    .replace(/(?<!\$)\$([^\$]+?)\$(?!\$)/g, (match, latex) => {
      // Avoid matching price tags like $100 or standalone $
      if (/^\s|\s$/.test(latex) || latex.length > 200) return match;
      const escapedLatex = latex.replace(/"/g, '&quot;');
      return `<span data-type="inline-math" data-latex="${escapedLatex}"></span>`;
    });

  // Restore codes
  temp = temp.replace(/__CODE_BLOCK_(\d+)__/g, (_, i) => codes[Number(i)]);
  temp = temp.replace(/__CODE_INLINE_(\d+)__/g, (_, i) => codes[Number(i)]);

  // Inject lazy loading & async decoding into raw HTML img tags
  temp = temp.replace(/<img\s+(?![^>]*\bloading=)([^>]+)>/gi, '<img loading="lazy" decoding="async" $1>');
  
  return temp;
};

// --- App Component ---
export default function App() {
  const [theme, setTheme] = useState<Theme>('light');
  const [fontFamily, setFontFamily] = useState<string>('default');
  const [zoom, setZoom] = useState<number>(1);
  const [isPresentation, setIsPresentation] = useState<boolean>(false);
  const [showSidebar, setShowSidebar] = useState<boolean>(true);
  const [activeSidebarTab, setActiveSidebarTab] = useState<SidebarTab>('outline');
  const [resources, setResources] = useState<{ name: string, type: 'file' | 'folder', handle?: any }[]>([]);
  const [outline, setOutline] = useState<{ id: string, text: string, level: number, pos?: number }[]>([]);
  const [activeHeadingId, setActiveHeadingId] = useState<string | null>(null);
  const [collapsedHeadings, setCollapsedHeadings] = useState<Record<string, boolean>>({});
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<number | null>(null);
  const [selection, setSelection] = useState<SelectionState>({ top: 0, left: 0, visible: false, text: '', range: null });
  const [showAIChat, setShowAIChat] = useState<boolean>(false);
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);
  const [helpTab, setHelpTab] = useState<'tutorial' | 'shortcuts'>('tutorial');
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [showHighlightPopover, setShowHighlightPopover] = useState<boolean>(false);
  const [showSelectionHighlightPopover, setShowSelectionHighlightPopover] = useState<boolean>(false);
  const [lastHighlightColor, setLastHighlightColor] = useState<string>('#fef08a');
  
  // Presentation Annotation & Slide State
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [presentTool, setPresentTool] = useState<'select' | 'pen' | 'eraser' | 'laser'>('select');
  const [laserPos, setLaserPos] = useState<{ x: number; y: number; visible: boolean }>({ x: 0, y: 0, visible: false });
  const [presentColor, setPresentColor] = useState<string>('#3b82f6');
  const [presentSize, setPresentSize] = useState<number>(3);
  const [showTimer, setShowTimer] = useState<boolean>(false);
  const [timerTime, setTimerTime] = useState<number>(0);
  const [isTimerActive, setIsTimerActive] = useState<boolean>(false);
  const [countdownValue, setCountdownValue] = useState<number>(0);
  const [isCountdownMode, setIsCountdownMode] = useState<boolean>(false);
  const [showCountdownModal, setShowCountdownModal] = useState<boolean>(false);
  const [showStudentPickerModal, setShowStudentPickerModal] = useState<boolean>(false);
  const [timerScale, setTimerScale] = useState<number>(1);
  const [countdownModalScale, setCountdownModalScale] = useState<number>(1);

  // Custom UI notification and dialog states
  const [docName, setDocName] = useState<string>('当前文档.md');
  const [currentFileHandle, setCurrentFileHandle] = useState<any | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    onConfirm: () => void;
  } | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((prev) => (prev === msg ? null : prev));
    }, 2500);
  };

  // Audio Context for Alarm
  const playAlarmSound = useCallback((frequency = 440, duration = 0.15) => {
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return;
      const audioCtx = new AudioCtxClass();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + duration);
      
      // Close context after play to save resources
      setTimeout(() => audioCtx.close(), duration * 1000 + 100);
    } catch (e) {
      console.warn('Audio play failed', e);
    }
  }, []);
  
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const directoryInputRef = useRef<HTMLInputElement>(null);
  const cropperRef = useRef<Cropper | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  // Tiptap Editor Initialization
  const FLUXMARK_STORAGE_KEY = 'fluxmark_saved_doc_v1';

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        blockquote: false,
      }),
      Markdown.configure({
        linkify: true,
        breaks: true,
      }),
      Placeholder.configure({
        placeholder: '在此输入您的内容，FluxMark 支持即时 Markdown 渲染...',
      }),
      CharacterCount,
      Image.configure({
        allowBase64: true,
        HTMLAttributes: {
          class: 'resizable-image',
          loading: 'lazy',
          decoding: 'async',
        },
      }),
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      Superscript,
      Subscript,
      TextAlign.configure({
        types: ['heading', 'paragraph', 'image'],
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      CustomCodeBlock.configure({
        lowlight,
      }),
      CustomBlockquote,
      BlockMath,
      InlineMath,
      Video,
      HeadingSuggestion,
      EmojiSuggestion,
    ],
    content: (() => {
      const saved = localStorage.getItem(FLUXMARK_STORAGE_KEY);
      if (saved !== null) {
        return saved;
      }
      return transformMarkdownToMathHTML(initialMarkdown);
    })(),
    editorProps: {
      attributes: {
        class: 'prose-custom w-full outline-none min-h-[600px] border-none focus:ring-0',
      },
    },
    onUpdate: ({ editor }) => {
      // Auto-save content to localStorage
      const html = editor.getHTML();
      localStorage.setItem(FLUXMARK_STORAGE_KEY, html);

      // Update outline in microtask to avoid flushSync during render/lifecycle
      queueMicrotask(() => {
        const headings: { id: string, text: string, level: number, pos: number }[] = [];
        editor.state.doc.descendants((node, pos) => {
          if (node.type.name === 'heading') {
            headings.push({
              id: `heading-${pos}`,
              text: node.textContent,
              level: node.attrs.level,
              pos: pos
            });
          }
        });
        setOutline(headings);
      });
    }
  });

  const isUpdatingFromSlideRef = useRef(false);

  // Tiptap Slide Editor for Full-Screen Presentation Mode Editing
  const slideEditor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        blockquote: false,
      }),
      Markdown.configure({
        linkify: true,
        breaks: true,
      }),
      Placeholder.configure({
        placeholder: '在此编辑本页幻灯片内容...',
      }),
      CharacterCount,
      Image.configure({
        allowBase64: true,
        HTMLAttributes: {
          class: 'resizable-image',
          loading: 'lazy',
          decoding: 'async',
        },
      }),
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      Superscript,
      Subscript,
      TextAlign.configure({
        types: ['heading', 'paragraph', 'image'],
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      CustomCodeBlock.configure({
        lowlight,
      }),
      CustomBlockquote,
      BlockMath,
      InlineMath,
      Video,
      HeadingSuggestion,
      EmojiSuggestion,
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose-custom w-full outline-none min-h-[360px] border-none focus:ring-0 text-[var(--text-primary)]',
      },
    },
    onUpdate: ({ editor: currentSlideEd }) => {
      if (isUpdatingFromSlideRef.current || !editor) return;
      const currentSlideHtml = currentSlideEd.getHTML();

      const subSlides = currentSlideHtml.split(/<hr\b[^>]*\/?>/i);
      const fullHtml = editor.getHTML();
      const rawSlides = fullHtml.split(/<hr\b[^>]*\/?>/i);

      const targetIdx = Math.min(Math.max(0, currentSlideIndex), rawSlides.length - 1);

      queueMicrotask(() => {
        if (subSlides.length > 1) {
          rawSlides.splice(targetIdx, 1, ...subSlides);
          const newFullContent = rawSlides.join('<hr>');
          //@ts-ignore
          editor.commands.setContent(newFullContent, false);
          setCurrentSlideIndex(targetIdx + 1);
        } else {
          rawSlides[targetIdx] = currentSlideHtml;
          const newFullContent = rawSlides.join('<hr>');
          //@ts-ignore
          editor.commands.setContent(newFullContent, false);
        }
      });
    },
  });

  // Sync active slide content into slideEditor whenever slide changes or presentation toggles
  useEffect(() => {
    if (isPresentation && slideEditor && editor) {
      const fullHtml = editor.getHTML();
      const rawSlides = fullHtml.split(/<hr\b[^>]*\/?>/i);
      const targetIdx = Math.min(Math.max(0, currentSlideIndex), rawSlides.length - 1);
      const targetContent = rawSlides[targetIdx] || '<p></p>';

      if (slideEditor.getHTML() !== targetContent) {
        isUpdatingFromSlideRef.current = true;
        queueMicrotask(() => {
          //@ts-ignore
          slideEditor.commands.setContent(targetContent, false);
          isUpdatingFromSlideRef.current = false;
        });
      }
    }
  }, [isPresentation, currentSlideIndex, editor, slideEditor]);

  // Slide management handlers in presentation mode
  const handleAddSlideInPresentation = () => {
    if (!editor) return;
    const fullHtml = editor.getHTML();
    const rawSlides = fullHtml.split(/<hr\b[^>]*\/?>/i);
    const targetIdx = Math.min(Math.max(0, currentSlideIndex), rawSlides.length - 1);
    const insertIdx = targetIdx + 1;
    rawSlides.splice(insertIdx, 0, '<h2>新幻灯片</h2><p>点击在此处输入内容...</p>');
    const newFull = rawSlides.join('<hr>');
    editor.commands.setContent(newFull);
    setCurrentSlideIndex(insertIdx);
  };

  const handleDeleteSlideInPresentation = () => {
    if (!editor) return;
    const fullHtml = editor.getHTML();
    const rawSlides = fullHtml.split(/<hr\b[^>]*\/?>/i);
    const targetIdx = Math.min(Math.max(0, currentSlideIndex), rawSlides.length - 1);

    if (rawSlides.length <= 1) {
      editor.commands.setContent('<p></p>');
      slideEditor?.commands.setContent('<p></p>');
      return;
    }

    rawSlides.splice(targetIdx, 1);
    const newFull = rawSlides.join('<hr>');
    editor.commands.setContent(newFull);
    setCurrentSlideIndex(Math.max(0, targetIdx - 1));
  };

  const handleClearSlideInPresentation = () => {
    slideEditor?.commands.setContent('<p></p>');
  };

  const getSlideDensityClass = () => {
    if (!slideEditor) return 'slide-density-normal';
    const text = slideEditor.getText().trim();
    const len = text.length;
    const html = slideEditor.getHTML();

    const hasCode = html.includes('<pre') || html.includes('<code');
    const hasImage = html.includes('<img');
    const hasTable = html.includes('<table');
    const hasVideo = html.includes('<iframe') || html.includes('<video');

    if (hasCode || hasImage || hasTable || hasVideo) {
      if (len < 80) return 'slide-density-medium';
      return 'slide-density-normal';
    }

    if (len < 40) {
      return 'slide-density-hero';
    } else if (len < 130) {
      return 'slide-density-sparse';
    } else if (len < 320) {
      return 'slide-density-medium';
    } else {
      return 'slide-density-normal';
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // New File: Ctrl+Alt+N
      if (e.ctrlKey && e.altKey && e.key === 'n') {
        e.preventDefault();
        createNewFile();
      }
      // Help: F1 or Ctrl+/
      if (e.key === 'F1' || (e.ctrlKey && e.key === '/')) {
        e.preventDefault();
        setShowHelpModal(true);
      }
      // Highlight: Ctrl+Shift+H / Cmd+Shift+H
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        if (editor) {
          if (editor.isActive('highlight')) {
            editor.chain().focus().unsetHighlight().run();
            showToast('已取消文本高亮');
          } else {
            editor.chain().focus().setHighlight({ color: lastHighlightColor }).run();
            showToast('已高亮选中文本');
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editor]);

  // Initial outline population
  useEffect(() => {
    if (editor && outline.length === 0) {
      const headings: { id: string, text: string, level: number, pos: number }[] = [];
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === 'heading') {
          headings.push({
            id: `heading-${pos}`,
            text: node.textContent,
            level: node.attrs.level,
            pos: pos
          });
        }
      });
      setOutline(headings);
    }
  }, [editor]);

  // Scroll synchronization for active outline heading
  useEffect(() => {
    const viewport = document.getElementById('editor-viewport');
    if (!viewport || !editor || outline.length === 0 || isPresentation) return;

    const handleScroll = () => {
      const viewportRect = viewport.getBoundingClientRect();
      const triggerOffset = 150; // Threshold from top of viewport

      let currentActiveId = outline[0]?.id || null;

      for (let i = 0; i < outline.length; i++) {
        const item = outline[i];
        if (item.pos === undefined) continue;
        try {
          const coords = editor.view.coordsAtPos(item.pos);
          const topRelativeToViewport = coords.top - viewportRect.top;
          if (topRelativeToViewport <= triggerOffset) {
            currentActiveId = item.id;
          } else {
            break;
          }
        } catch {
          // ignore position calculation error during intermediate edits
        }
      }

      setActiveHeadingId(currentActiveId);
    };

    handleScroll();

    viewport.addEventListener('scroll', handleScroll, { passive: true });
    return () => viewport.removeEventListener('scroll', handleScroll);
  }, [editor, outline, isPresentation]);

  // Auto scroll active item in sidebar outline
  useEffect(() => {
    if (activeHeadingId && activeSidebarTab === 'outline' && showSidebar) {
      const el = document.getElementById(`outline-item-${activeHeadingId}`);
      if (el) {
        el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [activeHeadingId, activeSidebarTab, showSidebar]);

  // Outline Folding Helpers
  const hasSubHeadings = (index: number) => {
    if (index >= outline.length - 1) return false;
    return outline[index + 1].level > outline[index].level;
  };

  const getSubHeadingsCount = (index: number) => {
    if (index < 0 || index >= outline.length - 1) return 0;
    const parentLevel = outline[index].level;
    let count = 0;
    for (let i = index + 1; i < outline.length; i++) {
      if (outline[i].level > parentLevel) {
        count++;
      } else {
        break;
      }
    }
    return count;
  };

  const isItemVisibleInTree = (index: number) => {
    const currentLevel = outline[index].level;
    let targetLevel = currentLevel;

    for (let j = index - 1; j >= 0; j--) {
      const prev = outline[j];
      if (prev.level < targetLevel) {
        if (collapsedHeadings[prev.id]) {
          return false;
        }
        targetLevel = prev.level;
      }
    }
    return true;
  };

  const toggleCollapseHeading = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCollapsedHeadings(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const expandAllHeadings = () => setCollapsedHeadings({});

  const collapseAllHeadings = () => {
    const newMap: Record<string, boolean> = {};
    outline.forEach((item, idx) => {
      if (hasSubHeadings(idx)) {
        newMap[item.id] = true;
      }
    });
    setCollapsedHeadings(newMap);
  };

  // Outline navigation
  const scrollToHeading = (pos: number) => {
    if (!editor) return;
    
    try {
      const { view } = editor;
      editor.commands.focus();
      
      // Calculate coordinates relative to the editor view
      const coords = view.coordsAtPos(pos);
      const viewport = document.getElementById('editor-viewport');
      
      if (viewport) {
        const viewportRect = viewport.getBoundingClientRect();
        
        // Final vertical scroll position:
        // coords.top is viewport-relative (screen)
        // viewportRect.top is viewport's screen top
        // viewport.scrollTop is current scroll
        const scrollTarget = coords.top - viewportRect.top + viewport.scrollTop;
        
        viewport.scrollTo({
          top: scrollTarget - 80, // Padding for the fixed header
          behavior: 'smooth'
        });
        
        // Visually blink or select the heading to guide user
        editor.commands.setTextSelection({ from: pos, to: pos + 1 });
        setTimeout(() => {
          editor.commands.setTextSelection({ from: pos, to: pos });
        }, 1000);
      }
    } catch (e) {
      console.error('Scroll to heading failed', e);
    }
  };

  // 主题与字体切换
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    const fontObj = FONT_OPTIONS.find(f => f.id === fontFamily);
    const fontVal = fontObj?.value || '-apple-system, BlinkMacSystemFont, sans-serif';
    document.documentElement.style.setProperty('--editor-font-family', fontVal);
  }, [fontFamily]);

  // --- 处理函数 ---

  // 预览区选择检测 (Adapted for Tiptap)
  const handleSelectionUpdate = useCallback(() => {
    if (!editor) return;
    const { view } = editor;
    const { state } = view;
    const { selection: editorSelection } = state;

    if (!editorSelection.empty) {
      try {
        const { from, to } = editorSelection;
        const start = view.coordsAtPos(from);
        const end = view.coordsAtPos(to);
        const containerRect = containerRef.current?.getBoundingClientRect();
        
        if (containerRect) {
          setSelection({
            visible: true,
            top: start.top - containerRect.top - 60,
            left: (start.left + end.left) / 2 - containerRect.left,
            text: editor.state.doc.textBetween(from, to, ' '),
            range: null
          });
        }
      } catch (e) {
        setSelection(s => ({ ...s, visible: false }));
      }
    } else {
      setSelection(s => ({ ...s, visible: false }));
    }
  }, [editor]);

  useEffect(() => {
    if (editor) {
      editor.on('selectionUpdate', handleSelectionUpdate);
      return () => {
        editor.off('selectionUpdate', handleSelectionUpdate);
      };
    }
  }, [editor, handleSelectionUpdate]);

  // 样式应用
  const applyStyle = (style: 'bold' | 'italic' | 'heading' | 'bullet' | 'task' | 'quote' | 'color' | 'size' | 'align' | 'clear' | 'highlight' | 'superscript' | 'subscript' | 'undo' | 'redo', value?: string | number) => {
    if (!editor) return;

    switch (style) {
      case 'undo': editor.chain().focus().undo().run(); break;
      case 'redo': editor.chain().focus().redo().run(); break;
      case 'bold': editor.chain().focus().toggleBold().run(); break;
      case 'italic': editor.chain().focus().toggleItalic().run(); break;
      case 'heading': editor.chain().focus().toggleHeading({ level: value as any || 1 }).run(); break;
      case 'bullet': editor.chain().focus().toggleBulletList().run(); break;
      case 'task': editor.chain().focus().toggleTaskList().run(); break;
      case 'quote': editor.chain().focus().toggleBlockquote().run(); break;
      case 'align': editor.chain().focus().setTextAlign(value as string || 'left').run(); break;
      case 'color': editor.chain().focus().setColor(value as string).run(); break;
      case 'highlight': 
        if (value === 'unset') {
          editor.chain().focus().unsetHighlight().run();
        } else if (value) {
          editor.chain().focus().setHighlight({ color: value as string }).run();
          setLastHighlightColor(value as string);
        } else {
          if (editor.isActive('highlight')) {
            editor.chain().focus().unsetHighlight().run();
          } else {
            editor.chain().focus().setHighlight({ color: lastHighlightColor }).run();
          }
        }
        break;
      case 'superscript': editor.chain().focus().toggleSuperscript().run(); break;
      case 'subscript': editor.chain().focus().toggleSubscript().run(); break;
      case 'size': editor.chain().focus().setMark('textStyle', { fontSize: value }).run(); break;
      case 'clear': editor.chain().focus().clearNodes().unsetAllMarks().unsetColor().run(); break;
    }
    
    setSelection(s => ({ ...s, visible: false }));
  };

  // 智能排版函数：清理冗余空格、规范中英文/数字盘古间距、处理空行与列表样式
  const handleSmartFormat = () => {
    if (!editor) return;

    try {
      const html = editor.getHTML();
      if (!html || html === '<p></p>') return;

      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // 递归处理文本节点
      const processTextNodes = (node: Node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          let text = node.textContent || '';
          if (!text) return;

          // 1. 中英文及数字之间自动规范增加空格 (盘古排版)
          text = text.replace(/([\u4e00-\u9fa5\u3040-\u30ff])([A-Za-z0-9])/g, '$1 $2');
          text = text.replace(/([A-Za-z0-9])([\u4e00-\u9fa5\u3040-\u30ff])/g, '$1 $2');

          // 2. 修正连续的多余普通空格
          text = text.replace(/[ \t]{2,}/g, ' ');

          // 3. 规范中文全角标点两侧的冗余空格
          text = text.replace(/\s*([，。！？：；“”‘’（）《》【】])\s*/g, '$1');

          // 4. 英文标点后面保留规范单空格
          text = text.replace(/([a-zA-Z0-9]),([a-zA-Z])/g, '$1, $2');
          text = text.replace(/([a-zA-Z0-9]):([a-zA-Z])/g, '$1: $2');

          node.textContent = text;
        } else {
          const el = node as HTMLElement;
          // 跳过代码块与数学公式节点
          if (
            node.nodeName === 'PRE' || 
            node.nodeName === 'CODE' || 
            el.classList?.contains('katex') || 
            el.getAttribute?.('data-type') === 'mathInline'
          ) {
            return;
          }
          node.childNodes.forEach(processTextNodes);
        }
      };

      processTextNodes(doc.body);

      // 清理超过 1 行的连续空段落
      const paragraphs = Array.from(doc.body.querySelectorAll('p'));
      let emptyCount = 0;
      paragraphs.forEach((p) => {
        const text = p.textContent?.trim() || '';
        const hasMedia = p.querySelector('img, video, iframe, svg, input');
        if (!text && !hasMedia && p.children.length === 0) {
          emptyCount++;
          if (emptyCount > 1) {
            p.remove();
          }
        } else {
          emptyCount = 0;
        }
      });

      // 清理无内容的空白列表项
      doc.body.querySelectorAll('li').forEach(li => {
        if (!li.textContent?.trim() && li.children.length === 0) {
          li.remove();
        }
      });

      const formattedHtml = doc.body.innerHTML;
      editor.commands.setContent(formattedHtml);
      editor.commands.focus();
      showToast('✨ 已完成文档智能格式重排与排版优化！');
    } catch (e) {
      console.error('Smart format error:', e);
      showToast('智能排版处理遇到微小异常，请重试');
    }
  };

  // 文件操作
  const createNewFile = () => {
    if (!editor) return;
    const currentContent = editor.getHTML();
    const isDocEmpty = !currentContent || currentContent === '<p></p>' || currentContent === '<p></p>\n' || currentContent.trim() === '';

    const executeCreate = () => {
      editor.commands.setContent('<p></p>');
      editor.commands.focus();
      setDocName('新建空白文档.md');
      setCurrentFileHandle(null);
      localStorage.setItem(FLUXMARK_STORAGE_KEY, '');
      showToast('已新建空白文档');
    };

    if (!isDocEmpty) {
      setConfirmModal({
        isOpen: true,
        title: '新建空白文档',
        message: '确定要新建空白文档吗？当前编辑的内容将被覆盖。',
        confirmText: '确定新建',
        onConfirm: executeCreate,
      });
    } else {
      executeCreate();
    }
  };

  const loadSampleDoc = () => {
    if (!editor) return;
    
    const executeLoad = () => {
      const sampleHtml = transformMarkdownToMathHTML(initialMarkdown);
      editor.commands.setContent(sampleHtml);
      editor.commands.focus();
      setDocName('示例演示文档.md');
      setCurrentFileHandle(null);
      localStorage.setItem(FLUXMARK_STORAGE_KEY, sampleHtml);
      showToast('已加载示例模版');
    };

    const currentContent = editor.getHTML();
    const isDocEmpty = !currentContent || currentContent === '<p></p>' || currentContent === '<p></p>\n' || currentContent.trim() === '';

    if (!isDocEmpty) {
      setConfirmModal({
        isOpen: true,
        title: '加载示例模版',
        message: '确定要重置并加载示例模版吗？当前编辑的内容将被替换。',
        confirmText: '确定加载',
        onConfirm: executeLoad,
      });
    } else {
      executeLoad();
    }
  };

  const openDirectory = async () => {
    // Favor hidden input logic for better reliability in potentially restricted environments (iframes)
    if (!('showDirectoryPicker' in window)) {
      directoryInputRef.current?.click();
      return;
    }

    try {
      // @ts-ignore - File System Access API
      const dirHandle = await window.showDirectoryPicker();
      const newResources: { name: string, type: 'file' | 'folder', handle?: any }[] = [{ name: dirHandle.name, type: 'folder', handle: dirHandle }];
      
      // @ts-ignore
      for await (const entry of dirHandle.values()) {
        if (entry.kind === 'file' && (entry.name.endsWith('.md') || entry.name.endsWith('.txt'))) {
          newResources.push({ name: entry.name, type: 'file', handle: entry });
        }
      }
      
      setResources(prev => {
        const filtered = prev.filter(p => p.name !== dirHandle.name);
        return [...filtered, ...newResources];
      });
      setActiveSidebarTab('resources');
      showToast(`已打开工作区 ${dirHandle.name}`);
    } catch (err: any) {
      if (err.name === 'SecurityError' || err.name === 'NotAllowedError') {
        // Fallback to hidden input if blocked by security policy or rejected
        directoryInputRef.current?.click();
      } else if (err.name !== 'AbortError') {
        console.error('Failed to open directory:', err);
        directoryInputRef.current?.click();
      }
    }
  };

  const handleDirectoryOpen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newResources: { name: string, type: 'file' | 'folder', handle?: any }[] = [];
      const folderName = files[0].webkitRelativePath.split('/')[0] || '本地项目';
      newResources.push({ name: folderName, type: 'folder' });
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.name.endsWith('.md') || file.name.endsWith('.txt')) {
          newResources.push({ name: file.name, type: 'file', handle: file });
        }
      }
      setResources(prev => [...prev, ...newResources]);
      setActiveSidebarTab('resources');
      showToast(`已打开项目 ${folderName}`);
    }
  };

  const openAppFile = async () => {
    if (!('showOpenFilePicker' in window)) {
      fileInputRef.current?.click();
      return;
    }

    try {
      // @ts-ignore - File System Access API
      const [handle] = await window.showOpenFilePicker({
        types: [{ description: 'Markdown Files', accept: { 'text/markdown': ['.md'] } }],
      });
      const file = await handle.getFile();
      const content = await file.text();
      editor?.commands.setContent(content);
      setDocName(handle.name);
      setCurrentFileHandle(handle);
      showToast(`已打开文档 ${handle.name}`);
      
      // Add to resources if not already there
      setResources(prev => {
        if (prev.find(r => r.name === handle.name)) return prev;
        return [...prev, { name: handle.name, type: 'file', handle }];
      });
      setActiveSidebarTab('resources');
    } catch (err: any) {
      if (err.name === 'SecurityError') {
        fileInputRef.current?.click(); // Fallback to classic input
      } else if (err.name !== 'AbortError') {
        console.error('Failed to open file:', err);
        fileInputRef.current?.click();
      }
    }
  };

  const handleOpenFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editor) {
      const reader = new FileReader();
      reader.onload = (re) => {
        if (re.target?.result) {
          editor.commands.setContent(re.target.result as string);
          setDocName(file.name);
          setCurrentFileHandle(null);
          showToast(`已打开文档 ${file.name}`);
        }
      };
      reader.readAsText(file);
    }
  };

  // 另存为：允许用户选择电脑上的任意路径保存文件
  const saveAsFile = async () => {
    if (!editor) return;
    const markdownOutput = (editor.storage as any).markdown.getMarkdown();
    const defaultName = docName.endsWith('.md') ? docName : `${docName}.md`;

    if ('showSaveFilePicker' in window) {
      try {
        // @ts-ignore - File System Access API
        const handle = await window.showSaveFilePicker({
          suggestedName: defaultName,
          types: [
            {
              description: 'Markdown 文件 (*.md)',
              accept: { 'text/markdown': ['.md'] },
            },
          ],
        });
        const writable = await handle.createWritable();
        await writable.write(markdownOutput);
        await writable.close();

        setCurrentFileHandle(handle);
        setDocName(handle.name);

        // 同步添加至资源列表
        setResources(prev => {
          if (prev.find(r => r.name === handle.name)) return prev;
          return [...prev, { name: handle.name, type: 'file', handle }];
        });

        showToast(`文件已成功另存为 ${handle.name}`);
      } catch (err: any) {
        if (err.name === 'AbortError') {
          return; // 用户取消了另存为弹窗
        }
        console.warn('showSaveFilePicker 另存为受限或失败，降级下载:', err);
        const blob = new Blob([markdownOutput], { type: 'text/markdown;charset=utf-8' });
        saveAs(blob, defaultName);
        showToast(`已保存文件 ${defaultName}`);
      }
    } else {
      const blob = new Blob([markdownOutput], { type: 'text/markdown;charset=utf-8' });
      saveAs(blob, defaultName);
      showToast(`已保存文件 ${defaultName}`);
    }
  };

  // 保存：直接保存到打开的源文件中，若无源文件句柄则自动转为“另存为”
  const saveFile = async () => {
    if (!editor) return;

    if (currentFileHandle && typeof currentFileHandle.createWritable === 'function') {
      try {
        const writable = await currentFileHandle.createWritable();
        const markdownOutput = (editor.storage as any).markdown.getMarkdown();
        await writable.write(markdownOutput);
        await writable.close();
        showToast(`已保存至源文件 ${docName}`);
        return;
      } catch (err: any) {
        console.warn('写回源文件失败，准备弹出另存为:', err);
      }
    }

    // 若当前没有可写的源文件句柄，直接自动转为另存为
    saveAsFile();
  };

  // 快捷键监听：Ctrl+S (保存) & Ctrl+Shift+S (另存为)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (e.shiftKey) {
          saveAsFile();
        } else {
          saveFile();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editor, currentFileHandle, docName]);

  // 导出操作
  const exportMarkdown = () => {
    if (!editor) return;
    const markdownOutput = (editor.storage as any).markdown?.getMarkdown() || '';
    const blob = new Blob([markdownOutput], { type: 'text/markdown;charset=utf-8' });
    const filename = docName.endsWith('.md') ? docName : `${docName}.md`;
    saveAs(blob, filename);
  };

  const exportPDF = async () => {
    if (!editor) return;
    const editorEl = editor.view.dom;
    if (!editorEl) return;
    
    // Target the main document container for capture
    const captureEl = (editorEl.closest('.max-w-4xl') || editorEl.parentElement) as HTMLElement;
    if (!captureEl) return;

    try {
      const originalTransform = captureEl.style.transform;
      const originalZoom = captureEl.style.zoom;
      const originalWidth = captureEl.style.width;
      const originalMaxWidth = captureEl.style.maxWidth;
      const originalHeight = captureEl.style.height;
      const originalOverflow = captureEl.style.overflow;
      
      // Ensure we capture the full content height
      const fullHeight = captureEl.scrollHeight;
      
      captureEl.style.transform = 'none';
      captureEl.style.zoom = '1';
      captureEl.style.width = '800px'; 
      captureEl.style.maxWidth = 'none';
      captureEl.style.height = 'auto';
      captureEl.style.overflow = 'visible';

      const canvas = await toCanvas(captureEl, { 
        pixelRatio: 2,
        backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
        filter: (node) => {
          if (node instanceof HTMLElement) {
            if (node.classList.contains('fixed') || node.classList.contains('absolute') || node.tagName === 'BUTTON') {
              return false;
            }
          }
          return true;
        },
        style: {
          padding: '40px',
        }
      });

      // Restore
      captureEl.style.transform = originalTransform;
      captureEl.style.zoom = originalZoom;
      captureEl.style.width = originalWidth;
      captureEl.style.maxWidth = originalMaxWidth;
      captureEl.style.height = originalHeight;
      captureEl.style.overflow = originalOverflow;

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight; 
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save(`fluxmark-${Date.now()}.pdf`);
    } catch (err) {
      console.error('PDF export failed', err);
    }
  };

  const exportImage = async () => {
    if (!editor) return;
    const editorEl = editor.view.dom;
    const captureEl = (editorEl.closest('.max-w-4xl') || editorEl.parentElement) as HTMLElement;
    if (!captureEl) return;

    try {
      const originalTransform = captureEl.style.transform;
      const originalZoom = captureEl.style.zoom;
      const originalHeight = captureEl.style.height;
      const originalOverflow = captureEl.style.overflow;
      const fullHeight = captureEl.scrollHeight;
      
      captureEl.style.transform = 'none';
      captureEl.style.zoom = '1';
      captureEl.style.height = 'auto';
      captureEl.style.overflow = 'visible';

      const canvas = await toCanvas(captureEl, { 
        pixelRatio: 3,
        backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
        filter: (node) => {
          if (node instanceof HTMLElement) {
            if (node.classList.contains('fixed') || node.classList.contains('absolute') || node.tagName === 'BUTTON') {
              return false;
            }
          }
          return true;
        },
        style: {
          padding: '40px',
        }
      });

      captureEl.style.transform = originalTransform;
      captureEl.style.zoom = originalZoom;
      captureEl.style.height = originalHeight;
      captureEl.style.overflow = originalOverflow;

      const imgData = canvas.toDataURL('image/png');
      const filename = `fluxmark-${Date.now()}.png`;
      
      // Fallback download method
      const link = document.createElement('a');
      link.download = filename;
      link.href = imgData;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Image export failed', err);
    }
  };

  const exportHTML = () => {
    if (!editor) return;
    const htmlOutput = editor.getHTML();
    const fullHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>FluxMark Export</title>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/styles/github-dark.min.css">
        <style>
          :root { --accent: #1161f3; }
          body { font-family: -apple-system, system-ui, sans-serif; padding: 60px; max-width: 800px; margin: 0 auto; line-height: 1.8; color: #1e293b; background: #fff; }
          h1 { font-size: 2.5rem; font-bold; border-bottom: 2px solid #eee; padding-bottom: 15px; margin-top: 40px; color: #000; }
          h2 { font-size: 1.8rem; font-bold; margin-top: 30px; border-bottom: 1px solid #eee; padding-bottom: 10px; }
          p { margin-bottom: 1.5rem; }
          img { max-width: 100%; height: auto; border-radius: 12px; display: block; margin: 30px auto; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
          pre { background: #ffffff; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; overflow-x: auto; color: #1e293b; margin: 25px 0; font-size: 0.9rem; }
          table { width: 100%; border-collapse: collapse; margin: 25px 0; border-radius: 8px; overflow: hidden; }
          th, td { border: 1px solid #e2e8f0; padding: 12px 15px; text-align: left; }
          th { background: #f8fafc; font-weight: bold; }
          blockquote { border-left: 5px solid var(--accent); padding: 10px 25px; font-style: italic; color: #64748b; background: #f8fafc; margin: 25px 0; border-radius: 0 8px 8px 0; }
          code:not(pre code) { background: #dbeafe; padding: 2px 6px; border-radius: 4px; color: #1e40af; font-family: monospace; }
          mark { background-color: #dbeafe; color: #1e40af; padding: 0 4px; border-radius: 2px; font-style: normal; }
        </style>
      </head>
      <body>${htmlOutput}</body>
      </html>
    `;
    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    saveAs(blob, 'fluxmark-document.html');
  };

  const exportWord = async () => {
    if (!editor) return;
    const json = editor.getJSON();
    
    // Theme colors
    const accentColor = '1161F3'; // Hex without # for docx
    const borderColor = 'E2E8F0';
    const textColor = '1E293B';
    const secondaryTextColor = '64748B';
    const bgSecondary = 'F8FAFC';
    const highlightColor = 'DBEAFE';

    const children: any[] = [];

    const parseNodes = (nodes: any[], listLevel = 0, listType?: 'bullet' | 'ordered') => {
      nodes.forEach(node => {
        switch (node.type) {
          case 'heading': {
            const level = node.attrs.level || 1;
            children.push(
              new docx.Paragraph({
                text: node.content?.map((c: any) => c.text).join('') || '',
                heading: level === 1 ? docx.HeadingLevel.HEADING_1 : level === 2 ? docx.HeadingLevel.HEADING_2 : docx.HeadingLevel.HEADING_3,
                spacing: { before: 400, after: 200 },
                border: level <= 2 ? {
                  bottom: { color: level === 1 ? accentColor : borderColor, space: 10, style: docx.BorderStyle.SINGLE, size: level === 1 ? 24 : 12 },
                } : undefined,
              })
            );
            break;
          }
          case 'paragraph': {
            const runs = node.content?.map((c: any) => {
              if (c.type === 'text') {
                return new docx.TextRun({
                  text: c.text,
                  bold: c.marks?.some((m: any) => m.type === 'bold'),
                  italics: c.marks?.some((m: any) => m.type === 'italic'),
                  color: c.marks?.find((m: any) => m.type === 'textStyle')?.attrs?.color?.replace('#', '') || textColor,
                  shading: c.marks?.some((m: any) => m.type === 'highlight') ? {
                    type: docx.ShadingType.CLEAR,
                    fill: highlightColor,
                    color: 'auto',
                  } : undefined,
                });
              } else if (c.type === 'inlineMath') {
                return new docx.TextRun({
                  text: `$${c.attrs.latex}$`,
                  color: accentColor,
                  italics: true,
                  font: 'Cambria Math',
                });
              }
              return null;
            }).filter(Boolean);

            const paragraphConfig: any = {
              children: runs || [],
              spacing: { line: 360, after: 200 },
            };

            if (listType === 'bullet') {
              paragraphConfig.bullet = { level: listLevel - 1 };
              paragraphConfig.spacing.after = 120;
            } else if (listType === 'ordered') {
              paragraphConfig.numbering = { reference: 'main-numbering', level: listLevel - 1 };
              paragraphConfig.spacing.after = 120;
            }

            children.push(new docx.Paragraph(paragraphConfig));
            break;
          }
          case 'bulletList':
            if (node.content) parseNodes(node.content, listLevel + 1, 'bullet');
            break;
          case 'orderedList':
            if (node.content) parseNodes(node.content, listLevel + 1, 'ordered');
            break;
          case 'listItem': {
            if (node.content) parseNodes(node.content, listLevel);
            break;
          }
          case 'table': {
            const rows = node.content?.map((row: any) => {
              const cells = row.content?.map((cell: any) => {
                const cellChildren: any[] = [];
                // Simple cell content parsing
                cell.content?.forEach((p: any) => {
                  const runs = p.content?.map((c: any) => new docx.TextRun({ text: c.text, bold: c.marks?.some((m: any) => m.type === 'bold') })) || [];
                  cellChildren.push(new docx.Paragraph({ children: runs }));
                });
                return new docx.TableCell({
                  children: cellChildren,
                  verticalAlign: docx.VerticalAlign.CENTER,
                  borders: {
                    top: { style: docx.BorderStyle.SINGLE, size: 1, color: borderColor },
                    bottom: { style: docx.BorderStyle.SINGLE, size: 1, color: borderColor },
                    left: { style: docx.BorderStyle.SINGLE, size: 1, color: borderColor },
                    right: { style: docx.BorderStyle.SINGLE, size: 1, color: borderColor },
                  },
                });
              }) || [];
              return new docx.TableRow({ children: cells });
            }) || [];
            children.push(new docx.Table({ rows, width: { size: 100, type: docx.WidthType.PERCENTAGE } }));
            break;
          }
          case 'blockquote': {
            const quoteText = node.content?.map((p: any) => p.content?.map((c: any) => c.text).join('')).join('\n') || '';
            children.push(
              new docx.Paragraph({
                children: [new docx.TextRun({ text: quoteText, italics: true, color: secondaryTextColor })],
                indent: { left: 720 },
                shading: { type: docx.ShadingType.CLEAR, fill: bgSecondary },
                border: {
                  left: { color: accentColor, space: 10, style: docx.BorderStyle.SINGLE, size: 24 },
                },
                spacing: { before: 200, after: 200, line: 360 },
              })
            );
            break;
          }
          case 'horizontalRule':
            children.push(
              new docx.Paragraph({
                border: { bottom: { color: borderColor, space: 1, style: docx.BorderStyle.SINGLE, size: 6 } },
                spacing: { before: 200, after: 200 },
              })
            );
            break;
          case 'codeBlock': {
            const codeText = node.content?.map((c: any) => c.text).join('') || '';
            const language = node.attrs?.language || 'javascript';
            
            // Map HLJS classes to colors matching index.css
            const hljsToHex: Record<string, string> = {
              'hljs-keyword': '0550AE',
              'hljs-selector-tag': '0550AE',
              'hljs-built_in': '0550AE',
              'hljs-string': '116329',
              'hljs-attr': '116329',
              'hljs-number': '0550AE',
              'hljs-literal': '0550AE',
              'hljs-comment': '6E7781',
              'hljs-quote': '6E7781',
              'hljs-title': '8250DF',
              'hljs-section': '8250DF',
              'hljs-name': '8250DF',
              'hljs-variable': '953800',
              'hljs-template-variable': '953800',
              'hljs-type': '0550AE',
              'hljs-tag': '116329',
              'hljs-punctuation': '1B1F24',
            };

            const cellChildren: any[] = [];
            
            // Add language/header row
            cellChildren.push(
              new docx.Paragraph({
                children: [
                  new docx.TextRun({ text: ' ● ● ●  ', color: 'CBD5E1', size: 16 }),
                  new docx.TextRun({ text: language.toUpperCase(), font: 'Consolas', size: 16, color: '64748B', bold: true })
                ],
                spacing: { after: 100 },
              })
            );

            try {
              // Get highlighted tokens
              const highlighted = lowlight.highlight(language, codeText);
              
              // Helper to flatten tokens to lines of TextRuns
              const linesOfRuns: docx.TextRun[][] = [[]];
              
              const processNode = (n: any, currentClasses: string[] = []) => {
                if (n.type === 'text') {
                  const segments = n.value.split('\n');
                  segments.forEach((segment: string, i: number) => {
                    if (i > 0) linesOfRuns.push([]);
                    if (segment) {
                      const color = currentClasses.reduce((acc, cls) => hljsToHex[cls] || acc, textColor);
                      linesOfRuns[linesOfRuns.length - 1].push(
                        new docx.TextRun({ 
                          text: segment, 
                          font: 'Consolas', 
                          size: 19, // ~9.5pt
                          color: color,
                          bold: currentClasses.some(cls => cls === 'hljs-keyword' || cls === 'hljs-title')
                        })
                      );
                    }
                  });
                } else if (n.children) {
                  const newClasses = [...currentClasses, ...(n.properties?.className || [])];
                  n.children.forEach((child: any) => processNode(child, newClasses));
                }
              };

              highlighted.children.forEach(n => processNode(n));

              // Convert lines of runs to paragraphs
              linesOfRuns.forEach(runs => {
                cellChildren.push(
                  new docx.Paragraph({
                    children: runs,
                    spacing: { before: 0, after: 0, line: 240 },
                  })
                );
              });
            } catch (err) {
              // Fallback to plain text if highlighting fails
              codeText.split('\n').forEach(line => {
                cellChildren.push(
                  new docx.Paragraph({
                    children: [new docx.TextRun({ text: line, font: 'Consolas', size: 19, color: textColor })],
                    spacing: { before: 0, after: 0, line: 240 },
                  })
                );
              });
            }

            children.push(
              new docx.Table({
                width: { size: 100, type: docx.WidthType.PERCENTAGE },
                rows: [
                  new docx.TableRow({
                    children: [
                      new docx.TableCell({
                        children: cellChildren,
                        shading: { type: docx.ShadingType.CLEAR, fill: 'F8FAFC' },
                        borders: {
                          top: { color: borderColor, style: docx.BorderStyle.SINGLE, size: 6 },
                          bottom: { color: borderColor, style: docx.BorderStyle.SINGLE, size: 6 },
                          left: { color: borderColor, style: docx.BorderStyle.SINGLE, size: 6 },
                          right: { color: borderColor, style: docx.BorderStyle.SINGLE, size: 6 },
                        },
                        margins: { top: 150, bottom: 150, left: 150, right: 150 },
                      })
                    ]
                  })
                ]
              })
            );
            children.push(new docx.Paragraph({ spacing: { after: 200 } }));
            break;
          }
          case 'blockMath': {
            children.push(
              new docx.Paragraph({
                children: [new docx.TextRun({ text: `$$${node.attrs.latex}$$`, color: accentColor, font: 'Cambria Math' })],
                alignment: docx.AlignmentType.CENTER,
                spacing: { before: 200, after: 200 },
              })
            );
            break;
          }
          // Tables and images can be added here if needed, but keeping it focused on text structure first
        }
      });
    };

    if (json.content) parseNodes(json.content);

    const doc = new docx.Document({
      numbering: {
        config: [
          {
            reference: "main-numbering",
            levels: [
              { level: 0, format: docx.LevelFormat.DECIMAL, text: "%1.", alignment: docx.AlignmentType.START },
              { level: 1, format: docx.LevelFormat.DECIMAL, text: "%1.%2.", alignment: docx.AlignmentType.START },
              { level: 2, format: docx.LevelFormat.DECIMAL, text: "%1.%2.%3.", alignment: docx.AlignmentType.START },
            ],
          },
        ],
      },
      sections: [{
        properties: {},
        children: children,
      }],
      styles: {
        paragraphStyles: [
          {
            id: "Heading1",
            name: "Heading 1",
            basedOn: "Normal",
            next: "Normal",
            quickFormat: true,
            run: {
              size: 56, // 28pt
              bold: true,
              color: accentColor,
            },
          },
          {
            id: "Heading2",
            name: "Heading 2",
            basedOn: "Normal",
            next: "Normal",
            quickFormat: true,
            run: {
              size: 40, // 20pt
              bold: true,
              color: '334155',
            },
          }
        ]
      }
    });

    const blob = await docx.Packer.toBlob(doc);
    saveAs(blob, `fluxmark-${Date.now()}.docx`);
  };

  // 图片上传与裁剪
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (re) => setCropImage(re.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editor) {
      const url = URL.createObjectURL(file);
      editor.chain().focus().setVideo({ src: url }).run();
    }
  };

  const handleCrop = () => {
    if (cropperRef.current && editor) {
      const base64 = cropperRef.current.getCroppedCanvas().toDataURL();
      editor.chain().focus().setImage({ src: base64 }).run();
      setCropImage(null);
    }
  };

  // Timer Logic
  useEffect(() => {
    let interval: any;
    if (isTimerActive && isPresentation) {
      interval = setInterval(() => {
        if (isCountdownMode) {
          setTimerTime(prev => {
                if (prev <= 10 && prev > 0) {
                  playAlarmSound(440, 0.1);
                }
                if (prev <= 1) {
                  playAlarmSound(880, 0.3);
                  setIsTimerActive(false);
                  setTimeout(() => alert('倒计时结束！'), 100);
                  return 0;
                }
                return prev - 1;
          });
        } else {
          setTimerTime(prev => prev + 1);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, isPresentation, isCountdownMode, playAlarmSound]);

  const startCountdown = (minutes: number) => {
    setTimerTime(minutes * 60);
    setIsCountdownMode(true);
    setIsTimerActive(true);
    setShowCountdownModal(false);
    setShowTimer(true);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Drawing & Laser Pointer Logic
  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (presentTool === 'select') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    
    const clientX = ('touches' in e) ? (e as any).touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = ('touches' in e) ? (e as any).touches[0].clientY : (e as React.MouseEvent).clientY;
    
    const x = (clientX - rect.left);
    const y = (clientY - rect.top);

    if (presentTool === 'laser') {
      setLaserPos({ x: clientX, y: clientY, visible: true });
      return;
    }

    isDrawing.current = true;
    lastPos.current = { x, y };
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (presentTool === 'select' || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    const clientX = ('touches' in e) ? (e as any).touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = ('touches' in e) ? (e as any).touches[0].clientY : (e as React.MouseEvent).clientY;

    if (presentTool === 'laser') {
      setLaserPos({ x: clientX, y: clientY, visible: true });
      return;
    }

    if (!isDrawing.current) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const x = (clientX - rect.left);
    const y = (clientY - rect.top);

    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(x, y);
    
    if (presentTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = presentSize * 4;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = presentColor;
      ctx.lineWidth = presentSize;
      ctx.lineCap = 'round';
    }
    
    ctx.stroke();
    lastPos.current = { x, y };
  };

  const stopDrawing = () => {
    if (presentTool !== 'laser') {
      isDrawing.current = false;
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const stopTimer = () => {
    setIsTimerActive(false);
    setTimerTime(0);
    setIsCountdownMode(false);
    setShowTimer(false);
  };

  useEffect(() => {
    if (!isPresentation) return;
    
    const updateCanvasSize = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.scale(dpr, dpr);
      }
    };
    
    window.addEventListener('resize', updateCanvasSize);
    updateCanvasSize();
    
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, [isPresentation]);

  // Keyboard navigation for presentation slides
  useEffect(() => {
    if (!isPresentation) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const isEditing = (e.target as HTMLElement)?.closest('.ProseMirror') || (e.target as HTMLElement)?.isContentEditable || e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;

      const fullHtml = editor?.getHTML() || '';
      const rawSlides = fullHtml.split(/<hr\b[^>]*\/?>/i);
      const slideCount = rawSlides.length || 1;

      if (isEditing) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowRight') {
          e.preventDefault();
          setCurrentSlideIndex(prev => Math.min(slideCount - 1, prev + 1));
        } else if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowLeft') {
          e.preventDefault();
          setCurrentSlideIndex(prev => Math.max(0, prev - 1));
        } else if (e.key === 'PageDown') {
          e.preventDefault();
          setCurrentSlideIndex(prev => Math.min(slideCount - 1, prev + 1));
        } else if (e.key === 'PageUp') {
          e.preventDefault();
          setCurrentSlideIndex(prev => Math.max(0, prev - 1));
        } else if (e.key === 'Escape') {
          setIsPresentation(false);
        }
        return;
      }

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault();
        setCurrentSlideIndex(prev => Math.min(slideCount - 1, prev + 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        setCurrentSlideIndex(prev => Math.max(0, prev - 1));
      } else if (e.key === 'Home') {
        e.preventDefault();
        setCurrentSlideIndex(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        setCurrentSlideIndex(slideCount - 1);
      } else if (e.key === 'Escape') {
        setIsPresentation(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPresentation, editor]);

  const renderSlideHtml = (rawHtml: string) => {
    if (!rawHtml || !rawHtml.trim()) {
      return '<div class="text-center text-slate-400 italic py-16">（本页暂无内容）</div>';
    }
    let processed = rawHtml
      .replace(/<span\s+data-type="inline-math"\s+data-latex="([^"]*)"[^>]*><\/span>/gi, (_, latex) => {
        const decodedLatex = latex.replace(/&quot;/g, '"');
        try {
          return katex.renderToString(decodedLatex, { displayMode: false, throwOnError: false });
        } catch {
          return decodedLatex;
        }
      })
      .replace(/<div\s+data-type="block-math"\s+data-latex="([^"]*)"[^>]*><\/div>/gi, (_, latex) => {
        const decodedLatex = latex.replace(/&quot;/g, '"');
        try {
          return katex.renderToString(decodedLatex, { displayMode: true, throwOnError: false });
        } catch {
          return decodedLatex;
        }
      });
    return processed;
  };

  const togglePresentation = () => {
    setIsPresentation(!isPresentation);
    if (!isPresentation) {
      setCurrentSlideIndex(0);
      containerRef.current?.requestFullscreen().catch(() => {});
      setTimerTime(0);
      setIsCountdownMode(false);
      setIsTimerActive(true);
    } else {
      setIsTimerActive(false);
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  const rawSlides = (editor?.getHTML() || '').split(/<hr\b[^>]*\/?>/i);
  const slides = rawSlides.length > 0 ? rawSlides : [''];
  const validSlideIndex = Math.min(Math.max(0, currentSlideIndex), slides.length - 1);

  return (
    <div ref={containerRef} className="h-screen flex flex-col font-sans relative overflow-hidden select-none bg-[var(--bg-secondary)]">
      {/* --- 顶部工具栏 --- */}
      <header className="h-14 border-b border-[var(--border)] bg-[var(--bg-primary)] px-4 flex items-center justify-between z-40 shrink-0">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setShowSidebar(!showSidebar)}
            className="p-2 hover:bg-[var(--bg-secondary)] rounded-lg text-[var(--text-secondary)] transition-colors"
            title={showSidebar ? "收起侧边栏" : "展开侧边栏"}
          >
            {showSidebar ? <PanelLeftClose size={20} /> : <PanelLeft size={20} />}
          </button>

          <div className="flex items-center gap-2 text-[var(--accent)] font-bold text-lg cursor-pointer">
            <div className="p-1 px-2 bg-[var(--accent)] rounded text-white flex items-center justify-center">
              <FluxLogo size={20} />
            </div>
            <span className="tracking-tight">FluxMark</span>
          </div>

          <nav className="flex items-center gap-1">
            <ToolbarGroup label="文件">
              <ToolbarItem icon={<FilePlus size={16} />} label="新建" onClick={createNewFile} />
              <ToolbarItem icon={<Upload size={16} />} label="打开" onClick={openAppFile} />
              <ToolbarItem icon={<Save size={16} />} label="保存" onClick={saveFile} />
              <ToolbarItem icon={<FileDown size={16} />} label="另存为..." onClick={saveAsFile} />
              <ToolbarItem icon={<RefreshCcw size={16} />} label="加载示例模版" onClick={loadSampleDoc} />
            </ToolbarGroup>
            
            <ToolbarGroup label="导出">
              <ToolbarItem icon={<FileCode size={16} />} label="导出 Markdown" onClick={exportMarkdown} />
              <ToolbarItem icon={<Printer size={16} />} label="导出 PDF" onClick={exportPDF} />
              <ToolbarItem icon={<Download size={16} />} label="生成图片" onClick={exportImage} />
              <ToolbarItem icon={<FileText size={16} />} label="导出 HTML" onClick={exportHTML} />
              <ToolbarItem icon={<FileDown size={16} />} label="导出 Word" onClick={exportWord} />
            </ToolbarGroup>

            <ToolbarGroup label="主题" alignRight>
              <div className="w-72 sm:w-80 max-w-[calc(100vw-2rem)] p-2 space-y-3">
                {/* 界面主题设置 */}
                <div>
                  <div className="px-2 py-1 text-[10px] font-bold text-[var(--text-secondary)] border-b border-[var(--border)] mb-1 flex items-center justify-between">
                    <span>界面色彩主题</span>
                    <span className="font-normal text-[9px] opacity-75">共 {THEME_OPTIONS.length} 款</span>
                  </div>
                  <div className="space-y-1">
                    {THEME_OPTIONS.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setTheme(t.id)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-all cursor-pointer group ${
                          theme === t.id 
                            ? 'bg-blue-50 text-blue-600 font-bold dark:bg-blue-950/70 dark:text-blue-300' 
                            : 'text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="p-1 rounded bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] group-hover:text-[var(--accent)] shrink-0">
                            {t.icon}
                          </span>
                          <div className="flex flex-col min-w-0">
                            <span className="font-medium text-xs truncate flex items-center gap-1.5">
                              {t.name}
                              {t.id === 'light' && (
                                <span className="text-[9px] font-normal px-1 py-0.2 rounded bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                                  默认
                                </span>
                              )}
                            </span>
                            <span className="text-[9px] text-[var(--text-secondary)] font-normal truncate opacity-80">{t.desc}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 pl-2 shrink-0">
                          <span 
                            className="w-3 h-3 rounded-full border border-black/10 dark:border-white/20 shadow-xs" 
                            style={{ backgroundColor: t.bgHex }} 
                            title="背景 Preview"
                          />
                          <span 
                            className="w-3 h-3 rounded-full border border-black/10 dark:border-white/20 shadow-xs" 
                            style={{ backgroundColor: t.accentHex }} 
                            title="主色 Preview"
                          />
                          {theme === t.id && (
                            <Check size={13} className="text-[var(--accent)] ml-0.5" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 编辑器正文字体设置 */}
                <div className="pt-2.5 border-t border-[var(--border)]">
                  <div className="px-2 py-1 text-[10px] font-bold text-[var(--text-secondary)] mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Type size={13} className="text-[var(--accent)]" />
                      <span>正文与编辑器字体</span>
                    </span>
                    <span className="text-[9px] font-mono text-[var(--accent)] font-bold bg-blue-50 dark:bg-blue-950/80 px-1.5 py-0.5 rounded border border-blue-200/60 dark:border-blue-800/60">
                      {FONT_OPTIONS.find(f => f.id === fontFamily)?.categoryLabel || '实时渲染'}
                    </span>
                  </div>

                  {/* Font Select Dropdown */}
                  <div className="relative px-0.5">
                    <select
                      value={fontFamily}
                      onChange={(e) => {
                        const fontId = e.target.value;
                        setFontFamily(fontId);
                        const found = FONT_OPTIONS.find(f => f.id === fontId);
                        if (found) {
                          showToast(`已实时切换编辑器字体：${found.name}`);
                        }
                      }}
                      className="w-full bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border)] rounded-xl px-3 py-2 pr-8 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[var(--accent)] cursor-pointer appearance-none transition-all shadow-2xs"
                      style={{ fontFamily: FONT_OPTIONS.find(f => f.id === fontFamily)?.value || 'inherit' }}
                    >
                      <optgroup label="—— 无衬线字体 (Sans-Serif) ——">
                        {FONT_OPTIONS.filter(f => f.category === 'sans').map(f => (
                          <option key={f.id} value={f.id} style={{ fontFamily: f.value }}>
                            {f.name}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="—— 衬线字体 (Serif) ——">
                        {FONT_OPTIONS.filter(f => f.category === 'serif').map(f => (
                          <option key={f.id} value={f.id} style={{ fontFamily: f.value }}>
                            {f.name}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="—— 等宽字体 (Monospace) ——">
                        {FONT_OPTIONS.filter(f => f.category === 'mono').map(f => (
                          <option key={f.id} value={f.id} style={{ fontFamily: f.value }}>
                            {f.name}
                          </option>
                        ))}
                      </optgroup>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-[var(--text-secondary)]">
                      <ChevronDown size={14} />
                    </div>
                  </div>

                  {/* Font Sample Cards / Quick Switchers */}
                  <div className="mt-2.5 grid grid-cols-2 gap-1.5 px-0.5">
                    {FONT_OPTIONS.map((f) => {
                      const isActive = fontFamily === f.id;
                      return (
                        <button
                          key={f.id}
                          onClick={() => {
                            setFontFamily(f.id);
                            showToast(`已实时切换编辑器字体：${f.name}`);
                          }}
                          className={`p-1.5 px-2 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-1.5 ${
                            isActive
                              ? 'border-blue-500 bg-blue-50/90 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 font-bold shadow-2xs'
                              : 'border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] hover:border-slate-300 dark:hover:border-slate-600'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="text-[11px] font-medium truncate leading-tight flex items-center gap-1">
                              <span>{f.name}</span>
                            </div>
                            <div 
                              className="text-[10px] opacity-75 truncate mt-0.5"
                              style={{ fontFamily: f.value }}
                            >
                              {f.sample}
                            </div>
                          </div>
                          {isActive && <Check size={12} className="text-blue-600 dark:text-blue-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </ToolbarGroup>

            <ToolbarGroup label="帮助" alignRight>
              <ToolbarItem icon={<HelpCircle size={16} />} label="快捷键说明" onClick={() => setShowHelpModal(true)} />
            </ToolbarGroup>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex bg-[var(--bg-secondary)] p-1 rounded-lg border border-[var(--border)] gap-0.5">
            {THEME_OPTIONS.map((t) => (
              <ThemeButton 
                key={t.id} 
                active={theme === t.id} 
                icon={t.icon} 
                onClick={() => setTheme(t.id)} 
                title={`切换主题: ${t.name}`} 
              />
            ))}
          </div>

          <div className="h-6 w-px bg-[var(--border)]" />

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowAIChat(!showAIChat)}
              className={`p-2 rounded-lg transition-all flex items-center gap-2 ${showAIChat ? 'bg-[var(--accent)] text-white shadow-md' : 'hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-transparent hover:border-[var(--border)]'}`}
              title="AI 助手"
            >
              <SparklesIcon size={20} />
              {showAIChat && <span className="text-xs font-bold">AI 已开启</span>}
            </button>
            <div className="h-6 w-px bg-[var(--border)] mx-1" />
            <button onClick={togglePresentation} title="放映模式" className="p-2 hover:bg-[var(--bg-secondary)] rounded-lg transition-colors cursor-pointer text-[var(--text-secondary)]">
              <Monitor size={20} />
            </button>
            <button 
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = handleImageUpload as any;
                input.click();
              }}
              title="插入本地图片"
              className="px-4 py-2 bg-[var(--accent)] text-white rounded-lg flex items-center gap-2 hover:opacity-90 transition-opacity font-medium cursor-pointer"
            >
              <ImageIcon size={18} />
              <span>插入图片</span>
            </button>
            <button 
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'video/*';
                input.onchange = handleVideoUpload as any;
                input.click();
              }}
              title="插入本地视频"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:opacity-90 transition-opacity font-medium cursor-pointer shadow-sm"
            >
              <VideoIcon size={18} />
              <span>插入视频</span>
            </button>
          </div>
        </div>
      </header>

      {/* --- Main Content --- */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* Outline Sidebar */}
        <AnimatePresence>
          {showSidebar && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="border-r border-[var(--border)] bg-[var(--bg-secondary)] overflow-hidden flex flex-col z-30"
            >
              <div className="flex border-b border-[var(--border)]">
                <button 
                  onClick={() => setActiveSidebarTab('outline')}
                  className={`flex-1 py-3 text-xs font-bold transition-all ${activeSidebarTab === 'outline' ? 'bg-[var(--bg-primary)] text-[var(--accent)] border-b-2 border-[var(--accent)]' : 'text-[var(--text-secondary)] hover:bg-slate-50'}`}
                >
                  大纲 
                </button>
                <button 
                  onClick={() => setActiveSidebarTab('resources')}
                  className={`flex-1 py-3 text-xs font-bold transition-all ${activeSidebarTab === 'resources' ? 'bg-[var(--bg-primary)] text-[var(--accent)] border-b-2 border-[var(--accent)]' : 'text-[var(--text-secondary)] hover:bg-slate-50'}`}
                >
                  资源管理
                </button>
              </div>

              <div className="flex-1 overflow-hidden flex flex-col">
                {activeSidebarTab === 'outline' ? (
                  <div className="flex flex-col h-full overflow-hidden">
                    {/* Outline Toolbar */}
                    {outline.length > 0 && (
                      <div className="px-3 py-2 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-primary)]/50 shrink-0 select-none">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--text-secondary)]">
                          <span>共 {outline.length} 个章节</span>
                          {selectedLevelFilter !== null && (
                            <span className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 px-1.5 py-0.2 rounded font-mono font-medium flex items-center gap-1">
                              仅看 H{selectedLevelFilter}
                              <button 
                                onClick={() => setSelectedLevelFilter(null)}
                                className="hover:text-blue-900 dark:hover:text-white font-bold ml-0.5"
                                title="清除筛选"
                              >
                                ×
                              </button>
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={expandAllHeadings}
                            className="px-2 py-0.5 text-[10px] font-medium text-slate-500 hover:text-[var(--accent)] hover:bg-slate-100 rounded transition-colors cursor-pointer"
                            title="展开全部"
                          >
                            展开全部
                          </button>
                          <span className="text-slate-300 text-[10px]">|</span>
                          <button
                            onClick={collapseAllHeadings}
                            className="px-2 py-0.5 text-[10px] font-medium text-slate-500 hover:text-[var(--accent)] hover:bg-slate-100 rounded transition-colors cursor-pointer"
                            title="折叠全部"
                          >
                            折叠全部
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Outline List Container */}
                    <div className="flex-1 overflow-y-auto p-2 no-scrollbar space-y-1">
                      {outline.length > 0 ? (
                        (() => {
                          const filtered = outline.filter((item, idx) => {
                            if (selectedLevelFilter !== null) {
                              return item.level === selectedLevelFilter;
                            }
                            return isItemVisibleInTree(idx);
                          });

                          if (filtered.length === 0) {
                            return (
                              <div className="py-12 flex flex-col items-center justify-center text-slate-400 text-xs">
                                <p>未找到 H{selectedLevelFilter} 级别的标题</p>
                                <button 
                                  onClick={() => setSelectedLevelFilter(null)}
                                  className="mt-2 text-blue-500 underline text-[11px] cursor-pointer"
                                >
                                  查看全部标题
                                </button>
                              </div>
                            );
                          }

                          return filtered.map((item) => {
                            const originalIdx = outline.findIndex(o => o.id === item.id);
                            const itemHasChildren = originalIdx >= 0 ? hasSubHeadings(originalIdx) : false;
                            const isCollapsed = !!collapsedHeadings[item.id];
                            const isActive = activeHeadingId === item.id;
                            const subCount = (isCollapsed && originalIdx >= 0) ? getSubHeadingsCount(originalIdx) : 0;

                            return (
                              <div
                                key={item.id}
                                id={`outline-item-${item.id}`}
                                onClick={() => {
                                  if (item.pos !== undefined) {
                                    scrollToHeading(item.pos);
                                    setActiveHeadingId(item.id);
                                  }
                                }}
                                onDoubleClick={(e) => {
                                  if (itemHasChildren && selectedLevelFilter === null) {
                                    toggleCollapseHeading(item.id, e);
                                  }
                                }}
                                className={`w-full text-left py-1.5 px-2 rounded-lg text-xs transition-all cursor-pointer group flex items-center gap-1.5 select-none relative ${
                                  isActive
                                    ? 'bg-blue-50 text-blue-600 font-bold border-l-2 border-blue-600 shadow-xs dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-400'
                                    : 'text-[var(--text-primary)] hover:bg-white dark:hover:bg-slate-800/80 hover:shadow-xs border-l-2 border-transparent'
                                }`}
                                style={{ paddingLeft: selectedLevelFilter !== null ? '8px' : `${(item.level - 1) * 14 + 8}px` }}
                                title={itemHasChildren ? '点击箭头或双击可折叠/展开，单击可定位跳转' : '单击跳转'}
                              >
                                {/* Fold/Expand Toggle or Alignment Bullet */}
                                {itemHasChildren && selectedLevelFilter === null ? (
                                  <button
                                    onClick={(e) => toggleCollapseHeading(item.id, e)}
                                    className="p-0.5 hover:bg-slate-200/80 dark:hover:bg-slate-700 rounded text-slate-500 hover:text-slate-800 dark:hover:text-slate-100 transition-transform active:scale-90 shrink-0 cursor-pointer flex items-center justify-center"
                                    title={isCollapsed ? '展开子章节' : '折叠子章节'}
                                  >
                                    {isCollapsed ? (
                                      <ChevronRight size={13} className="text-slate-600 dark:text-slate-300" />
                                    ) : (
                                      <ChevronDown size={13} className="text-slate-600 dark:text-slate-300" />
                                    )}
                                  </button>
                                ) : (
                                  <span className="w-3.5 h-3.5 flex items-center justify-center text-[10px] font-mono text-slate-400/60 shrink-0">
                                    •
                                  </span>
                                )}

                                {/* Heading Level Badge */}
                                <span className={`text-[9px] font-mono px-1 py-0.2 rounded border shrink-0 ${
                                  isActive 
                                    ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/60 dark:text-blue-300 dark:border-blue-800 font-bold' 
                                    : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                                }`}>
                                  H{item.level}
                                </span>

                                {/* Text */}
                                <span className={`truncate flex-1 ${item.level === 1 ? 'font-semibold text-[12.5px]' : ''}`}>
                                  {item.text || '未命名标题'}
                                </span>

                                {/* Folded Subheadings Badge */}
                                {isCollapsed && subCount > 0 && (
                                  <span className="text-[9.5px] px-1.5 py-0.2 rounded-full bg-blue-100/90 text-blue-700 dark:bg-blue-900/80 dark:text-blue-300 font-mono font-bold shrink-0 shadow-2xs">
                                    +{subCount}
                                  </span>
                                )}

                                {/* Active Pulse Indicator */}
                                {isActive && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 shrink-0 animate-pulse ml-0.5" />
                                )}
                              </div>
                            );
                          });
                        })()
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-[var(--text-secondary)] py-20 opacity-50">
                          <List size={32} className="mb-2" />
                          <p className="text-xs">暂无大纲内容</p>
                        </div>
                      )}
                    </div>

                    {/* Document Heading Distribution Statistics Chart Component */}
                    <DocumentOutlineStats 
                      outline={outline}
                      selectedLevelFilter={selectedLevelFilter}
                      onSelectLevelFilter={setSelectedLevelFilter}
                      onScrollToHeading={(pos, id) => {
                        scrollToHeading(pos);
                        setActiveHeadingId(id);
                      }}
                    />
                  </div>
                ) : (
                  <div className="p-2 space-y-4">
                    <div className="p-2 bg-[var(--bg-primary)] rounded-xl border border-[var(--border)] shadow-sm">
                      <div className="flex items-center justify-between mb-3 px-1">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                          <Folder size={14} />
                          <span>资源管理器</span>
                        </div>
                        <div className="flex gap-1">
                          <button 
                            onClick={createNewFile}
                            title="新建空白文档"
                            className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-[var(--accent)] transition-colors"
                          >
                            <FilePlus size={14} />
                          </button>
                          <button 
                            onClick={openDirectory}
                            title="打开文件夹"
                            className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-[var(--accent)] transition-colors"
                          >
                            <Folder size={14} />
                          </button>
                          <button 
                            onClick={openAppFile}
                            title="打开外部文件"
                            className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-[var(--accent)] transition-colors"
                          >
                            <Upload size={14} />
                          </button>
                        </div>
                      </div>
                      <div className="space-y-1">
                        {/* Default current file */}
                        <button className="w-full flex items-center gap-3 p-2 rounded-lg bg-blue-50 text-[var(--accent)] text-sm font-medium">
                          <FileText size={16} />
                          <span className="truncate">{docName}</span>
                        </button>
                        
                        {/* Dynamically added resources */}
                        {resources.map((res, i) => (
                           <button 
                             key={i}
                             onClick={async () => {
                               if (res.type === 'file' && res.handle) {
                                 try {
                                   let content = '';
                                   if (res.handle instanceof File) {
                                     content = await res.handle.text();
                                     setCurrentFileHandle(null);
                                     setDocName(res.name);
                                   } else if (res.handle.getFile) {
                                     const file = await res.handle.getFile();
                                     content = await file.text();
                                     setCurrentFileHandle(res.handle);
                                     setDocName(res.name);
                                   }
                                   editor?.commands.setContent(content);
                                   showToast(`已切换至 ${res.name}`);
                                 } catch (err) {
                                   console.error('Failed to read file:', err);
                                   showToast('无法读取文件，请确保拥有访问权限');
                                 }
                               }
                             }}
                             className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 text-slate-600 text-sm"
                           >
                             {res.type === 'folder' ? <Folder size={16} className="text-amber-500" /> : <FileText size={16} className="text-slate-400" />}
                             <span className="truncate">{res.name}</span>
                            </button>
                        ))}
                      </div>
                    </div>

                    <div className="px-3">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">管理操作</p>
                      <div className="grid grid-cols-1 gap-2">
                         <button 
                           onClick={openDirectory}
                           className="flex items-center gap-2 p-2 rounded-lg border border-dashed border-slate-200 text-xs text-slate-500 hover:bg-slate-50 transition-colors"
                         >
                           <Folder size={14} />
                           打开本地工作空间
                         </button>
                         <button 
                           onClick={openAppFile}
                           className="flex items-center gap-2 p-2 rounded-lg border border-dashed border-slate-200 text-xs text-slate-500 hover:bg-slate-50 transition-colors"
                         >
                           <FileCode size={14} />
                           导入现有 Markdown
                         </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        <div 
          className={`flex-1 overflow-y-auto no-scrollbar scroll-smooth transition-all duration-300 ${isPresentation ? "fixed inset-0 z-[1000] bg-slate-900 flex flex-col overflow-hidden text-slate-100" : "bg-[var(--bg-secondary)]"}`} 
          id="editor-viewport"
        >
          {isPresentation ? (
            <div className="fixed inset-0 z-[1000] bg-slate-900 flex flex-col overflow-hidden text-slate-100">
              {/* PPT Top Header Bar */}
              <div className="h-16 flex justify-between items-center px-8 border-b border-slate-800 z-[1010] bg-slate-900/95 backdrop-blur-md sticky top-0 shadow-md shrink-0">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">PPT 放映模式</span>
                  </div>
                  <button
                    onClick={() => {
                      clearCanvas();
                      showToast('已一键清空屏幕标注');
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-red-500/20 text-slate-300 hover:text-red-400 border border-slate-700 transition-all text-xs font-medium cursor-pointer"
                    title="一键清空屏幕上的画笔与标注"
                  >
                    <Trash2 size={15} className="text-red-400" />
                    <span>一键清屏</span>
                  </button>
                </div>

                {/* Slide Navigation Controls */}
                <div className="flex items-center gap-3">
                  <button
                    disabled={validSlideIndex === 0}
                    onClick={() => setCurrentSlideIndex(prev => Math.max(0, prev - 1))}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-blue-600 text-slate-200 hover:text-white transition-all disabled:opacity-30 disabled:hover:bg-slate-800 disabled:hover:text-slate-200 cursor-pointer flex items-center gap-1 font-medium text-xs border border-slate-700"
                  >
                    <ChevronLeft size={16} />
                    上一页
                  </button>

                  <div className="px-4 py-1.5 bg-slate-800/90 rounded-xl border border-slate-700 text-xs font-mono font-bold text-blue-400 flex items-center gap-1.5">
                    <span>{validSlideIndex + 1}</span>
                    <span className="text-slate-500">/</span>
                    <span>{slides.length}</span>
                  </div>

                  <button
                    disabled={validSlideIndex >= slides.length - 1}
                    onClick={() => setCurrentSlideIndex(prev => Math.min(slides.length - 1, prev + 1))}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-blue-600 text-slate-200 hover:text-white transition-all disabled:opacity-30 disabled:hover:bg-slate-800 disabled:hover:text-slate-200 cursor-pointer flex items-center gap-1 font-medium text-xs border border-slate-700"
                  >
                    下一页
                    <ChevronRight size={16} />
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={togglePresentation} 
                    className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-all cursor-pointer text-xs shadow-lg shadow-red-500/20 active:scale-95"
                  >
                    <Maximize2 size={16} className="rotate-45" />
                    退出放映
                  </button>
                </div>
              </div>

              {/* Slide Content Viewport (Near Full-Screen Display with Direct In-Place Editing) */}
              <div className="flex-1 flex flex-col items-center justify-center p-2 sm:p-3 md:p-4 overflow-hidden relative">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={validSlideIndex}
                    initial={{ opacity: 0, scale: 0.98, x: 20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.98, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="w-full h-full max-w-none max-h-[94vh] bg-[var(--bg-primary)] text-[var(--text-primary)] rounded-2xl md:rounded-3xl p-6 md:p-12 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] border border-slate-700/50 flex flex-col overflow-y-auto no-scrollbar relative select-text transition-all"
                  >
                    {/* Active Editable Slide Content - Directly editable without extra toolbars */}
                    <div className={`flex-1 w-full overflow-y-auto no-scrollbar py-2 flex flex-col justify-center transition-all duration-300 ${getSlideDensityClass()}`}>
                      <EditorContent editor={slideEditor} />
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Bottom Keyboard Shortcut Hint */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-1.5 bg-slate-800/90 backdrop-blur-md rounded-full border border-slate-700/80 text-[11px] text-slate-400 pointer-events-none z-10 shadow-lg">
                  <span>键盘方向键 <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-slate-200 font-mono text-[10px]">←</kbd> <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-slate-200 font-mono text-[10px]">→</kbd> 或 <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-slate-200 font-mono text-[10px]">PageUp/PageDown</kbd> 切换幻灯片页（可在放映中直接编辑文本）</span>
                </div>
              </div>
            </div>
          ) : (
            <div 
              className="transition-all duration-300 relative mx-auto w-full max-w-4xl min-h-screen my-10 px-12 py-16 bg-[var(--bg-primary)] shadow-[0_20px_50px_rgba(0,0,0,0.05)] rounded-2xl border border-[var(--border)] group"
              style={{ zoom: zoom }}
            >
              <div className="absolute top-6 right-8 flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                {(() => {
                  const count = editor?.storage.characterCount?.characters() || 0;
                  const isExceeded = count > 5000;
                  return (
                    <span className={`text-[10px] font-mono tracking-wider px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1.5 ${
                      isExceeded 
                        ? 'bg-red-50 text-red-600 border-red-300 dark:bg-red-950/60 dark:text-red-400 dark:border-red-800 font-bold' 
                        : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border)]'
                    }`}>
                      {isExceeded && <AlertCircle size={12} className="text-red-500 animate-pulse" />}
                      <span>{count.toLocaleString()} 字符</span>
                      {isExceeded && <span className="text-[9px] font-sans text-red-500 font-bold">(已超5000字上限)</span>}
                    </span>
                  );
                })()}
              </div>
              
              <div className="w-full">
                <EditorContent editor={editor} />
              </div>

              <div className="fixed bottom-16 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-[var(--bg-primary)] p-2 rounded-2xl shadow-2xl border border-[var(--border)] z-30 opacity-0 group-hover:opacity-100 transition-opacity">
                <QuickTool icon={<Undo size={14}/>} onClick={() => applyStyle('undo')} title="撤销 (Ctrl+Z)" disabled={!editor?.can().undo()} />
                <QuickTool icon={<Redo size={14}/>} onClick={() => applyStyle('redo')} title="重做 (Ctrl+Y)" disabled={!editor?.can().redo()} />
                <QuickTool icon={<Wand2 size={14} className="text-indigo-500 hover:rotate-12 transition-transform"/>} onClick={handleSmartFormat} title="一键智能排版 (自动优化中英文空格、消除多余空行与规范标点)" />
                <div className="w-px h-4 bg-[var(--border)] mx-1" />
                <QuickTool icon={<Heading1 size={14}/>} onClick={() => applyStyle('heading', 1)} title="一级标题" isActive={editor?.isActive('heading', { level: 1 })} />
                <QuickTool icon={<Heading2 size={14}/>} onClick={() => applyStyle('heading', 2)} title="二级标题" isActive={editor?.isActive('heading', { level: 2 })} />
                <QuickTool icon={<Bold size={14}/>} onClick={() => applyStyle('bold')} title="加粗" isActive={editor?.isActive('bold')} />
                <QuickTool icon={<Italic size={14}/>} onClick={() => applyStyle('italic')} title="斜体" isActive={editor?.isActive('italic')} />
                
                {/* Text Highlighting Quick Tool */}
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowHighlightPopover(!showHighlightPopover);
                    }}
                    className={`p-1.5 rounded-xl flex items-center gap-1 transition-all cursor-pointer ${
                      showHighlightPopover || editor?.isActive('highlight')
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 font-bold border border-amber-300/80'
                        : 'hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                    title="文本高亮调色盘 (Ctrl+Shift+H)"
                  >
                    <Highlighter size={14} />
                    <span 
                      className="w-2 h-2 rounded-full border border-black/10 shrink-0 shadow-2xs" 
                      style={{ backgroundColor: lastHighlightColor }} 
                    />
                  </button>

                  {showHighlightPopover && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-50">
                      <HighlightPopover
                        editor={editor}
                        currentColor={lastHighlightColor}
                        onApplyHighlight={(color) => {
                          applyStyle('highlight', color);
                          setLastHighlightColor(color);
                          setShowHighlightPopover(false);
                        }}
                        onClearHighlight={() => {
                          applyStyle('highlight', 'unset');
                          setShowHighlightPopover(false);
                        }}
                        onClose={() => setShowHighlightPopover(false)}
                      />
                    </div>
                  )}
                </div>

                <QuickTool icon={<List size={14}/>} onClick={() => applyStyle('bullet')} title="无序列表" isActive={editor?.isActive('bulletList')} />
                <QuickTool icon={<ListTodo size={14}/>} onClick={() => applyStyle('task')} title="任务清单" isActive={editor?.isActive('taskList')} />
                <QuickTool icon={<Quote size={14}/>} onClick={() => applyStyle('quote')} title="引用" isActive={editor?.isActive('blockquote')} />
                <div className="w-px h-4 bg-[var(--border)] mx-1" />
                <QuickTool icon={<AlignCenter size={14}/>} onClick={() => applyStyle('align', 'center')} title="居中对齐" />
                <QuickTool icon={<AlignLeft size={14}/>} onClick={() => applyStyle('align', 'left')} title="左对齐" />
                <div className="w-px h-4 bg-[var(--border)] mx-1" />
                <QuickTool icon={<SuperscriptIcon size={14}/>} onClick={() => {
                   //@ts-ignore
                   editor?.chain().focus().setInlineMath({ latex: 'x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}' }).run();
                }} title="插入公式" />
                <QuickTool icon={<VideoIcon size={14}/>} onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'video/*';
                  input.onchange = handleVideoUpload as any;
                  input.click();
                }} title="插入视频" />
              </div>
            </div>
          )}

          {isPresentation && (
             <>
               {/* Laser Pointer Red Dot Indicator */}
               {presentTool === 'laser' && laserPos.visible && (
                 <div 
                   className="fixed pointer-events-none z-[1008] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center transition-opacity duration-150"
                   style={{ left: `${laserPos.x}px`, top: `${laserPos.y}px` }}
                 >
                   {/* Outer Breathing Light Halo */}
                   <div className="absolute w-8 h-8 rounded-full bg-red-500/30 laser-dot-breath" />
                   {/* Middle High-Intensity Red Ring */}
                   <div className="w-4 h-4 rounded-full bg-red-500 shadow-[0_0_12px_#ef4444,0_0_24px_#f43f5e] flex items-center justify-center">
                     {/* Core Diode Hotspot */}
                     <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_4px_#ffffff]" />
                   </div>
                 </div>
               )}

               {/* Annotation Canvas (Middle) - Full screen pointer events */}
               <canvas
                 ref={canvasRef}
                 style={{ width: '100%', height: '100%' }}
                 className={`fixed inset-0 z-[1005] ${presentTool === 'select' ? 'pointer-events-none' : presentTool === 'laser' ? 'cursor-none' : 'cursor-crosshair'}`}
                 onMouseDown={startDrawing}
                 onMouseMove={draw}
                 onMouseUp={stopDrawing}
                 onMouseEnter={(e) => {
                   if (presentTool === 'laser') {
                     setLaserPos({ x: e.clientX, y: e.clientY, visible: true });
                   }
                 }}
                 onMouseLeave={() => {
                   if (presentTool === 'laser') {
                     setLaserPos(prev => ({ ...prev, visible: false }));
                   } else {
                     stopDrawing();
                   }
                 }}
                 onTouchStart={startDrawing}
                 onTouchMove={draw}
                 onTouchEnd={() => {
                   if (presentTool === 'laser') {
                     setLaserPos(prev => ({ ...prev, visible: false }));
                   } else {
                     stopDrawing();
                   }
                 }}
               />

               {/* Draggable Timer Window (Top-most) */}
               {showTimer && (
                  <motion.div 
                    drag
                    dragMomentum={false}
                    initial={{ x: 32, y: 32 }}
                    style={{ transform: `scale(${timerScale})`, transformOrigin: 'top left' }}
                    className="fixed z-[1060] bg-white/95 backdrop-blur-md p-6 rounded-[32px] shadow-[0_25px_50px_rgba(0,0,0,0.25)] border border-slate-200 flex flex-col items-center gap-4 cursor-move min-w-[260px] select-none"
                  >
                    <div className="flex items-center justify-between w-full border-b border-slate-100 pb-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                        {isCountdownMode ? '倒计时 COUNTDOWN' : '秒表 STOPWATCH'}
                      </span>
                      {/* Scale / Zoom controls for Floating Timer */}
                      <div className="flex items-center gap-1 bg-slate-100 rounded-lg px-1.5 py-0.5">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setTimerScale(s => Math.max(0.5, Number((s - 0.1).toFixed(1)))); }}
                          title="缩小倒计时"
                          className="p-1 hover:bg-white rounded text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                        >
                          <ZoomOut size={14} />
                        </button>
                        <span className="text-[10px] font-mono font-bold text-slate-600 px-1">
                          {Math.round(timerScale * 100)}%
                        </span>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setTimerScale(s => Math.min(2.5, Number((s + 0.1).toFixed(1)))); }}
                          title="放大倒计时"
                          className="p-1 hover:bg-white rounded text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                        >
                          <ZoomIn size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col items-center py-2">
                      <span className={`text-6xl font-mono font-bold tracking-tighter leading-none ${isCountdownMode && timerTime < 11 ? 'text-red-500 animate-pulse' : 'text-slate-900'}`}>
                        {formatTime(timerTime)}
                      </span>
                    </div>

                    <div className="flex gap-3 w-full justify-center pt-3 border-t border-slate-100">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setIsTimerActive(!isTimerActive); }}
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isTimerActive ? 'bg-slate-100 text-slate-400 hover:bg-slate-200' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'}`}
                      >
                        {isTimerActive ? <div className="w-4 h-4 bg-current rounded-xs" /> : <div className="w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-l-[14px] border-l-current ml-0.5" />}
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); stopTimer(); }}
                        className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center hover:bg-red-100 transition-all"
                      >
                        <RefreshCcw size={20} />
                      </button>
                      <button 
                        onClick={() => setShowTimer(false)}
                        className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center hover:bg-slate-100 transition-all"
                      >
                        <Maximize2 size={20} className="rotate-45" />
                      </button>
                    </div>
                  </motion.div>
               )}

               {/* Presentation Sidebar Toolkit */}
               <div className="pres-toolbar fixed right-8 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-[1020]">
                <div className="bg-[var(--bg-primary)]/90 backdrop-blur-xl p-2 rounded-2xl shadow-2xl border border-[var(--border)] flex flex-col gap-2">
                  <PresToolBtn active={presentTool === 'select'} onClick={() => setPresentTool('select')} icon={<MousePointer2 size={20} />} label="选择编辑" />
                  <PresToolBtn active={presentTool === 'laser'} onClick={() => setPresentTool('laser')} icon={<Target size={20} className={presentTool === 'laser' ? "text-red-500" : ""} />} label="激光笔" />
                  <PresToolBtn active={presentTool === 'pen'} onClick={() => setPresentTool('pen')} icon={<Pencil size={20} />} label="画笔工具" />
                  <PresToolBtn active={presentTool === 'eraser'} onClick={() => setPresentTool('eraser')} icon={<Eraser size={20} />} label="橡皮擦" />
                  <div className="h-px bg-[var(--border)] mx-2 my-1" />
                  <div className="flex flex-col gap-2 items-center py-2">
                    {[3, 6, 12].map(size => (
                      <button key={size} onClick={() => setPresentSize(size)} className={`w-6 h-6 rounded-lg border transition-all flex items-center justify-center ${presentSize === size ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-slate-100 text-slate-400'}`}>
                        <div className="bg-current rounded-full" style={{ width: size, height: size }} />
                      </button>
                    ))}
                  </div>
                  <div className="h-px bg-[var(--border)] mx-2 my-1" />
                  <div className="flex flex-col gap-2 items-center py-2">
                    {['#ef4444', '#22c55e', '#3b82f6', '#1e293b'].map(color => (
                      <button key={color} onClick={() => { setPresentColor(color); setPresentTool('pen'); }} className={`w-4 h-4 rounded-full border-2 transition-transform hover:scale-125 ${presentColor === color ? 'border-white ring-2 ring-blue-400' : 'border-transparent'}`} style={{ backgroundColor: color }} />
                    ))}
                  </div>
                  <div className="h-px bg-[var(--border)] mx-2 my-1" />
                  <PresToolBtn active={showCountdownModal} onClick={() => setShowCountdownModal(true)} icon={<Timer size={20} />} label="设置倒计时" />
                  {!isCountdownMode && <PresToolBtn active={showTimer} onClick={() => setShowTimer(!showTimer)} icon={<Timer size={20} className="opacity-50" />} label="显示时长" />}
                  <PresToolBtn active={showStudentPickerModal} onClick={() => setShowStudentPickerModal(true)} icon={<UserCheck size={20} className="text-amber-500 hover:scale-110 transition-transform" />} label="随机点名 (转盘)" />
                  <PresToolBtn 
                    active={false} 
                    onClick={() => {
                      clearCanvas();
                      showToast('已一键清空屏幕标注');
                    }} 
                    icon={<Trash2 size={20} className="text-red-500 hover:text-red-600" />} 
                    label="一键清屏" 
                  />
                </div>
               </div>
             </>
          )}
        </div>

        {/* 缩放浮动按钮 */}
        <div className="fixed bottom-16 right-6 flex flex-col gap-2 z-20">
          <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} title="放大" className="p-3 bg-[var(--bg-primary)] border border-[var(--border)] rounded-full shadow-lg hover:text-[var(--accent)] hover:-translate-y-1 transition-all cursor-pointer"><ZoomIn size={20} /></button>
          <button onClick={() => setZoom(z => Math.max(0.2, z - 0.1))} title="缩小" className="p-3 bg-[var(--bg-primary)] border border-[var(--border)] rounded-full shadow-lg hover:text-[var(--accent)] hover:translate-y-1 transition-all cursor-pointer"><ZoomOut size={20} /></button>
        </div>
        {/* AI Chat Sidebar */}
        <AnimatePresence>
          {showAIChat && (
            <AIChat editor={editor} onClose={() => setShowAIChat(false)} />
          )}
        </AnimatePresence>
      </main>

      {/* --- Bottom Real-Time Status Bar --- */}
      {!isPresentation && (
        <footer className="h-10 px-6 bg-[var(--bg-primary)] border-t border-[var(--border)] flex items-center justify-between z-40 text-xs shrink-0 select-none shadow-xs">
          {/* Left Metadata Status */}
          <div className="flex items-center gap-4 text-[var(--text-secondary)]">
            <div className="flex items-center gap-1.5" title="文档更改已本地实时保存">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-medium text-[11px]">已实时保存</span>
            </div>
            <span className="text-[var(--border)]">|</span>
            <div className="flex items-center gap-1 text-[11px]">
              <span>预计阅读时间:</span>
              <span className="font-mono font-bold text-[var(--text-primary)]">
                {Math.max(1, Math.ceil((editor?.storage.characterCount?.words() || 0) / 250))} 分钟
              </span>
            </div>
            <span className="text-[var(--border)] hidden sm:inline">|</span>
            <div className="hidden sm:flex items-center gap-1 text-[11px]">
              <span>画布比例:</span>
              <span className="font-mono font-bold">{Math.round(zoom * 100)}%</span>
            </div>
          </div>

          {/* Right Real-time Character & Word Counter Component with 5000 Threshold Warning */}
          <div className="flex items-center gap-3">
            {(() => {
              const characters = editor?.storage.characterCount?.characters() || 0;
              const words = editor?.storage.characterCount?.words() || 0;
              const THRESHOLD = 5000;
              const isExceeded = characters > THRESHOLD;
              const percentage = Math.min(100, Math.round((characters / THRESHOLD) * 100));

              return (
                <div 
                  className={`flex items-center gap-2.5 px-3 py-1 rounded-xl border text-xs transition-all font-mono ${
                    isExceeded 
                      ? 'bg-red-50 text-red-600 border-red-300 dark:bg-red-950/50 dark:text-red-400 dark:border-red-800 font-bold shadow-sm' 
                      : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border)]'
                  }`}
                  title={isExceeded ? `字符数（${characters.toLocaleString()}）已超过 5,000 字建议上限！` : `当前写作用量：${percentage}%`}
                >
                  {isExceeded ? (
                    <AlertCircle size={14} className="text-red-500 shrink-0 animate-pulse" />
                  ) : (
                    <Type size={14} className="text-slate-400 shrink-0" />
                  )}

                  <div className="flex items-center gap-1.5">
                    <span className={isExceeded ? 'text-red-600 dark:text-red-400 font-extrabold' : 'text-[var(--text-primary)] font-bold'}>
                      {characters.toLocaleString()}
                    </span>
                    <span className="text-[10px] opacity-60 font-sans">/ 5,000 字符</span>
                    <span className="opacity-30">|</span>
                    <span className="text-[11px]">
                      {words.toLocaleString()} <span className="text-[10px] opacity-60 font-sans">词</span>
                    </span>
                  </div>

                  {/* Progress Indicator */}
                  <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden shrink-0 ml-1 hidden sm:block">
                    <div 
                      className={`h-full transition-all duration-300 ${isExceeded ? 'bg-red-500 animate-pulse' : percentage > 80 ? 'bg-amber-500' : 'bg-blue-500'}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  {/* Red Alert Pill */}
                  {isExceeded && (
                    <span className="text-[10px] font-sans bg-red-100 dark:bg-red-900/70 text-red-600 dark:text-red-300 px-1.5 py-0.5 rounded-md font-bold ml-0.5">
                      字数超出上限
                    </span>
                  )}
                </div>
              );
            })()}
          </div>
        </footer>
      )}

      {/* --- Floating Selection Toolbar --- */}
      <AnimatePresence>
        {selection.visible && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            style={{ top: selection.top, left: selection.left }}
            className="absolute -translate-x-1/2 p-2 bg-white shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] border border-gray-200 rounded-xl flex items-center gap-1 z-50 text-gray-700 backdrop-blur-md"
          >
                <div className="flex items-center gap-0.5 px-1 bg-gray-50 rounded-lg border border-gray-100">
                   <FloatingBtn onClick={() => applyStyle('heading', 1)} icon={<Heading1 size={16}/>} label="一阶标题" />
                   <FloatingBtn onClick={() => applyStyle('heading', 2)} icon={<Heading2 size={16}/>} label="二阶标题" />
                   <FloatingBtn onClick={() => applyStyle('bold')} icon={<Bold size={16}/>} label="加粗" />
                   <FloatingBtn onClick={() => applyStyle('italic')} icon={<Italic size={16}/>} label="斜体" />
                   
                   <div className="relative">
                     <FloatingBtn 
                       onClick={(e) => {
                         e.stopPropagation();
                         setShowSelectionHighlightPopover(!showSelectionHighlightPopover);
                       }} 
                       icon={
                         <div className="flex items-center gap-1">
                           <Highlighter size={15} />
                           <span className="w-2 h-2 rounded-full border border-gray-300 shrink-0 shadow-2xs" style={{ backgroundColor: lastHighlightColor }} />
                         </div>
                       } 
                       label="高亮调色" 
                     />
                     {showSelectionHighlightPopover && (
                       <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50">
                         <HighlightPopover
                           editor={editor}
                           currentColor={lastHighlightColor}
                           onApplyHighlight={(color) => {
                             applyStyle('highlight', color);
                             setLastHighlightColor(color);
                             setShowSelectionHighlightPopover(false);
                           }}
                           onClearHighlight={() => {
                             applyStyle('highlight', 'unset');
                             setShowSelectionHighlightPopover(false);
                           }}
                           onClose={() => setShowSelectionHighlightPopover(false)}
                         />
                       </div>
                     )}
                   </div>
                   <FloatingBtn onClick={() => {
                     if (editor) {
                       const { from, to } = editor.state.selection;
                       const text = editor.state.doc.textBetween(from, to);
                       //@ts-ignore
                       editor.chain().focus().setInlineMath({ latex: text || 'x' }).run();
                     }
                   }} icon={<SuperscriptIcon size={16}/>} label="数学公式" />
                   <FloatingBtn onClick={() => applyStyle('superscript')} icon={<SuperscriptIcon size={16}/>} label="上标" />
               <FloatingBtn onClick={() => applyStyle('subscript')} icon={<SubscriptIcon size={16}/>} label="下标" />
               <div className="relative group/size flex items-center">
                  <FloatingBtn onClick={() => {}} icon={<Type size={16}/>} label="字号" />
                  <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl hidden group-hover/size:flex flex-col p-1 z-50">
                     {[12, 14, 16, 18, 20, 24, 32].map(size => (
                       <button 
                         key={size} 
                         onClick={() => applyStyle('size', `${size}px`)}
                         className="px-3 py-1 text-xs hover:bg-gray-100 rounded text-left whitespace-nowrap"
                       >
                         {size}px
                       </button>
                     ))}
                  </div>
               </div>
            </div>
            <div className="w-px h-5 bg-gray-200 mx-1" />
            <div className="flex items-center gap-1 px-1">
              {PRESET_COLORS.map(c => (
                <button
                  key={c.value}
                  onClick={() => applyStyle('color', c.value)}
                  className="w-4 h-4 rounded-full border border-gray-200 hover:scale-125 transition-transform cursor-pointer"
                  style={{ backgroundColor: c.value }}
                  title={c.name}
                />
              ))}
            </div>
            <div className="w-px h-5 bg-gray-200 mx-1" />
            <div className="flex items-center gap-0.5">
              <FloatingBtn onClick={() => applyStyle('align', 'center')} icon={<AlignCenter size={16} />} label="居中" />
              <FloatingBtn onClick={() => applyStyle('align', 'left')} icon={<AlignLeft size={16} />} label="左对齐" />
            </div>
            <div className="w-px h-5 bg-gray-200 mx-1" />
            <FloatingBtn onClick={() => applyStyle('clear')} icon={<Trash2 size={16} className="text-gray-400" />} label="清除" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Image Cropper & Filters Modal --- */}
      <ImageCropperModal
        imageSrc={cropImage}
        onClose={() => setCropImage(null)}
        onConfirm={(processedBase64) => {
          if (editor) {
            editor.chain().focus().setImage({ src: processedBase64 }).run();
          }
          setCropImage(null);
        }}
      />


      
      {/* Hidden inputs */}
      {/* Help Modal */}
      <AnimatePresence>
        {showHelpModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[300] flex items-center justify-center p-8 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden flex flex-col shadow-2xl border border-slate-200"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 text-[var(--accent)] rounded-xl">
                    <HelpCircle size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">帮助与指南</h3>
                    <p className="text-xs text-slate-500">掌握 FluxMark 核心功能与高效创作技巧</p>
                  </div>
                </div>
                <button onClick={() => setShowHelpModal(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                  <Maximize2 size={20} className="rotate-45 text-slate-400" />
                </button>
              </div>

              {/* Sub-Header Navigation Tabs */}
              <div className="px-8 pt-4 pb-2 bg-slate-50/30 border-b border-slate-100 flex gap-2">
                <button
                  onClick={() => setHelpTab('tutorial')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    helpTab === 'tutorial'
                      ? 'bg-[var(--accent)] text-white shadow-md shadow-blue-200'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <BookOpen size={15} />
                  新手教程
                </button>
                <button
                  onClick={() => setHelpTab('shortcuts')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    helpTab === 'shortcuts'
                      ? 'bg-[var(--accent)] text-white shadow-md shadow-blue-200'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <Keyboard size={15} />
                  快捷键说明
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-8 max-h-[60vh] overflow-y-auto no-scrollbar">
                {helpTab === 'tutorial' ? (
                  <div className="space-y-6 text-slate-700">
                    {/* Welcome Banner */}
                    <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-100 flex items-start gap-3">
                      <div className="p-2 bg-blue-500 text-white rounded-lg shrink-0 mt-0.5">
                        <BookOpen size={18} />
                      </div>
                      <div className="text-xs leading-relaxed">
                        <span className="font-bold text-blue-900 block text-sm mb-1">欢迎使用 FluxMark 智能 Markdown 编辑器</span>
                        FluxMark 是一款兼具沉浸创作、AI 辅助写作、实时可视化与演示放映功能的现代编辑器。下文将帮您迅速熟悉核心操作！
                      </div>
                    </div>

                    {/* Tutorial Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Step 1 */}
                      <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-blue-200 hover:shadow-sm transition-all space-y-2">
                        <div className="flex items-center gap-2 text-blue-600 font-bold text-sm">
                          <Type size={16} />
                          <span>1. 文本排版与格式化</span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          直接输入标准的 Markdown 语法（如 <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-700"># 标题</code> 或 <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-700">- 列表</code>），或在编辑区中<b>选中文本</b>，即可唤起快捷排版工具栏一键加粗、插入高亮、代码块或公式。
                        </p>
                      </div>

                      {/* Step 2 */}
                      <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-blue-200 hover:shadow-sm transition-all space-y-2">
                        <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                          <ImageIcon size={16} />
                          <span>2. 多媒体与公式嵌入</span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          您可以将图片或视频<b>拖拽/粘贴</b>到编辑窗口。选中图片可在线裁剪；工具栏还支持插入 KateX 数学公式 <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-700">$E=mc^2$</code>。
                        </p>
                      </div>

                      {/* Step 3 */}
                      <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-blue-200 hover:shadow-sm transition-all space-y-2">
                        <div className="flex items-center gap-2 text-purple-600 font-bold text-sm">
                          <SparklesIcon size={16} />
                          <span>3. AI 智能对话与续写</span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          点击右上角的 <b>AI 按钮</b>，可以对选中文本进行润色、总结、翻译或生成新段落。您也可以像与助手聊天一样随时对文章提问。
                        </p>
                      </div>

                      {/* Step 4 */}
                      <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-blue-200 hover:shadow-sm transition-all space-y-2">
                        <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                          <Monitor size={16} />
                          <span>4. 全屏放映与标注</span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          点击顶部<b>放映图标</b>将文档转换为全屏幻灯片展示！悬浮工具栏提供画笔圈画、橡皮擦、激光笔效果以及会议倒计时功能。
                        </p>
                      </div>
                    </div>

                    {/* Pro-Tips footer */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                      <span>💡 小提示：按 <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded font-mono text-[10px] text-slate-600">Ctrl + /</kbd> 也可快速随时打开本帮助中心。</span>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Type size={14} /> 文本与格式排版
                      </h4>
                      <div className="space-y-2.5">
                        <ShortcutRow label="文本加粗" keys={['Ctrl', 'B']} />
                        <ShortcutRow label="文本斜体" keys={['Ctrl', 'I']} />
                        <ShortcutRow label="文本高亮" keys={['Ctrl', 'Shift', 'H']} />
                        <ShortcutRow label="一级 / 二级标题" keys={['Ctrl', 'Alt', '1 / 2']} />
                        <ShortcutRow label="无序列表" keys={['Ctrl', 'Shift', '8']} />
                        <ShortcutRow label="有序列表" keys={['Ctrl', 'Shift', '7']} />
                        <ShortcutRow label="任务清单 (待办)" keys={['Ctrl', 'Shift', '9']} />
                        <ShortcutRow label="块引用" keys={['Ctrl', 'Shift', 'B']} />
                        <ShortcutRow label="行内代码" keys={['Ctrl', 'E']} />
                        <ShortcutRow label="代码块" keys={['Ctrl', 'Alt', 'C']} />
                        <ShortcutRow label="标题补全建议" keys={['#', 'Space']} />
                        <ShortcutRow label="Emoji 表情选择" keys={[':']} />
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Layout size={14} /> 系统功能与辅助工具
                      </h4>
                      <div className="space-y-2.5">
                        <ShortcutRow label="保存文档" keys={['Ctrl', 'S']} />
                        <ShortcutRow label="另存为" keys={['Ctrl', 'Shift', 'S']} />
                        <ShortcutRow label="新建空白文档" keys={['Ctrl', 'Alt', 'N']} />
                        <ShortcutRow label="打开本地文件" keys={['Ctrl', 'O']} />
                        <ShortcutRow label="撤销操作" keys={['Ctrl', 'Z']} />
                        <ShortcutRow label="重做操作" keys={['Ctrl', 'Y']} />
                        <ShortcutRow label="一键智能排版" keys={['悬浮栏 ✨']} />
                        <ShortcutRow label="AI 智能助手" keys={['点击 AI 图标']} />
                        <ShortcutRow label="帮助中心" keys={['Ctrl', '/']} />
                        <ShortcutRow label="全屏放映演示" keys={['F11']} />
                        <ShortcutRow label="随机点名转盘" keys={['放映栏 🎯']} />
                        <ShortcutRow label="放映倒计时" keys={['放映栏 ⏱️']} />
                        <div className="pt-3 mt-3 border-t border-slate-100">
                          <p className="text-xs text-slate-500 leading-relaxed">
                            <span className="font-bold text-[var(--accent)]">💡 技巧：</span>选中文本唤起悬浮工具栏可即时使用“一键智能排版”自动修正空格与列表，放映模式下提供画笔圈画与转盘互动功能。
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button 
                  onClick={() => setShowHelpModal(false)}
                  className="px-8 py-3 bg-[var(--accent)] text-white font-bold rounded-xl shadow-lg hover:bg-blue-600 transition-all active:scale-95"
                >
                  我知道了
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Countdown Timer Modal --- */}
      <AnimatePresence>
        {showCountdownModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[2000] flex items-center justify-center p-8 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              style={{ transform: `scale(${countdownModalScale})` }}
              className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl flex flex-col gap-5 border border-slate-100 select-none transition-transform"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                    <Timer size={22} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">设置倒计时</h3>
                    <p className="text-[11px] text-slate-400">选择放映倒计时时长</p>
                  </div>
                </div>

                {/* Resizing / Zoom In and Out for Countdown Settings Modal */}
                <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
                  <button
                    onClick={() => setCountdownModalScale(s => Math.max(0.6, Number((s - 0.1).toFixed(1))))}
                    title="缩小弹窗"
                    className="p-1 hover:bg-white rounded-lg text-slate-600 transition-colors cursor-pointer"
                  >
                    <ZoomOut size={14} />
                  </button>
                  <span className="text-[10px] font-mono font-bold text-slate-600 px-1">
                    {Math.round(countdownModalScale * 100)}%
                  </span>
                  <button
                    onClick={() => setCountdownModalScale(s => Math.min(2.0, Number((s + 0.1).toFixed(1))))}
                    title="放大弹窗"
                    className="p-1 hover:bg-white rounded-lg text-slate-600 transition-colors cursor-pointer"
                  >
                    <ZoomIn size={14} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {[1, 3, 5, 10, 15, 30].map(mins => (
                  <button 
                    key={mins}
                    onClick={() => startCountdown(mins)}
                    className="py-3 bg-slate-50 hover:bg-blue-50 hover:text-blue-600 border border-slate-200 hover:border-blue-200 rounded-2xl font-bold transition-all text-slate-600 text-sm cursor-pointer"
                  >
                    {mins} 分钟
                  </button>
                ))}
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button 
                  onClick={() => setShowCountdownModal(false)}
                  className="flex-1 py-2.5 text-slate-400 font-bold hover:text-slate-600 transition-colors text-xs cursor-pointer"
                >
                  取消
                </button>
                <button 
                  onClick={() => {
                   const val = prompt('输入自定义分钟数：');
                   if (val && !isNaN(Number(val))) startCountdown(Number(val));
                  }}
                  className="flex-1 py-2.5 bg-[var(--accent)] text-white font-bold rounded-xl shadow-md hover:opacity-90 transition-all text-xs cursor-pointer"
                >
                  自定义
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Student Picker Turntable Modal --- */}
      <StudentPickerModal 
        isOpen={showStudentPickerModal} 
        onClose={() => setShowStudentPickerModal(false)} 
      />

      {/* --- Confirmation Modal --- */}
      <AnimatePresence>
        {confirmModal?.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs z-[2000] flex items-center justify-center p-4"
            onClick={() => setConfirmModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3 text-amber-500">
                <AlertCircle size={24} />
                <h3 className="font-bold text-base text-[var(--text-primary)]">{confirmModal.title}</h3>
              </div>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                {confirmModal.message}
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setConfirmModal(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-500 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    const cb = confirmModal.onConfirm;
                    setConfirmModal(null);
                    cb();
                  }}
                  className="px-4 py-2 text-xs font-medium bg-[var(--accent)] text-white rounded-lg shadow-sm hover:opacity-90 transition-all cursor-pointer"
                >
                  {confirmModal.confirmText || '确定'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Toast Notification --- */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 z-[2100] border border-slate-700"
          >
            <Check size={14} className="text-emerald-400" />
            <span>{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <input type="file" ref={fileInputRef} className="hidden" accept=".md,.markdown,.txt" onChange={handleOpenFile} />
      <input type="file" ref={directoryInputRef} className="hidden" {...({ webkitdirectory: 'true' } as any)} onChange={handleDirectoryOpen} />
    </div>
  );
}

// --- Helper Sub-components ---

function QuickTool({ icon, onClick, title, isActive, disabled }: { icon: React.ReactNode, onClick: () => void, title?: string, isActive?: boolean, disabled?: boolean }) {
  return (
    <button 
      onClick={onClick} 
      title={title} 
      disabled={disabled}
      className={`p-1.5 rounded-lg transition-all ${
        disabled
          ? 'opacity-35 cursor-not-allowed text-[var(--text-secondary)]'
          : isActive 
            ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold border border-blue-300/80 shadow-2xs cursor-pointer' 
            : 'hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--accent)] cursor-pointer'
      }`}
    >
      {icon}
    </button>
  );
}

function ToolbarGroup({ label, children, alignRight = false }: { label: string, children: React.ReactNode, alignRight?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const clickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', clickOutside);
    return () => document.removeEventListener('mousedown', clickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-1.5 hover:bg-[var(--bg-secondary)] rounded-lg text-sm text-[var(--text-secondary)] font-medium transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap"
      >
        {label}
        <ChevronRight size={14} className={`transition-transform ${isOpen ? 'rotate-90' : ''}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className={`absolute top-full mt-2 bg-[var(--bg-primary)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-y-auto max-h-[85vh] py-1.5 z-50 p-1.5 font-sans min-w-max whitespace-nowrap ${
              alignRight ? 'right-0 left-auto' : 'left-0'
            }`}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ToolbarItem({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="w-full text-left px-3.5 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded-xl flex items-center gap-3 transition-colors cursor-pointer group whitespace-nowrap min-w-max"
    >
      <span className="text-[var(--text-secondary)] group-hover:text-[var(--accent)] shrink-0">{icon}</span>
      <span className="whitespace-nowrap font-medium flex-1">{label}</span>
    </button>
  );
}

function ThemeButton({ active, icon, onClick, title }: { active: boolean, icon: React.ReactNode, onClick: () => void, title?: string }) {
  return (
    <button 
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded-md transition-all cursor-pointer ${active ? 'bg-[var(--bg-primary)] shadow-sm text-[var(--accent)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
    >
      {icon}
    </button>
  );
}

function ShortcutRow({ label, keys }: { label: string, keys: string[] }) {
  return (
    <div className="flex items-center justify-between group">
      <span className="text-sm text-slate-600 font-medium">{label}</span>
      <div className="flex gap-1">
        {keys.map((k, i) => (
          <kbd key={i} className="px-1.5 py-0.5 min-w-[24px] text-center bg-slate-100 border border-slate-200 rounded text-[10px] font-bold text-slate-500 shadow-sm font-mono uppercase">
            {k}
          </kbd>
        ))}
      </div>
    </div>
  );
}

function FloatingBtn({ icon, onClick, label }: { icon: React.ReactNode, onClick: (e?: any) => void, label: string }) {
  return (
    <button 
      onClick={onClick}
      title={label}
      className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
    >
      {icon}
    </button>
  );
}

function PresToolBtn({ active, icon, onClick, label }: { active: boolean, icon: React.ReactNode, onClick: () => void, label: string }) {
  return (
    <button 
      onClick={onClick}
      title={label}
      className={`p-3 rounded-xl transition-all cursor-pointer flex items-center justify-center ${active ? 'bg-[var(--accent)] text-white shadow-lg' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'}`}
    >
      {icon}
    </button>
  );
}

// --- 初始示例模板内容 ---
const initialMarkdown = `
# 🌟 欢迎使用 FluxMark 智能文档编辑器

FluxMark 是一款为您精心打造的**全能型 Markdown 创作空间**，融兼**沉浸式写作**、**AI 助手**、**交互式任务清单**、**数学公式**与**全屏放映**功能。

---

## 🎯 快速体验任务清单 (Task List)

- [x] **开启 FluxMark**：享受极其丝滑的沉浸式排版与实时预览
- [x] **智能格式排版**：体验快捷工具栏中的 ✨ **一键智能排版** 优化间距
- [ ] **交互复选框**：直接点击前端方框切换待办任务状态
- [ ] **AI 大模型助手**：点击右上角 AI 图标唤起智能写作与修改建议
- [ ] **全屏演示放映**：按 \`F11\` 或点击顶部放映按钮转换为幻灯片展示

---

## 📝 文本排版与格式演示

您可以轻松对文档进行 ==文本重点高亮==、**加粗文本**、*斜体文字*、~删除线~ 以及专业的上标 $X^2$ 和下标 $H_2O$ 处理。

> 💡 **设计哲学**：专注与美感兼备。打破传统编辑器与预览窗口的界限，让创作更加自然流畅。

---

## 📐 数学公式与科学计算 (KaTeX)

支持优雅的行内公式如 $E = mc^2$ 以及复杂的块级数学方程：

$$
\int_{-\infty}^{+\infty} e^{-x^2} dx = \sqrt{\pi}
$$

$$
\mathbf{A} \mathbf{x} = \lambda \mathbf{x}
$$

---

## 💻 代码高亮与工程集成

内置多语言语法高亮，支持一键复制代码与智能展示：

\`\`\`typescript
// FluxMark 示例代码
interface AppConfig {
  theme: 'light' | 'dark';
  aiPowered: boolean;
  smartFormatting: boolean;
}

function initFluxMark(config: AppConfig): void {
  console.log('🚀 FluxMark 编辑器已成功初始化');
}
\`\`\`

---

## 📊 快捷功能对照

| 功能模块 | 对应快捷键 / 入口 | 作用说明 |
| :--- | :--- | :--- |
| **撤销 / 重做** | \`Ctrl + Z\` / \`Ctrl + Y\` | 快速恢复与重做历史修改 |
| **一键智能排版** | 快速悬浮工具栏 ✨ | 自动消除多余空格与格式规范 |
| **任务清单** | \`Ctrl + Shift + 9\` | 快速插入可交互的勾选框清单 |
| **AI 写作助手** | 右上角 AI 按钮 | 调用大模型辅助生成与润色 |

---
_FluxMark - 灵感流淌，极致表达。_
`;
