import {getPdfPages} from './utils/pdfPages';
import {PresentationPreview} from './components/PresentationPreview';
import {cleanDocumentHtml, parseSafeEditorContent, parseSafeEditorSlice} from './lib/editorContent';
import {getPresentationLayout, splitPresentationSlides} from './utils/presentationLayout';
import {enablePresentationPinch, wheelZoomFactor} from './utils/presentationPinch';
import {withExportBrand} from './utils/exportBrand';
import {WorkspaceChrome} from './components/WorkspaceChrome';
import {ResourceTree} from './components/ResourceTree';
import { KnowledgeGraph, type WikiEdge } from './components/KnowledgeGraph';
import { resourceNotes, wikiMatches, wikiTargets, type WikiNote } from './utils/wikiGraph';
import { WikiLink } from './extensions/WikiLink';
import {PresentationControls} from './components/PresentationControls';
import {WorkspaceTools, useDrafts} from './components/WorkspaceTools';
import {readWorkingDraft, saveEmergencyDraft, saveWorkingDraft, storeDraft, type Draft} from './utils/drafts';
import React, { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo, createContext, useContext } from 'react';
import { 
  FileText, Save, Download, Image as ImageIcon, 
  Monitor, Layout, Sun, Moon, Droplets, 
  ChevronLeft, ChevronRight, Maximize2, ZoomIn, ZoomOut, PanelLeftClose, PanelLeft,
  Folder, ChevronDown, Superscript as SuperscriptIcon, Subscript as SubscriptIcon,
  Type, Palette, AlignCenter, AlignLeft, Trash2, Printer, MousePointer2, Pencil, Eraser, Timer, RefreshCcw, Target,
  FileCode, Share2, HelpCircle, FileDown, Upload, Bold, Italic, List, ListTodo, ListTree, Heading1, Heading2, Quote, Highlighter, Video as VideoIcon,
  Undo, Redo, Wand2, Zap, Search, Network, Link2, Files, Settings2,
  AlertCircle, Check, Plus, BookOpen, Keyboard, UserCheck, Table as TableIcon, Rows, Columns
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { saveAs } from 'file-saver';
import Cropper from 'cropperjs';
import 'cropperjs/dist/cropper.css';
import katex from 'katex';
import 'katex/dist/katex.min.css';

// Tiptap Imports
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from 'tiptap-markdown';
import { MarkdownSyntax, MarkdownText } from './extensions/MarkdownSyntax';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import Image from 'tiptap-extension-resize-image';
import { CustomImage } from './extensions/CustomImage';
import { saveMediaToMedFolder, registerMediaBlob, getMediaBlobUrl, syncMediaToDirectory } from './utils/mediaRegistry';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Superscript from '@tiptap/extension-superscript';
import Subscript from '@tiptap/extension-subscript';
import TextAlign from '@tiptap/extension-text-align';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { Table as TableExtension, TableRow, TableHeader, TableCell } from '@tiptap/extension-table';
import { common, createLowlight } from 'lowlight';

import { CustomCodeBlock } from './extensions/CustomCodeBlock';
import { CustomBlockquote } from './extensions/CustomBlockquote';
import { InlineMath } from './extensions/InlineMath';
import { BlockMath } from './extensions/BlockMath';
import { Video } from './extensions/Video';
import { HeadingSuggestion } from './extensions/HeadingSuggestion';
import { EmojiSuggestion } from './extensions/EmojiSuggestion';
import { CustomFormattingInputRules } from './extensions/CustomFormattingInputRules';
import { AIChat } from './components/AIChat';
import { HighlightPopover } from './components/HighlightPopover';
import { StudentPickerModal } from './components/StudentPickerModal';
import { ImageCropperModal } from './components/ImageCropperModal';
import { PrivacyModal } from './components/PrivacyModal';
import { SponsorModal } from './components/SponsorModal';
import { PresBgModal, PresBgConfig, DEFAULT_PRES_BG_CONFIG, getPresBgStyle, renderPresPatternOverlay } from './components/PresBgModal';
import { ResourceItem, PreviewImageInfo } from './types';
import { ImagePreviewModal } from './components/ImagePreviewModal';
import { NewFileModal } from './components/NewFileModal';
import { TemplateModal } from './components/TemplateModal';
import { DOCUMENT_TEMPLATES, DocumentTemplate } from './data/templates';
import { PDFExportModal, PDFExportOptions, ImageExportOptions } from './components/PDFExportModal';
import { executeSmartFormat } from './utils/smartFormat';
import { Sparkles as SparklesIcon, ShieldCheck as ShieldCheckIcon, Heart as HeartIcon } from 'lucide-react';

const lowlight = createLowlight(common);

// --- Types ---
type Theme = 'light' | 'dark' | 'warm' | 'sky';
type SidebarTab = 'outline' | 'resources' | 'backlinks';

interface ThemeOption {
  id: Theme;
  name: string;
  tag: string;
  desc: string;
  icon: React.ReactNode;
  bgHex: string;
  accentHex: string;
  cardGradient: string;
}

const THEME_OPTIONS: ThemeOption[] = [
  { id: 'light', name: '白', tag: '明亮', desc: '纯白画布，清晰专注', icon: <Sun size={16} />, bgHex: '#ffffff', accentHex: '#292929', cardGradient: 'from-neutral-100 to-neutral-200' },
  { id: 'dark', name: '黑', tag: '深色', desc: '炭黑界面，沉浸书写', icon: <Moon size={16} />, bgHex: '#202020', accentHex: '#e8e8e8', cardGradient: 'from-neutral-700 to-neutral-800' },
  { id: 'warm', name: '米黄', tag: '温暖', desc: '温润纸色，安静阅读', icon: <BookOpen size={16} />, bgHex: '#faf7ef', accentHex: '#665743', cardGradient: 'from-stone-100 to-stone-200' },
  { id: 'sky', name: '天蓝', tag: '清透', desc: '浅蓝底色，轻盈舒展', icon: <Droplets size={16} />, bgHex: '#f3f9fd', accentHex: '#315d7a', cardGradient: 'from-sky-50 to-sky-100' },
];

export interface FontOption {
  id: string;
  name: string;
  category: 'sans' | 'serif' | 'mono';
  categoryLabel: string;
  value: string;
  sample: string;
}

const MARKDOWN_SKINS = [
  { id: 'studio', name: '青瓷', description: '瓷白与松石绿 · 疏朗留白、釉色标题线与轻量表格。' },
  { id: 'editorial', name: '绯页', description: '灰玫瑰纸面、居中刊头和宋体段落。' },
  { id: 'technical', name: '星轨', description: '雾蓝底色、等宽标题和淡线网格。' },
  { id: 'notebook', name: '柚木', description: '燕麦纸与赭金 · 横线纸、书脊细线与便签引用。' },
  { id: 'compact', name: '棱镜', description: '冷紫与靛蓝 · 色带标题、紧凑段落与分区表格。' },
  { id: 'mac', name: '曜银', description: 'macOS 风格的银灰纸面、雾蓝光晕和玻璃质感。' },
] as const;

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

// --- App Component ---
export default function App() {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem('fluxmark_theme');
      if (saved === 'ocean') return 'sky';
      if (saved === 'mint') return 'light';
      return THEME_OPTIONS.some(t => t.id === saved) ? saved as Theme : 'light';
    } catch { return 'light'; }
  });
  const [fontFamily, setFontFamily] = useState<string>('default');
  const [markdownSkin, setMarkdownSkin] = useState(() => {
    try {
      const saved = localStorage.getItem('fluxmark_markdown_skin');
      return MARKDOWN_SKINS.find(skin => skin.id === saved)?.id ?? 'studio';
    } catch { return 'studio'; }
  });
  function changeMarkdownSkin(id: string) {
    const skin = MARKDOWN_SKINS.find(option => option.id === id);
    if (!skin) return;
    setMarkdownSkin(skin.id);
    try { localStorage.setItem('fluxmark_markdown_skin', skin.id); } catch { /* Session preference remains active. */ }
  }
  const [zoom, setZoom] = useState<number>(1);
  const [workspaceScale, setWorkspaceScale] = useState(1);
  const [showPresentationPreview, setShowPresentationPreview] = useState(false);
  const [fitSlides, setFitSlides] = useState(false);
  const [slideOverflow, setSlideOverflow] = useState(false);
  const releaseSlideViewport = useRef<(() => void) | undefined>(undefined);
  const slideViewport = useRef<HTMLDivElement | null>(null);
  const [slideEditing, setSlideEditing] = useState(false);
  const [saveState, setSaveState] = useState('浏览器草稿');
  const lastSnapshot = useRef(0);
  const documentId = useRef<string>(crypto.randomUUID());
  const draftTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const pendingDraft = useRef<Parameters<typeof saveWorkingDraft>[0] | null>(null);
  const uncommittedDraft = useRef<Parameters<typeof saveWorkingDraft>[0] | null>(null);
  const documentNameRef = useRef('当前文档.md');
  const annotationPages = useRef<Record<number, string>>({});
  const [isPresentation, setIsPresentation] = useState<boolean>(false);
  const [showSidebar, setShowSidebar] = useState<boolean>(() => window.innerWidth > 820);
  const [activeSidebarTab, setActiveSidebarTab] = useState<SidebarTab>('resources');
  const [showGraph, setShowGraph] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [currentWikiTargets, setCurrentWikiTargets] = useState<string[]>([]);
  const [diskWikiTargets, setDiskWikiTargets] = useState<Record<string, string[]>>({});
  const [indexingWiki, setIndexingWiki] = useState(false);
  const wikiDrafts = useDrafts();
  const resourceDocumentIds = useRef(new Map<string, string>());
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [currentDirectoryHandle, setCurrentDirectoryHandle] = useState<any | null>(null);
  const [currentDirectoryName, setCurrentDirectoryName] = useState<string | null>(null);
  const [showNewFileModal, setShowNewFileModal] = useState<boolean>(false);
  const [previewImageInfo, setPreviewImageInfo] = useState<PreviewImageInfo | null>(null);
  const [activeResourceId, setActiveResourceId] = useState<string | null>(null);
  const [resourceTreeVersion, setResourceTreeVersion] = useState(0);
  const [outline, setOutline] = useState<{ id: string, text: string, level: number, pos?: number }[]>([]);
  const [activeHeadingId, setActiveHeadingId] = useState<string | null>(null);
  const [collapsedHeadings, setCollapsedHeadings] = useState<Record<string, boolean>>({});
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<number | null>(null);
  const [selection, setSelection] = useState<SelectionState>({ top: 0, left: 0, visible: false, text: '', range: null });
  const [showAIChat, setShowAIChat] = useState<boolean>(false);
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);
  const [showTemplateModal, setShowTemplateModal] = useState<boolean>(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState<boolean>(false);
  const [showSponsorModal, setShowSponsorModal] = useState<boolean>(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState<boolean>(false);
  const [exportModalTab, setExportModalTab] = useState<'pdf' | 'image'>('pdf');
  const [isPdfModalGenerating, setIsPdfModalGenerating] = useState<boolean>(false);
  const [pdfExportProgress, setPdfExportProgress] = useState<number>(0);
  const [pdfExportStatusText, setPdfExportStatusText] = useState<string>('');
  const [helpTab, setHelpTab] = useState<'tutorial' | 'shortcuts'>('tutorial');
  const [shortcutFilter, setShortcutFilter] = useState<string>('');
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [showHighlightPopover, setShowHighlightPopover] = useState<boolean>(false);
  const [showSelectionHighlightPopover, setShowSelectionHighlightPopover] = useState<boolean>(false);
  const [lastHighlightColor, setLastHighlightColor] = useState<string>('#fef08a');
  
  // Presentation Annotation & Slide State
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [slideDirection, setSlideDirection] = useState<number>(1); // 1 for next, -1 for prev

  const changeSlideIndex = (targetOrUpdater: number | ((prev: number) => number)) => {
    setCurrentSlideIndex(prev => {
      const nextVal = typeof targetOrUpdater === 'function' ? targetOrUpdater(prev) : targetOrUpdater;
      if (nextVal > prev) {
        setSlideDirection(1);
      } else if (nextVal < prev) {
        setSlideDirection(-1);
      }
      return nextVal;
    });
  };
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
  
  // Presentation Background & Pattern Settings State
  const [presBgConfig, setPresBgConfig] = useState<PresBgConfig>(() => {
    try {
      const saved = localStorage.getItem('fluxmark_pres_bg');
      return saved ? JSON.parse(saved) : DEFAULT_PRES_BG_CONFIG;
    } catch {
      return DEFAULT_PRES_BG_CONFIG;
    }
  });
  const [showPresBgModal, setShowPresBgModal] = useState<boolean>(false);

  // Custom UI notification and dialog states
  function flushWorkingDraft() {
    const draft = pendingDraft.current;
    if (!draft) return;
    pendingDraft.current = null;
    void saveWorkingDraft(draft).then(() => {
      if (uncommittedDraft.current === draft) uncommittedDraft.current = null;
      if (!pendingDraft.current && documentId.current === draft.documentId) {
        setSaveState(current => current === '正在缓存草稿…' ? '草稿已缓存 · 文件待保存' : current);
      }
    }).catch(() => setSaveState('缓存失败，请导出备份'));
  }
  function switchDocument(name: string, id: string = crypto.randomUUID()) {
    clearTimeout(draftTimer.current);
    flushWorkingDraft();
    documentId.current = id;
    documentNameRef.current = name;
    lastSnapshot.current = 0;
    setDocName(name);
    setActiveResourceId(null);
  }
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
  const workspaceViewport = useRef<HTMLDivElement>(null);
  const zoomAnchor = useRef<{ x: number; y: number; scale: number } | null>(null);
  useLayoutEffect(() => {
    const viewport = workspaceViewport.current;
    const anchor = zoomAnchor.current;
    zoomAnchor.current = null;
    if (viewport && anchor && !isPresentation) {
      viewport.scrollTo({
        left: (viewport.scrollLeft + anchor.x) * workspaceScale / anchor.scale - anchor.x,
        top: (viewport.scrollTop + anchor.y) * workspaceScale / anchor.scale - anchor.y,
      });
    }
  }, [workspaceScale, isPresentation]);
  useEffect(() => {
    const shell = containerRef.current;
    if (!shell || isPresentation) return;
    const wheel = (event: WheelEvent) => {
      if (!event.ctrlKey || !event.deltaY || event.defaultPrevented) return;
      event.preventDefault();
      const factor = wheelZoomFactor(event);
      const viewport = workspaceViewport.current;
      const nextScale = Math.min(1.5, Math.max(.75, workspaceScale * factor));
      if (!viewport || nextScale === workspaceScale) return;
      const rect = viewport.getBoundingClientRect();
      zoomAnchor.current = { x: event.clientX - rect.left, y: event.clientY - rect.top, scale: workspaceScale };
      setWorkspaceScale(nextScale);
    };
    const reset = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.key !== '0') return;
      event.preventDefault();
      setWorkspaceScale(1);
    };
    shell.addEventListener('wheel', wheel, { passive: false });
    window.addEventListener('keydown', reset);
    return () => {
      shell.removeEventListener('wheel', wheel);
      window.removeEventListener('keydown', reset);
    };
  }, [isPresentation, workspaceScale]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const directoryInputRef = useRef<HTMLInputElement>(null);
  const cropperRef = useRef<Cropper | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  // Tiptap Editor Initialization
  const FLUXMARK_STORAGE_KEY = 'fluxmark_saved_doc_v1';
  const processAndInsertMediaFileRef = useRef<((file: File) => Promise<void>) | undefined>(undefined);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        text: false,
        codeBlock: false,
        blockquote: false,
      }),
      MarkdownSyntax,
      MarkdownText,
      WikiLink,
      Markdown.configure({
        linkify: true,
        breaks: true,
      }),
      Placeholder.configure({
        placeholder: '在此输入您的内容，FluxMark 支持即时 Markdown 渲染...',
      }),
      CharacterCount,
      CustomImage.configure({
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
      CustomFormattingInputRules,
      TableExtension.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse table-auto w-full my-4 border border-[var(--border)]',
        },
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: (() => {
      let saved: string|null = null;
      try { saved=localStorage.getItem(FLUXMARK_STORAGE_KEY); } catch {} 
      if (saved !== null) {
        return cleanDocumentHtml(saved);
      }
      return initialMarkdown;
    })(),
    editorProps: {
      transformPastedHTML: cleanDocumentHtml,
      attributes: {
        class: 'prose-custom w-full outline-none min-h-[600px] border-none focus:ring-0',
      },
      handleDrop: (view, event, slice, moved) => {
        if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files.length > 0) {
          const file = event.dataTransfer.files[0];
          if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
            event.preventDefault();
            if (processAndInsertMediaFileRef.current) {
              processAndInsertMediaFileRef.current(file);
            }
            return true;
          }
        }
        return false;
      },
      handlePaste: (view, event) => {
        if (event.clipboardData && event.clipboardData.files && event.clipboardData.files.length > 0) {
          const file = event.clipboardData.files[0];
          if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
            event.preventDefault();
            if (processAndInsertMediaFileRef.current) {
              processAndInsertMediaFileRef.current(file);
            }
            return true;
          }
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      const draft = { documentId: documentId.current, name: documentNameRef.current, html: editor.getHTML(), time: Date.now() };
      pendingDraft.current = draft;
      uncommittedDraft.current = draft;
      clearTimeout(draftTimer.current);
      setSaveState('正在缓存草稿…');
      draftTimer.current = setTimeout(flushWorkingDraft, 400);
      if (Date.now() - lastSnapshot.current > 60000) {
        lastSnapshot.current = Date.now();
        void storeDraft(draft.documentId, draft.name, draft.html).catch(() => setSaveState('版本备份失败，请导出副本'));
      }

      // Update outline in microtask to avoid flushSync during render/lifecycle
      queueMicrotask(() => {
        const targets: string[] = [];
        editor.state.doc.descendants(node => {
          if (node.type.name === 'wikiLink' && node.attrs.target && !targets.includes(node.attrs.target)) targets.push(node.attrs.target);
        });
        setCurrentWikiTargets(previous => previous.length === targets.length && previous.every((value, index) => value === targets[index]) ? previous : targets);
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

  useEffect(() => {
    if (!editor) return;
    let active = true;
    const initial = editor.getHTML();
    const initialId = documentId.current;
    void readWorkingDraft().then(draft => {
      if (!active || !draft || initialId !== documentId.current || editor.getHTML() !== initial) return;
      switchDocument(draft.name, draft.documentId);
      lastSnapshot.current = Date.now();
      editor.commands.setContent(parseSafeEditorContent(editor, draft.html));
    }).catch(() => { if (active) setSaveState('浏览器草稿暂不可用'); });
    const flushBeforeLeaving = () => {
      if (uncommittedDraft.current) saveEmergencyDraft(uncommittedDraft.current);
      flushWorkingDraft();
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') flushBeforeLeaving();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pagehide', flushBeforeLeaving);
    return () => {
      active = false;
      clearTimeout(draftTimer.current);
      flushWorkingDraft();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pagehide', flushBeforeLeaving);
    };
  }, [editor]);

  // Tiptap Slide Editor for Full-Screen Presentation Mode Editing
  const slideEditor = useEditor({
    extensions: [
      StarterKit.configure({
        text: false,
        codeBlock: false,
        blockquote: false,
      }),
      MarkdownSyntax,
      MarkdownText,
      WikiLink,
      Markdown.configure({
        linkify: true,
        breaks: true,
      }),
      Placeholder.configure({
        placeholder: '在此编辑本页幻灯片内容...',
      }),
      CharacterCount,
      CustomImage.configure({
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
      CustomFormattingInputRules,
      TableExtension.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse table-auto w-full my-4 border border-[var(--border)]',
        },
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: '',
    editorProps: {
      transformPastedHTML: cleanDocumentHtml,
      attributes: {
        class: 'prose-custom w-full outline-none min-h-[360px] border-none focus:ring-0 text-[var(--text-primary)]',
      },
    },
    onUpdate: ({ editor: currentSlideEd }) => {
      if (!isPresentation || !slideEditing || isUpdatingFromSlideRef.current || !editor) return;
      const currentSlideHtml = currentSlideEd.getHTML();

      const subSlides = splitPresentationSlides(currentSlideHtml);
      const fullHtml = editor.getHTML();
      const rawSlides = splitPresentationSlides(fullHtml);

      const targetIdx = Math.min(Math.max(0, currentSlideIndex), rawSlides.length - 1);

      queueMicrotask(() => {
        if (subSlides.length > 1) {
          rawSlides.splice(targetIdx, 1, ...subSlides);
          const newFullContent = rawSlides.join('<hr>');
          //@ts-ignore
          editor.commands.setContent(newFullContent, { emitUpdate: true });
          setCurrentSlideIndex(targetIdx + 1);
        } else {
          rawSlides[targetIdx] = currentSlideHtml;
          const newFullContent = rawSlides.join('<hr>');
          //@ts-ignore
          editor.commands.setContent(newFullContent, { emitUpdate: true });
        }
      });
    },
  });

  useEffect(() => { documentNameRef.current = docName; }, [docName]);
  useEffect(() => { slideEditor?.setEditable(isPresentation && slideEditing, false); }, [slideEditor, slideEditing, isPresentation]);
  useEffect(() => {
    const h = () => { if(!document.fullscreenElement) {setIsPresentation(false);setIsTimerActive(false);} };
    document.addEventListener('fullscreenchange',h);
    return () => document.removeEventListener('fullscreenchange',h);
  }, []);
  useEffect(() => {
    if(isPresentation) return;
    setIsTimerActive(false);
    if(document.fullscreenElement) document.exitFullscreen().catch(()=>{});
  },[isPresentation]);
  useEffect(() => {
    if(!isPresentation) return;
    const canvas=canvasRef.current;
    const ctx=canvas?.getContext('2d');
    if(!canvas||!ctx) return;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    const saved=annotationPages.current[currentSlideIndex];
    let disposed=false;
    if(saved){const img=new window.Image();img.onload=()=>{if(!disposed)ctx.drawImage(img,0,0,canvas.clientWidth,canvas.clientHeight);};img.src=saved;}
    return()=>{disposed=true;annotationPages.current[currentSlideIndex]=canvas.toDataURL();};
  },[currentSlideIndex,isPresentation]);
  // Slide management handlers in presentation mode
  const handleAddSlideInPresentation = () => {
    if (!editor) return;
    const fullHtml = editor.getHTML();
    const rawSlides = splitPresentationSlides(fullHtml);
    const targetIdx = Math.min(Math.max(0, currentSlideIndex), rawSlides.length - 1);
    const insertIdx = targetIdx + 1;
    rawSlides.splice(insertIdx, 0, '<h2>新幻灯片</h2><p>点击在此处输入内容...</p>');
    const newFull = rawSlides.join('<hr>');
    editor.commands.setContent(newFull);
    changeSlideIndex(insertIdx);
  };

  const handleDeleteSlideInPresentation = () => {
    if (!editor) return;
    const fullHtml = editor.getHTML();
    const rawSlides = splitPresentationSlides(fullHtml);
    const targetIdx = Math.min(Math.max(0, currentSlideIndex), rawSlides.length - 1);

    if (rawSlides.length <= 1) {
      editor.commands.setContent('<p></p>');
      slideEditor?.commands.setContent('<p></p>');
      return;
    }

    rawSlides.splice(targetIdx, 1);
    const newFull = rawSlides.join('<hr>');
    editor.commands.setContent(newFull);
    changeSlideIndex(Math.max(0, targetIdx - 1));
  };

  const handleClearSlideInPresentation = () => {
    slideEditor?.commands.setContent('<p></p>');
  };

  const getSlideTransitionVariants = (type: string = 'slide-x', direction: number = 1) => {
    switch (type) {
      case 'none':
        return { initial: { opacity: 1 }, animate: { opacity: 1 }, exit: { opacity: 1 } };
      case 'fade':
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 },
        };
      case 'slide-y':
        return {
          initial: { opacity: 0, y: direction > 0 ? 60 : -60 },
          animate: { opacity: 1, y: 0 },
          exit: { opacity: 0, y: direction > 0 ? -60 : 60 },
        };
      case 'zoom':
        return {
          initial: { opacity: 0, scale: direction > 0 ? 0.92 : 1.08 },
          animate: { opacity: 1, scale: 1 },
          exit: { opacity: 0, scale: direction > 0 ? 1.08 : 0.92 },
        };
      case 'flip':
        return {
          initial: { opacity: 0, rotateY: direction > 0 ? 25 : -25 },
          animate: { opacity: 1, rotateY: 0 },
          exit: { opacity: 0, rotateY: direction > 0 ? -25 : 25 },
        };
      case 'slide-x':
      default:
        return {
          initial: { opacity: 0, x: direction > 0 ? 60 : -60 },
          animate: { opacity: 1, x: 0 },
          exit: { opacity: 0, x: direction > 0 ? -60 : 60 },
        };
    }
  };

  const canPresUndo = (slideEditor?.can().undo() || editor?.can().undo()) ?? false;
  const canPresRedo = (slideEditor?.can().redo() || editor?.can().redo()) ?? false;

  const handlePresUndo = () => {
    if (slideEditor && slideEditor.can().undo()) {
      slideEditor.chain().focus().undo().run();
    } else if (editor && editor.can().undo()) {
      editor.chain().focus().undo().run();
    }
  };

  const handlePresRedo = () => {
    if (slideEditor && slideEditor.can().redo()) {
      slideEditor.chain().focus().redo().run();
    } else if (editor && editor.can().redo()) {
      editor.chain().focus().redo().run();
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

  // Jump to heading by text or pos (resilient search)
  const jumpToHeadingByTextOrPos = (pos?: number | null, text?: string) => {
    if (!editor) return;
    let targetPos: number | null = null;

    if (text) {
      const cleanText = text.trim().toLowerCase();
      editor.state.doc.descendants((node, nodePos) => {
        if (node.type.name === 'heading' && node.textContent.trim().toLowerCase() === cleanText) {
          if (targetPos === null) {
            targetPos = nodePos;
          }
        }
      });
    }

    if (targetPos === null && pos !== null && pos !== undefined) {
      targetPos = pos;
    }

    if (targetPos !== null) {
      scrollToHeading(targetPos);
    } else {
      showToast('未找到对应的标题位置');
    }
  };

  // Automatically insert Table of Contents (H1-H3) at document top
  const insertTableOfContents = () => {
    if (!editor) return;

    const h1ToH3Headings: { text: string; level: number; pos: number }[] = [];
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === 'heading') {
        const level = node.attrs.level;
        if (level >= 1 && level <= 3) {
          const text = node.textContent.trim();
          if (text) {
            h1ToH3Headings.push({ text, level, pos });
          }
        }
      }
    });

    if (h1ToH3Headings.length === 0) {
      showToast('未在文档中检测到 H1-H3 标题，请先添加标题后再插入目录');
      return;
    }

    const itemsHtml = h1ToH3Headings.map(h => {
      const indentClass = h.level === 1 
        ? 'pl-0 font-bold text-blue-600 dark:text-blue-400' 
        : h.level === 2 
        ? 'pl-4 font-medium text-slate-700 dark:text-slate-300' 
        : 'pl-8 text-slate-500 dark:text-slate-400';
      const prefix = h.level === 1 ? '• ' : h.level === 2 ? '└ ' : '  └ ';
      return `<li class="toc-item ${indentClass} py-0.5"><a href="#heading-${h.pos}" class="toc-link inline-flex items-center gap-1 hover:text-blue-500 hover:underline transition-colors cursor-pointer" data-toc-pos="${h.pos}" data-toc-text="${encodeURIComponent(h.text)}"><span class="opacity-60">${prefix}</span><span>${h.text}</span></a></li>`;
    }).join('');

    const tocBlockHtml = `<div class="toc-container my-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-2xs select-none" data-toc-block="true"><div class="flex items-center justify-between pb-2 mb-3 border-b border-slate-200 dark:border-slate-700"><div class="flex items-center gap-2 font-bold text-sm text-slate-800 dark:text-slate-200"><span class="text-blue-500">📋</span><span>文档目录 (Table of Contents)</span></div><span class="text-[10px] text-slate-400 font-mono">基于 H1-H3 标题 (${h1ToH3Headings.length} 项)</span></div><ul class="space-y-1 text-xs">${itemsHtml}</ul></div><p></p>`;

    // Insert at position 0 (top of document)
    editor.chain().focus('start').insertContent(tocBlockHtml).run();

    const viewport = document.getElementById('editor-viewport');
    if (viewport) {
      viewport.scrollTo({ top: 0, behavior: 'smooth' });
    }

    showToast(`已在文档顶部自动生成目录 (${h1ToH3Headings.length} 项 H1-H3 标题)`);
  };

  // 主题与字体切换
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.colorScheme = theme === 'dark' ? 'dark' : 'light';
    try { localStorage.setItem('fluxmark_theme', theme); } catch { /* Theme remains usable without storage. */ }
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
  const applyStyle = (
    style: 'bold' | 'italic' | 'heading' | 'bullet' | 'task' | 'quote' | 'color' | 'size' | 'align' | 'clear' | 'highlight' | 'superscript' | 'subscript' | 'undo' | 'redo' | 'table' | 'addRowAfter' | 'addRowBefore' | 'deleteRow' | 'addColumnAfter' | 'addColumnBefore' | 'deleteColumn' | 'deleteTable' | 'toggleHeaderRow',
    value?: string | number
  ) => {
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
      case 'table':
        if (editor.isActive('table')) {
          editor.chain().focus().deleteTable().run();
        } else {
          editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
        }
        break;
      case 'addRowAfter': editor.chain().focus().addRowAfter().run(); break;
      case 'addRowBefore': editor.chain().focus().addRowBefore().run(); break;
      case 'deleteRow': editor.chain().focus().deleteRow().run(); break;
      case 'addColumnAfter': editor.chain().focus().addColumnAfter().run(); break;
      case 'addColumnBefore': editor.chain().focus().addColumnBefore().run(); break;
      case 'deleteColumn': editor.chain().focus().deleteColumn().run(); break;
      case 'deleteTable': editor.chain().focus().deleteTable().run(); break;
      case 'toggleHeaderRow': editor.chain().focus().toggleHeaderRow().run(); break;
    }
    
    setSelection(s => ({ ...s, visible: false }));
  };

  // 智能排版函数：清理冗余空格、规范中英文/数字盘古间距、处理空行与列表样式
  const handleSmartFormat = () => {
    executeSmartFormat(editor, showToast);
  };

  // 文件操作
  const createNewFile = () => {
    if (!editor) return;
    const currentContent = editor.getHTML();
    const isDocEmpty = !currentContent || currentContent === '<p></p>' || currentContent === '<p></p>\n' || currentContent.trim() === '';

    const executeCreate = async () => {
      try {await storeDraft(documentId.current,docName,editor.getHTML());} catch {showToast('无法备份当前文档，请先导出');return;}
      switchDocument('新建空白文档.md');
      editor.commands.setContent('<p></p>');
      editor.commands.focus();
      setCurrentFileHandle(null);

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

  const handleSelectTemplate = async (template: DocumentTemplate) => {
    if (!editor) return;

    const executeApply = async () => {
      try { await storeDraft(documentId.current, docName, editor.getHTML()); }
      catch { showToast('无法备份当前文档，请先导出'); return; }
      const parsedHtml = template.content;
      switchDocument(template.docName);
      editor.commands.setContent(parseSafeEditorContent(editor, parsedHtml));
      editor.commands.focus();
      setCurrentFileHandle(null);

      showToast(`已成功载入示例模版: ${template.title}`);
    };

    const currentContent = editor.getHTML();
    const isDocEmpty = !currentContent || currentContent === '<p></p>' || currentContent === '<p></p>\n' || currentContent.trim() === '';

    if (!isDocEmpty) {
      setConfirmModal({
        isOpen: true,
        title: '载入示例模版确认',
        message: `确定要载入 “${template.title}” 吗？当前编辑中的文档内容将被覆盖。`,
        confirmText: '确定载入模版',
        onConfirm: executeApply,
      });
    } else {
      executeApply();
    }
  };

  const loadSampleDoc = () => {
    setShowTemplateModal(true);
  };

  const resourceType = (name: string): ResourceItem['type'] => {
    const dot = name.lastIndexOf('.');
    const ext = dot >= 0 ? name.slice(dot + 1).toLowerCase() : '';
    if (['md', 'txt', 'markdown'].includes(ext)) return 'file';
    if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp', 'ico', 'avif'].includes(ext)) return 'image';
    if (['mp4', 'webm', 'ogg', 'mov', 'm4v', 'mkv'].includes(ext)) return 'video';
    if (['json', 'js', 'ts', 'html', 'css', 'jsx', 'tsx'].includes(ext)) return 'code';
    return 'other';
  };

  const scanDirectoryEntries = async (dirHandle: any, parentPath = ''): Promise<ResourceItem[]> => {
    const items: ResourceItem[] = [];
    for await (const entry of dirHandle.values()) {
      const relativePath = parentPath ? `${parentPath}/${entry.name}` : entry.name;
      if (entry.kind === 'directory') {
        const children = await scanDirectoryEntries(entry, relativePath);
        items.push({ id: relativePath, name: entry.name, relativePath, type: 'folder', handle: entry, children });
        continue;
      }
      const type = resourceType(entry.name);
      if (type === 'other') continue;
      let file: File | undefined;
      if (type === 'image' || type === 'video') {
        try { file = await entry.getFile(); }
        catch { /* The file can be retried from the tree. */ }
      }
      items.push({
        id: relativePath, name: entry.name, relativePath, type, handle: entry, file,
        size: file?.size, lastModified: file?.lastModified,
        url: file ? registerMediaBlob(relativePath, file) : undefined,
      });
    }
    return items;
  };

  const openDirectory = async () => {
    if (!('showDirectoryPicker' in window)) {
      directoryInputRef.current?.click();
      return;
    }

    try {
      // @ts-ignore - File System Access API
      const dirHandle = await window.showDirectoryPicker();
      const items = await scanDirectoryEntries(dirHandle);
      resourceDocumentIds.current.clear();
      setCurrentDirectoryHandle(dirHandle);
      setCurrentDirectoryName(dirHandle.name);

      setResources(items);
      setActiveResourceId(null);
      setResourceTreeVersion(value => value + 1);
      setActiveSidebarTab('resources');
      showToast(`已成功打开工作区 ${dirHandle.name} (${items.length} 个本地资源)`);
    } catch (err: any) {
      if (err.name === 'SecurityError' || err.name === 'NotAllowedError') {
        directoryInputRef.current?.click();
      } else if (err.name !== 'AbortError') {
        console.error('Failed to open directory:', err);
        directoryInputRef.current?.click();
      }
    }
  };

  const refreshDirectory = async () => {
    if (!currentDirectoryHandle) return;
    try {
      setResources(await scanDirectoryEntries(currentDirectoryHandle));
      showToast(`已刷新工作区 ${currentDirectoryName}`);
    } catch {
      showToast('无法刷新文件夹，请重新打开并检查读取权限');
    }
  };

  const handleDirectoryOpen = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.currentTarget.files ?? []);
    event.currentTarget.value = '';
    if (!files.length) return;
    const folderName = files[0].webkitRelativePath.split('/')[0] || '本地工作区';
    const items = files.flatMap((file): ResourceItem[] => {
      const type = resourceType(file.name);
      if (type === 'other') return [];
      const relativePath = file.webkitRelativePath.split('/').slice(1).join('/') || file.name;
      const url = type === 'image' || type === 'video' ? registerMediaBlob(relativePath, file) : undefined;
      return [{ id: relativePath, name: file.name, relativePath, type, file, size: file.size, lastModified: file.lastModified, url }];
    });
    setCurrentDirectoryName(folderName);
    resourceDocumentIds.current.clear();
    setCurrentDirectoryHandle(null);
    setResources(items);
    setActiveResourceId(null);
    setResourceTreeVersion(value => value + 1);
    setActiveSidebarTab('resources');
    showToast(`已打开本地项目 ${folderName}`);
  };

  const readResource = (resource: ResourceItem): Promise<File | Blob | undefined> =>
    resource.handle?.getFile ? resource.handle.getFile() : Promise.resolve(resource.file);

  const insertResourceMedia = async (resource: ResourceItem) => {
    if (!editor) return;
    try {
      if (!resource.url) {
        const file = await readResource(resource);
        if (!file) throw new Error('Missing media');
        registerMediaBlob(resource.relativePath, file);
      }
      if (resource.type === 'video') {
        editor.chain().focus().setVideo({ src: resource.relativePath }).run();
      } else {
        editor.chain().focus().setImage({ src: resource.relativePath, alt: resource.name }).run();
      }
      showToast(`已插入 ${resource.name}`);
    } catch {
      showToast('无法读取媒体，请检查文件权限');
    }
  };

  const selectResource = async (resource: ResourceItem) => {
    if (resource.type === 'video') { await insertResourceMedia(resource); return; }
    if (resource.type === 'image') {
      try {
        const file = resource.file ?? (resource.url ? undefined : await readResource(resource));
        const url = resource.url ?? (file && registerMediaBlob(resource.relativePath, file));
        if (!url) throw new Error('Missing image');
        setPreviewImageInfo({ ...resource, url, file });
      } catch {
        showToast('无法预览图片，请检查文件权限');
      }
      return;
    }
    if (!editor || resource.type !== 'file' || activeResourceId === resource.id) return;
    const previousDocumentId = documentId.current;
    try {
      const file = await readResource(resource);
      if (!file) throw new Error('Missing file');
      const content = parseSafeEditorContent(editor, await file.text());
      if (documentId.current !== previousDocumentId) return;
      await storeDraft(previousDocumentId, documentNameRef.current, editor.getHTML());
      if (documentId.current !== previousDocumentId) return;
      const nextId = resourceDocumentIds.current.get(resource.id) ?? crypto.randomUUID();
      resourceDocumentIds.current.set(resource.id, nextId);
      switchDocument(resource.name, nextId);
      setCurrentFileHandle(resource.handle ?? null);
      setActiveResourceId(resource.id);
      editor.commands.setContent(content);
      showToast(`已打开文档 ${resource.name}`);
    } catch {
      showToast('无法打开文件或备份当前文档，请检查权限与存储空间');
    }
  };

  const handleCreateNewFileInWorkspace = async (fileName: string) => {
    try { if (editor) await storeDraft(documentId.current, docName, editor.getHTML()); }
    catch { showToast('无法备份当前文档，请先导出'); return; }
    if (currentDirectoryHandle) {
      try {
        try {
          await currentDirectoryHandle.getFileHandle(fileName);
          showToast('此文件夹中已有同名文件，请换一个名称');
          return;
        } catch (error) {
          if (!(error instanceof DOMException) || error.name !== 'NotFoundError') throw error;
        }
        const fileHandle = await currentDirectoryHandle.getFileHandle(fileName, { create: true });
        const writable = await fileHandle.createWritable();
        const title = fileName.replace(/\.md$/, '');
        const initialText = `# ${title}\n\n开始编写 ${title}...\n`;
        await writable.write(initialText);
        await writable.close();

        switchDocument(fileName);
        setCurrentFileHandle(fileHandle);
        setActiveResourceId(fileName);
        if (editor) editor.commands.setContent(parseSafeEditorContent(editor, initialText));

        await refreshDirectory();
        showToast(`已在工作区 ${currentDirectoryName} 中创建并保存 ${fileName}`);
      } catch (err: any) {
        console.error('新建文件保存失败:', err);
        showToast(`创建失败: ${err.message || '受限于文件夹读写权限'}`);
      }
    } else {
      // Memory / fallback mode
      const title = fileName.replace(/\.md$/, '');
      const initialText = `# ${title}\n\n开始编写 ${title}...\n`;
      switchDocument(fileName);
      setCurrentFileHandle(null);
      editor?.commands.setContent(initialText);

      const newRes: ResourceItem = {
        id: Date.now().toString(),
        name: fileName,
        relativePath: fileName,
        type: 'file',
      };
      setResources(prev => [newRes, ...prev]);
      showToast(`已创建并切换至 ${fileName}`);
    }
  };

  const openAppFile = async () => {
    try {if(editor)await storeDraft(documentId.current,docName,editor.getHTML());} catch {showToast('无法备份当前文档，请先导出');return;}
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
      switchDocument(handle.name);
      if (editor) editor.commands.setContent(parseSafeEditorContent(editor, content));
      setCurrentFileHandle(handle);
      showToast(`已打开文档 ${handle.name}`);
      
      // Add to resources if not already there
      setResources(prev => {
        if (prev.find(r => r.name === handle.name)) return prev;
        return [...prev, { id: handle.name, name: handle.name, relativePath: handle.name, type: 'file', handle }];
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
          switchDocument(file.name);
          editor.commands.setContent(parseSafeEditorContent(editor, re.target.result as string));
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

    if (currentDirectoryHandle) {
      await syncMediaToDirectory(currentDirectoryHandle);
    }

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
          return [...prev, { id: handle.name, name: handle.name, relativePath: handle.name, type: 'file', handle }];
        });

        setSaveState('已保存到文件');
        showToast(`文件已成功另存为 ${handle.name}`);
      } catch (err: any) {
        if (err.name === 'AbortError') {
          return; // 用户取消了另存为弹窗
        }
        console.warn('showSaveFilePicker 另存为受限或失败，降级下载:', err);
        const blob = new Blob([markdownOutput], { type: 'text/markdown;charset=utf-8' });
        saveAs(blob, defaultName);
        setSaveState('已请求下载副本');
        showToast(`已请求下载副本 ${defaultName}`);
      }
    } else {
      const blob = new Blob([markdownOutput], { type: 'text/markdown;charset=utf-8' });
      saveAs(blob, defaultName);
      setSaveState('已请求下载副本');
      showToast(`已请求下载副本 ${defaultName}`);
    }
  };

  // 保存：直接保存到打开的源文件中，若无源文件句柄则自动转为“另存为”
  const saveFile = async () => {
    if (!editor) return;

    if (currentDirectoryHandle) {
      await syncMediaToDirectory(currentDirectoryHandle);
    }

    if (currentFileHandle && typeof currentFileHandle.createWritable === 'function') {
      try {
        const writable = await currentFileHandle.createWritable();
        const markdownOutput = (editor.storage as any).markdown.getMarkdown();
        await writable.write(markdownOutput);
        await writable.close();
        setSaveState('已保存到文件');
        showToast(`已保存至源文件 ${docName}`);
        return;
      } catch (err: any) {
        console.warn('写回源文件失败，准备弹出另存为:', err);
      }
    }

    // 若当前没有可写的源文件句柄，直接自动转为另存为
    saveAsFile();
  };

  // 综合键盘快捷键监听
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrlOrMeta = e.ctrlKey || e.metaKey;

      // Ctrl + S (保存) / Ctrl + Shift + S (另存为)
      if (isCtrlOrMeta && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (e.shiftKey) {
          saveAsFile();
        } else {
          saveFile();
        }
        return;
      }

      // Ctrl + O (打开本地文件)
      if (isCtrlOrMeta && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        fileInputRef.current?.click();
        return;
      }

      // Ctrl + Alt + N (新建空白文档)
      if (isCtrlOrMeta && e.altKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        createNewFile();
        return;
      }

      // Ctrl + / (切换帮助与指南弹窗)
      if (isCtrlOrMeta && e.key === '/') {
        e.preventDefault();
        setShowHelpModal(prev => !prev);
        return;
      }

      // Escape 键退出各项 Modal 弹窗与浮窗
      if (e.key === 'Escape') {
        setShowHelpModal(false);
        setShowPrivacyModal(false);
        setShowSponsorModal(false);
        setShowCountdownModal(false);
        setShowStudentPickerModal(false);
        setConfirmModal(null);
        setShowSelectionHighlightPopover(false);
        setShowHighlightPopover(false);
        setCropImage(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editor, currentFileHandle, docName]);

  // 导出操作
  const exportMarkdown = () => {
    if (!editor) return;
    try {
      const markdownOutput = (editor.storage as any).markdown?.getMarkdown() || '';
      const blob = new Blob([markdownOutput], { type: 'text/markdown;charset=utf-8' });
      const filename = docName.endsWith('.md') ? docName : `${docName}.md`;
      saveAs(blob, filename);
      showToast('📄 Markdown 文件导出成功！');
    } catch (e) {
      console.error('Export markdown failed:', e);
      showToast('导出 Markdown 失败');
    }
  };

  const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
    let c = hex.replace('#', '');
    if (c.length === 3) {
      c = c.split('').map(x => x + x).join('');
    }
    const num = parseInt(c, 16);
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255
    };
  };

  const parsePageRange = (rangeStr: string, totalPages: number): number[] => {
    if (!rangeStr || !rangeStr.trim()) return Array.from({ length: totalPages }, (_, i) => i + 1);

    const pageSet = new Set<number>();
    const parts = rangeStr.split(/[,，]/);

    for (const part of parts) {
      const trimmed = part.trim();
      if (!trimmed) continue;

      const rangeMatch = trimmed.match(/^(\d+)\s*[-~:─—–..]+\s*(\d+)$/);
      if (rangeMatch) {
        const start = parseInt(rangeMatch[1], 10);
        const end = parseInt(rangeMatch[2], 10);
        if (!isNaN(start) && !isNaN(end)) {
          const min = Math.min(start, end);
          const max = Math.max(start, end);
          for (let p = min; p <= max; p++) {
            if (p >= 1 && p <= totalPages) {
              pageSet.add(p);
            }
          }
        }
      } else {
        const singleNum = parseInt(trimmed, 10);
        if (!isNaN(singleNum) && singleNum >= 1 && singleNum <= totalPages) {
          pageSet.add(singleNum);
        }
      }
    }

    const result = Array.from(pageSet).sort((a, b) => a - b);
    return result.length > 0 ? result : Array.from({ length: totalPages }, (_, i) => i + 1);
  };

  const executeExportPDF = async (exportOpts: PDFExportOptions) => {
    if (!editor) return;
    const editorEl = editor.view.dom;
    if (!editorEl) return;
    
    const captureEl = (editorEl.closest('.writing-canvas') || editorEl.parentElement) as HTMLElement;
    if (!captureEl) return;

    setIsPdfModalGenerating(true);
    setPdfExportProgress(5);
    setPdfExportStatusText('正在初始化导出配置与排版测算...');

    const themeObj = THEME_OPTIONS.find(t => t.id === theme);
    const bgHex = exportOpts.printFriendly ? '#ffffff' : themeObj?.bgHex || '#ffffff';

    const originalTransform = captureEl.style.transform;
    const originalZoom = captureEl.style.zoom;
    const originalHeight = captureEl.style.height;
    const originalOverflow = captureEl.style.overflow;

    try {
      const [{generateCanvasFromDom}, {jsPDF}] = await Promise.all([import('./utils/exportCanvas'), import('jspdf')]);
      showToast('正在生成 A4 图像 PDF…');

      captureEl.style.transform = 'none';
      captureEl.style.zoom = '1';
      captureEl.style.height = 'auto';
      captureEl.style.overflow = 'visible';

      setPdfExportProgress(20);
      setPdfExportStatusText('正在按选定采样精度绘制 DOM 画布...');

      const scale = exportOpts.pageQuality === 'high' ? 2 : 1.5;
      const editorHtml = withExportBrand(renderExportHtml(editor.getHTML()), exportOpts.showBrandHeader);
      let canvas: HTMLCanvasElement | null = null;
      try {
        canvas = await generateCanvasFromDom(captureEl, bgHex, scale, editorHtml, undefined, exportOpts.printFriendly);
      } catch (errRender) {
        console.warn('High quality canvas render failed, trying standard quality...', errRender);
        setPdfExportProgress(35);
        setPdfExportStatusText('正在降级为 较低采样精度渲染...');
        canvas = await generateCanvasFromDom(captureEl, bgHex, 1, editorHtml, undefined, exportOpts.printFriendly);
      }

      if (!canvas || canvas.width === 0 || canvas.height === 0) {
        throw new Error('Canvas render failed on all attempts');
      }

      setPdfExportProgress(50);
      setPdfExportStatusText('画布绘制成功，正在按 A4 规格精准排版切分...');

      const {pageHeight: pageCanvasHeight, margin: marginTopPx, pages} = getPdfPages(canvas, bgHex);
      const totalPages = pages.length;

      let targetPageNumbers: number[] = Array.from({ length: totalPages }, (_, i) => i + 1);
      if (exportOpts.pageRangeType === 'custom') {
        targetPageNumbers = parsePageRange(exportOpts.customPages, totalPages);
      }

      const totalExportCount = targetPageNumbers.length;
      const pdf = new jsPDF('p', 'mm', 'a4');

      for (let outputIdx = 0; outputIdx < totalExportCount; outputIdx++) {
        const pageNum1Based = targetPageNumbers[outputIdx];
        const progressVal = Math.round(50 + ((outputIdx + 1) / totalExportCount) * 45);
        setPdfExportProgress(progressVal);
        setPdfExportStatusText(`正在合成第 ${outputIdx + 1} / ${totalExportCount} 页 (原文档第 ${pageNum1Based} 页)...`);

        await new Promise((resolve) => setTimeout(resolve, 20));

        if (outputIdx > 0) {
          pdf.addPage();
        }

        const pageIdx = pageNum1Based - 1;

        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = pageCanvasHeight;
        const ctx = pageCanvas.getContext('2d');

        if (ctx) {
          ctx.fillStyle = bgHex;
          ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);

          const {start: startY, height: sliceH} = pages[pageIdx];

          ctx.drawImage(
            canvas,
            0, startY, canvas.width, sliceH,
            0, marginTopPx, canvas.width, sliceH
          );
        }

        const pageDataUrl = pageCanvas.toDataURL('image/jpeg', exportOpts.pageQuality === 'high' ? .93 : .87);
        pdf.addImage(pageDataUrl, 'JPEG', 0, 0, 210, 297);
      }

      setPdfExportProgress(95);
      setPdfExportStatusText('正在打包压缩 PDF 文档...');

      const cleanName = (docName || 'document').replace(/[\\/:*?"<>|]/g, '_');
      pdf.save(`${cleanName}.pdf`);

      setPdfExportProgress(100);
      setPdfExportStatusText('导出完成！');
      showToast('📄 高品质 PDF 文档导出成功！');

      setTimeout(() => {
        setIsPdfModalOpen(false);
        setIsPdfModalGenerating(false);
      }, 500);
    } catch (err) {
      console.error('PDF export failed', err);
      showToast('❌ PDF 导出生成失败，请稍后重试');
      setIsPdfModalGenerating(false);
    } finally {
      captureEl.style.transform = originalTransform;
      captureEl.style.zoom = originalZoom;
      captureEl.style.height = originalHeight;
      captureEl.style.overflow = originalOverflow;
    }
  };

  const executeExportImage = async (imageOpts: ImageExportOptions) => {
    if (!editor) return;
    const editorEl = editor.view.dom;
    const captureEl = (editorEl.closest('.writing-canvas') || editorEl.parentElement) as HTMLElement;
    if (!captureEl) return;

    setIsPdfModalGenerating(true);
    setPdfExportProgress(10);
    setPdfExportStatusText('正在初始化长图像素捕获...');

    const originalTransform = captureEl.style.transform;
    const originalZoom = captureEl.style.zoom;
    const originalHeight = captureEl.style.height;
    const originalOverflow = captureEl.style.overflow;
    const originalPadding = captureEl.style.padding;

    let bgHex = '#ffffff';
    if (!imageOpts.printFriendly && imageOpts.bgColorType === 'theme') {
      const themeObj = THEME_OPTIONS.find(t => t.id === theme);
      bgHex = themeObj?.bgHex || '#ffffff';
    } else if (!imageOpts.printFriendly && imageOpts.bgColorType === 'dark') {
      bgHex = '#0b0f19';
    } else {
      bgHex = '#ffffff';
    }

    const padValue = imageOpts.padding === 'tight' ? '16px' : imageOpts.padding === 'relaxed' ? '48px' : '32px';

    try {
      showToast('⏳ 正在生成长图，请稍候...');

      captureEl.style.transform = 'none';
      captureEl.style.zoom = '1';
      captureEl.style.height = 'auto';
      captureEl.style.overflow = 'visible';
      captureEl.style.padding = padValue;

      setPdfExportProgress(35);
      setPdfExportStatusText(`正在以 ${imageOpts.pixelRatio}x 像素密度渲染全景 DOM...`);

      const {generateCanvasFromDom} = await import('./utils/exportCanvas');
      const editorHtml = withExportBrand(renderExportHtml(editor.getHTML()), imageOpts.showBrandHeader);
      let canvas: HTMLCanvasElement | null = null;
      try {
        canvas = await generateCanvasFromDom(captureEl, bgHex, imageOpts.pixelRatio, editorHtml, padValue, imageOpts.printFriendly);
      } catch (errRender) {
        console.warn('High quality image render failed, trying standard quality...', errRender);
        setPdfExportProgress(50);
        setPdfExportStatusText('正在降级渲染 1x 长图...');
        canvas = await generateCanvasFromDom(captureEl, bgHex, 1, editorHtml, padValue, imageOpts.printFriendly);
      }

      if (!canvas || canvas.width === 0 || canvas.height === 0) {
        throw new Error('Canvas render returned empty');
      }

      setPdfExportProgress(85);
      setPdfExportStatusText('正在编码封装 PNG 图片文件...');

      const cleanName = (docName || 'document').replace(/[\\/:*?"<>|]/g, '_');
      const filename = `${cleanName}-${Date.now()}.png`;

      canvas.toBlob((blob) => {
        if (blob) {
          saveAs(blob, filename);
          showToast('🖼️ 文档长图导出成功！');
        } else {
          const imgData = canvas!.toDataURL('image/png');
          const link = document.createElement('a');
          link.download = filename;
          link.href = imgData;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          showToast('🖼️ 文档长图导出成功！');
        }

        setPdfExportProgress(100);
        setPdfExportStatusText('导出完成！');

        setTimeout(() => {
          setIsPdfModalOpen(false);
          setIsPdfModalGenerating(false);
        }, 500);
      }, 'image/png');
    } catch (err) {
      console.error('Image export failed', err);
      showToast('❌ 长图生成导出失败，请稍后重试');
      setIsPdfModalGenerating(false);
    } finally {
      captureEl.style.transform = originalTransform;
      captureEl.style.zoom = originalZoom;
      captureEl.style.height = originalHeight;
      captureEl.style.overflow = originalOverflow;
      captureEl.style.padding = originalPadding;
    }
  };

  const previewExport = async (tab: 'pdf' | 'image', options: PDFExportOptions | ImageExportOptions) => {
    if (!editor) throw new Error('Editor unavailable');
    const capture = (editor.view.dom.closest('.writing-canvas') || editor.view.dom.parentElement) as HTMLElement;
    const currentBackground = THEME_OPTIONS.find(item => item.id === theme)?.bgHex || '#ffffff';
    const image = 'bgColorType' in options ? options : undefined;
    const background = options.printFriendly || image?.bgColorType === 'white' ? '#ffffff' : image?.bgColorType === 'dark' ? '#0b0f19' : currentBackground;
    const {generateCanvasFromDom} = await import('./utils/exportCanvas');
    const html = withExportBrand(renderExportHtml(editor.getHTML()), options.showBrandHeader);
    const padding = image?.padding === 'tight' ? '16px' : image?.padding === 'relaxed' ? '48px' : image ? '32px' : undefined;
    const canvas = await generateCanvasFromDom(capture, background, 1, html, padding, options.printFriendly);
    const width = Math.min(460, canvas.width);
    const isPdf = tab === 'pdf';
    const {pageHeight, margin, pages: renderedPages} = getPdfPages(canvas, background);
    const totalPages = renderedPages.length;
    const pages = 'pageRangeType' in options && options.pageRangeType === 'custom'
      ? parsePageRange(options.customPages, totalPages)
      : Array.from({length: totalPages}, (_, index) => index + 1);
    const previewPage = isPdf ? renderedPages[pages[0] - 1] : undefined;
    const start = previewPage?.start ?? 0;
    const contentHeight = previewPage?.height ?? Math.min(canvas.height, canvas.width * 2);
    const thumbnail = document.createElement('canvas');
    const factor = width / canvas.width;
    thumbnail.width = width;
    thumbnail.height = Math.round((isPdf ? pageHeight : contentHeight) * factor);
    const context = thumbnail.getContext('2d');
    if (!context) throw new Error('Preview canvas unavailable');
    context.fillStyle = background;
    context.fillRect(0, 0, width, thumbnail.height);
    context.drawImage(canvas, 0, start, canvas.width, contentHeight, 0, isPdf ? margin * factor : 0, width, contentHeight * factor);
    const ratio = image?.pixelRatio ?? 1;
    return {src: thumbnail.toDataURL('image/png'), description: isPdf
      ? `预计 ${pages.length} 页 A4 · 预览文档第 ${pages[0]} 页`
      : `顶部预览 · 预计 ${canvas.width * ratio} × ${canvas.height * ratio} 像素`};
  };

  const exportPDF = () => {
    setExportModalTab('pdf');
    setPdfExportProgress(0);
    setPdfExportStatusText('');
    setIsPdfModalOpen(true);
  };

  const exportImage = () => {
    setExportModalTab('image');
    setPdfExportProgress(0);
    setPdfExportStatusText('');
    setIsPdfModalOpen(true);
  };

  const pasteMarkdown = async () => {
    if (!editor) return;
    try {
      const text = await navigator.clipboard.readText();
      if (!text.trim()) { showToast('剪贴板中没有 Markdown 文本'); return; }
      const content = parseSafeEditorSlice(editor, text);
      if (!content || !editor.chain().focus().insertContent(content).run()) {
        showToast('无法插入剪贴板内容');
      }
    } catch {
      showToast('无法读取剪贴板，请检查浏览器的剪贴板权限');
    }
  };

  const exportHTML = async () => {
    if (!editor) return;
    try {
      const htmlOutput = renderExportHtml(editor.getHTML(), true);
      const {buildExportHtml} = await import('./utils/exportHtml');
      const fullHtml = buildExportHtml(htmlOutput, markdownSkin);
      const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
      saveAs(blob, 'fluxmark-document.html');
      showToast('🌐 HTML 网页导出成功！');
    } catch (e) {
      console.error('Export HTML failed:', e);
      showToast('导出 HTML 网页失败');
    }
  };

  const exportWord = async () => {
    if (!editor) return;
    try {
      showToast('⏳ 正在生成 Word 文档，请稍候...');
      const {buildWordDocument} = await import('./utils/exportWord');
      const blob = await buildWordDocument(editor.getJSON());
      saveAs(blob, (docName || 'document').replace(/\.md$/i, '') + '.docx');
      showToast('📝 Word 文档 (.docx) 导出成功！');
    } catch (e) {
      console.error('Export Word docx failed:', e);
      showToast('导出 Word 文档失败，请重试');
    }
  };

  // 通用媒体处理：保存至 .med 相对路径文件夹并引用相对路径
  const processAndInsertMediaFile = useCallback(async (file: File) => {
    if (!editor) return;
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (isImage) {
      const { relativePath, fileName } = await saveMediaToMedFolder(file, file.name, currentDirectoryHandle);
      editor.chain().focus().setImage({ src: relativePath, alt: fileName }).run();
      if (currentDirectoryHandle) {
        refreshDirectory();
      } else {
        setResources(prev => [{
          id: relativePath,
          name: fileName,
          relativePath,
          type: 'image',
          file,
          url: getMediaBlobUrl(relativePath) || undefined,
        }, ...prev]);
      }
      showToast(`图片已自动保存至 ${relativePath} 并插入文档`);
    } else if (isVideo) {
      const { relativePath, fileName } = await saveMediaToMedFolder(file, file.name, currentDirectoryHandle);
      editor.chain().focus().setVideo({ src: relativePath }).run();
      if (currentDirectoryHandle) {
        refreshDirectory();
      } else {
        setResources(prev => [{
          id: relativePath,
          name: fileName,
          relativePath,
          type: 'video' as any,
          file,
          url: getMediaBlobUrl(relativePath) || undefined,
        }, ...prev]);
      }
      showToast(`视频已自动保存至 ${relativePath} 并插入文档`);
    }
  }, [editor, currentDirectoryHandle, refreshDirectory, showToast]);

  processAndInsertMediaFileRef.current = processAndInsertMediaFile;

  // 图片上传与裁剪
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (re) => setCropImage(re.target?.result as string);
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editor) {
      const { relativePath, fileName } = await saveMediaToMedFolder(file, file.name, currentDirectoryHandle);
      editor.chain().focus().setVideo({ src: relativePath }).run();
      if (currentDirectoryHandle) {
        refreshDirectory();
      } else {
        setResources(prev => [{
          id: relativePath,
          name: fileName,
          relativePath,
          type: 'video' as any,
          file,
          url: getMediaBlobUrl(relativePath) || undefined,
        }, ...prev]);
      }
      showToast(`视频已自动保存至 ${relativePath} 并成功插入文档`);
    }
    e.target.value = '';
  };

  const handleCrop = async () => {
    if (cropperRef.current && editor) {
      const canvas = cropperRef.current.getCroppedCanvas();
      if (canvas) {
        canvas.toBlob(async (blob) => {
          if (blob) {
            const { relativePath, fileName } = await saveMediaToMedFolder(blob, 'cropped_image.png', currentDirectoryHandle);
            editor.chain().focus().setImage({ src: relativePath, alt: fileName }).run();
            if (currentDirectoryHandle) {
              refreshDirectory();
            } else {
              setResources(prev => [{
                id: relativePath,
                name: fileName,
                relativePath,
                type: 'image',
                file: blob,
                url: getMediaBlobUrl(relativePath) || undefined,
              }, ...prev]);
            }
            showToast(`图片已自动保存至 ${relativePath} 并插入文档`);
          }
        }, 'image/png');
      }
      setCropImage(null);
    }
  };

  // Timer Logic
  useEffect(() => {
    let interval: any;
    if (isTimerActive && isPresentation) {
      let lastTick = Date.now();
      interval = setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now-lastTick)/1000);
        if (!elapsed) return;
        lastTick += elapsed*1000;
        if (isCountdownMode) {
          setTimerTime(prev => {
                if (prev <= 10 && prev > 0) {
                  playAlarmSound(440, 0.1);
                }
                if (prev <= elapsed) {
                  playAlarmSound(880, 0.3);
                  setIsTimerActive(false);
                  setTimeout(() => showToast('倒计时结束'), 0);
                  return 0;
                }
                return Math.max(0, prev - elapsed);
          });
        } else {
          setTimerTime(prev => prev + elapsed);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, isPresentation, isCountdownMode, playAlarmSound]);

  const startCountdown = (minutes: number) => {
    if (!Number.isFinite(minutes) || minutes <= 0 || minutes > 180) { showToast("请输入 1–180 分钟"); return; }
    setTimerTime(Math.round(minutes * 60));
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
    
    // Reset scroll positions when entering presentation mode so fixed layout is not offset
    window.scrollTo(0, 0);
    const vp = document.getElementById('editor-viewport');
    if (vp) vp.scrollTop = 0;
    
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
      const rawSlides = splitPresentationSlides(fullHtml);
      const slideCount = rawSlides.length || 1;

      if (isEditing) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowRight') {
          e.preventDefault();
          changeSlideIndex(prev => Math.min(slideCount - 1, prev + 1));
        } else if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowLeft') {
          e.preventDefault();
          changeSlideIndex(prev => Math.max(0, prev - 1));
        } else if (e.key === 'PageDown') {
          e.preventDefault();
          changeSlideIndex(prev => Math.min(slideCount - 1, prev + 1));
        } else if (e.key === 'PageUp') {
          e.preventDefault();
          changeSlideIndex(prev => Math.max(0, prev - 1));
        } else if (e.key === 'Escape') {
          setIsPresentation(false);
        }
        return;
      }

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault();
        changeSlideIndex(prev => Math.min(slideCount - 1, prev + 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        changeSlideIndex(prev => Math.max(0, prev - 1));
      } else if (e.key === 'Home') {
        e.preventDefault();
        changeSlideIndex(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        changeSlideIndex(slideCount - 1);
      } else if (e.key === 'Escape') {
        setIsPresentation(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPresentation, editor]);

  function renderExportHtml(html: string, standalone = false) {
    const template = document.createElement('template');
    template.innerHTML = cleanDocumentHtml(html);
    template.content.querySelectorAll<HTMLElement>('[data-type="inline-math"], [data-type="block-math"]').forEach(node => {
      node.innerHTML = katex.renderToString(node.dataset.latex ?? node.getAttribute('latex') ?? '', {
        displayMode: node.dataset.type === 'block-math',
        output: standalone ? 'mathml' : 'html',
        throwOnError: false,
        trust: false,
      });
    });
    return template.innerHTML;
  }

  const jumpToPresentationSource = (index: number) => {
    if (!editor) return;
    let page = 0;
    let position = 1;
    editor.state.doc.forEach((node, offset) => {
      if (node.type.name === 'horizontalRule' && ++page === index) {
        position = Math.min(editor.state.doc.content.size, offset + node.nodeSize + 1);
      }
    });
    setShowPresentationPreview(false);
    requestAnimationFrame(() => editor.chain().focus().setTextSelection(position).scrollIntoView().run());
  };
  const togglePresentation = async () => {
    if (!isPresentation) {
      // Mount the slide after fullscreen has established the presentation size.
      await containerRef.current?.requestFullscreen().catch(() => {});
      setCurrentSlideIndex(0);
      setSlideEditing(false);
      setPresentTool('select');
      annotationPages.current={};
      setIsPresentation(true);
      setTimerTime(0);
      setIsCountdownMode(false);
      setIsTimerActive(true);
    } else {
      setIsPresentation(false);
      setIsTimerActive(false);
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  const restoreDraft = async (draft: Draft) => {
    if (!editor) return;
    try {
      await storeDraft(documentId.current, docName, editor.getHTML());
      setCurrentFileHandle(null);
      switchDocument(draft.name, draft.documentId);
      editor.commands.setContent(parseSafeEditorContent(editor, draft.html));
    } catch { showToast('无法备份当前内容，请先导出'); }
  };

  const localWikiNotes = useMemo(() => resourceNotes(resources), [resources]);
  const currentWikiId = activeResourceId && localWikiNotes.some(note => note.resource?.id === activeResourceId)
    ? 'file:' + activeResourceId : 'draft:' + documentId.current;
  const currentWikiPath = localWikiNotes.find(note => note.id === currentWikiId)?.path ?? docName;
  const wikiNotes = useMemo(() => {
    const current: WikiNote = { id: currentWikiId, title: docName, path: currentWikiPath };
    const known = new Set([documentId.current, ...resourceDocumentIds.current.values()]);
    const browserNotes: WikiNote[] = [];
    for (const draft of wikiDrafts) {
      if (known.has(draft.documentId)) continue;
      known.add(draft.documentId);
      browserNotes.push({ id: 'draft:' + draft.documentId, title: draft.name, path: draft.name, draft });
    }
    return [localWikiNotes.find(note => note.id === currentWikiId) ?? current,
      ...localWikiNotes.filter(note => note.id !== currentWikiId), ...browserNotes];
  }, [currentWikiId, currentWikiPath, docName, localWikiNotes, wikiDrafts]);

  const needsWikiIndex = showGraph || (showSidebar && activeSidebarTab === 'backlinks');
  useEffect(() => {
    if (!needsWikiIndex || !editor || !localWikiNotes.length) {
      setIndexingWiki(false);
      return;
    }
    let active = true;
    setIndexingWiki(true);
    setDiskWikiTargets({});
    void (async () => {
      const targets: Record<string, string[]> = {};
      for (const note of localWikiNotes) {
        if (!active) return;
        try {
          const file = await readResource(note.resource!);
          if (!active) return;
          if (file) {
            const parser = (editor.storage as any).markdown.parser;
            targets[note.id] = wikiTargets(parser.parse(await file.text()));
          }
        } catch { /* Leave inaccessible files visible as unindexed nodes. */ }
      }
      if (active) {
        setDiskWikiTargets(targets);
        setIndexingWiki(false);
      }
    })();
    return () => { active = false; };
  }, [editor, localWikiNotes, needsWikiIndex]);

  const wikiEdges = useMemo(() => {
    if (!needsWikiIndex) return [];
    const edges: WikiEdge[] = [];
    for (const note of wikiNotes) {
      const targets = note.id === currentWikiId ? currentWikiTargets
        : note.draft ? wikiTargets(note.draft.html) : diskWikiTargets[note.id] ?? [];
      const linked = new Set<string>();
      for (const target of targets) {
        const matches = wikiMatches(wikiNotes, target, note.path);
        if (matches.length !== 1 || matches[0].id === note.id || linked.has(matches[0].id)) continue;
        linked.add(matches[0].id);
        edges.push({ source: note.id, target: matches[0].id });
      }
    }
    return edges;
  }, [needsWikiIndex, wikiNotes, currentWikiId, currentWikiTargets, diskWikiTargets]);

  const openWikiNote = async (note: WikiNote) => {
    if (note.id !== currentWikiId) {
      if (note.resource) await selectResource(note.resource);
      else if (note.draft) await restoreDraft(note.draft);
    }
    setShowGraph(false);
  };

  const followWikiLink = (target: string) => {
    const matches = wikiMatches(wikiNotes, target, currentWikiPath);
    if (matches.length === 1) void openWikiNote(matches[0]);
    else showToast(matches.length ? '找到多个同名文档，请使用文件夹路径区分' : `未找到链接文档「${target}」`);
  };

  const backlinks = wikiNotes.filter(note => wikiEdges.some(edge => edge.source === note.id && edge.target === currentWikiId));

  const presentationHtml = (isPresentation || showPresentationPreview) ? editor?.getHTML() || '' : '';
  const slides = useMemo(() => splitPresentationSlides(presentationHtml), [presentationHtml]);
  const validSlideIndex = Math.min(Math.max(0, currentSlideIndex), slides.length - 1);
  const activeSlideHtml = slides[validSlideIndex];
  const slideLayout = useMemo(() => slideEditing ? 'reading' : getPresentationLayout(activeSlideHtml), [slideEditing, activeSlideHtml]);
  const canPinchSlide = !slideEditing && presentTool === 'select';
  const observeSlideViewport = useCallback((viewport: HTMLDivElement | null) => {
    releaseSlideViewport.current?.();
    releaseSlideViewport.current = undefined;
    slideViewport.current = viewport;
    if (!viewport) return;
    const measure = () => setSlideOverflow(viewport.scrollHeight > viewport.clientHeight + 2);
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    const flow = viewport.querySelector<HTMLElement>('.presentation-flow');
    if (flow) observer.observe(flow);
    const disablePinch = canPinchSlide && flow ? enablePresentationPinch(viewport, flow) : undefined;
    releaseSlideViewport.current = () => {
      observer.disconnect();
      disablePinch?.();
    };
    measure();
  }, [canPinchSlide, validSlideIndex]);

  useLayoutEffect(() => {
    if (!isPresentation || !slideEditor) return;
    const targetContent = activeSlideHtml || '<p></p>';
    if (slideEditor.getHTML() !== targetContent) {
      isUpdatingFromSlideRef.current = true;
      try {
        slideEditor.commands.setContent(targetContent, { emitUpdate: false });
      } finally {
        isUpdatingFromSlideRef.current = false;
      }
    }
    if (!fitSlides || slideEditing) return;
    const viewport = slideViewport.current;
    const flow = viewport?.querySelector<HTMLElement>('.presentation-flow');
    const content = flow?.querySelector<HTMLElement>('.presentation-content');
    if (!viewport || !flow || !content || slideLayout === 'empty') return;

    const fit = () => {
      content.style.removeProperty('zoom');
      content.style.removeProperty('width');
      const width = content.offsetWidth;
      const height = content.offsetHeight;
      const padding = getComputedStyle(flow);
      const available = viewport.clientHeight - parseFloat(padding.paddingTop) - parseFloat(padding.paddingBottom);
      if (!width || !height || available <= 0) return;
      const scale = Math.max(.8, Math.min(1, (available - 2) / height));
      content.style.width = `${width}px`;
      content.style.zoom = String(scale);
    };

    viewport.scrollTop = 0;
    fit();
    // A slide's content must not trigger another fit after it has been shown.
    let windowWidth = window.innerWidth;
    let windowHeight = window.innerHeight;
    const resize = () => {
      if (windowWidth === window.innerWidth && windowHeight === window.innerHeight) return;
      windowWidth = window.innerWidth;
      windowHeight = window.innerHeight;
      fit();
    };
    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('resize', resize);
      content.style.removeProperty('width');
      content.style.removeProperty('zoom');
    };
  }, [isPresentation, fitSlides, slideEditing, validSlideIndex, activeSlideHtml, slideLayout, slideEditor, markdownSkin]);

  const scale = isPresentation ? 1 : workspaceScale;
  return (
    <div ref={workspaceViewport} className="workspace-zoom-viewport">
      <div className="workspace-zoom-frame" style={scale === 1 ? undefined : {width: `${scale * 100}vw`, height: `${scale * 100}dvh`}}>
    <div ref={containerRef} className="flux-shell h-screen flex flex-col font-sans relative overflow-hidden select-none bg-[var(--bg-secondary)]"
      style={scale === 1 ? undefined : {transform: `scale(${scale})`}}>
      {/* --- 顶部工具栏 --- */}
      <WorkspaceChrome settings={settingsOpen} setSettings={setSettingsOpen} name={docName} status={saveState} sidebar={showSidebar} ai={showAIChat} theme={theme} themes={THEME_OPTIONS} font={fontFamily} fonts={FONT_OPTIONS}
        onName={setDocName} onSidebar={()=>setShowSidebar(v=>!v)} onAI={()=>setShowAIChat(v=>!v)} onPresent={()=>setShowPresentationPreview(true)} onTheme={v=>setTheme(v as Theme)} onFont={setFontFamily} onSave={saveFile}
        fileActions={[{label:'粘贴为 Markdown',run:pasteMarkdown},{label:'新建文档',run:createNewFile},{label:'打开文件…',run:openAppFile},{label:'另存为…',run:saveAsFile},{label:'从模板开始…',run:()=>setShowTemplateModal(true)},{label:'插入图片…',run:()=>{const input=document.createElement('input');input.type='file';input.accept='image/*';input.onchange=handleImageUpload as any;input.click();}},{label:'插入视频…',run:()=>{const input=document.createElement('input');input.type='file';input.accept='video/*';input.onchange=handleVideoUpload as any;input.click();}}]}
        exportActions={[{label:'Markdown · 可继续编辑',run:exportMarkdown},{label:'PDF · 打印与分享',run:exportPDF},{label:'图片 · 长图分享',run:exportImage},{label:'Word · 办公文档',run:exportWord},{label:'HTML · 网页文件',run:exportHTML}]}
        helpActions={[{label:'快捷键与使用指南',run:()=>setShowHelpModal(true)},{label:'隐私与数据说明',run:()=>setShowPrivacyModal(true)}]} />



      {/* --- Main Content --- */}
      {showPresentationPreview && <PresentationPreview slides={slides} onClose={()=>setShowPresentationPreview(false)} onJump={jumpToPresentationSource} onStart={()=>{setShowPresentationPreview(false);togglePresentation();}}/>}
      <main className="workspace-body flex-1 flex overflow-hidden relative">
        {!isPresentation && <nav className="workspace-ribbon" aria-label="工作区导航">
          <button type="button" title="文件" aria-label="文件浏览器" aria-pressed={showSidebar && activeSidebarTab === 'resources'} onClick={() => { setActiveSidebarTab('resources'); setShowSidebar(true); }}><Files size={18} /></button>
          <button type="button" title="大纲" aria-label="文档大纲" aria-pressed={showSidebar && activeSidebarTab === 'outline'} onClick={() => { setActiveSidebarTab('outline'); setShowSidebar(true); }}><ListTree size={18} /></button>
          <button type="button" title="反向链接" aria-label="反向链接" aria-pressed={showSidebar && activeSidebarTab === 'backlinks'} onClick={() => { setActiveSidebarTab('backlinks'); setShowSidebar(true); }}><Link2 size={18} /></button>
          <button type="button" title="知识星图" aria-label="知识星图" aria-pressed={showGraph} onClick={() => {
            if (!showGraph && window.innerWidth <= 640) setShowSidebar(false);
            setShowGraph(!showGraph);
          }}><Network size={18} /></button>
          <div className="ribbon-divider" aria-hidden="true" />
          <div className="ribbon-tools" role="group" aria-label="工作区工具">
            <button type="button" onClick={() => setShowSponsorModal(true)} aria-label="支持作者" title="支持作者"><HeartIcon size={17} /></button>
            <WorkspaceTools commands={[{label:'新建文档',run:createNewFile},{label:'打开文件',run:openAppFile},{label:'保存文档',run:saveFile},{label:'导出 Markdown',run:exportMarkdown},{label:'导出 PDF',run:exportPDF},{label:'导出 Word',run:exportWord},{label:'进入演示',run:togglePresentation},{label:'精选模板',run:()=>setShowTemplateModal(true)},{label:'AI 助手',run:()=>setShowAIChat(true)}]} editor={editor} name={docName} documentId={documentId.current} onRestore={restoreDraft}/>
            <button type="button" onClick={() => setSettingsOpen(true)} aria-label="外观与设置" title="外观与设置"><Settings2 size={17} /></button>
          </div>
        </nav>}
        <AnimatePresence>
          {showSidebar && (
            <motion.aside data-workspace-sidebar
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 248, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="border-r border-[var(--border)] bg-[var(--bg-secondary)] overflow-hidden flex flex-col z-30 shrink-0"
            >
              <div className="w-[248px] shrink-0 flex flex-col h-full overflow-hidden">
              <div className="workspace-pane-title">{activeSidebarTab === 'resources' ? '文件浏览器' : activeSidebarTab === 'outline' ? '文档大纲' : '反向链接'}</div>

              <div className="flex-1 overflow-hidden flex flex-col">
                {activeSidebarTab === 'outline' && (
                  <div className="flex flex-col h-full overflow-hidden">
                    {/* Outline Toolbar */}
                    {outline.length > 0 && (
                      <div className="outline-controls px-3 py-2 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-primary)]/50 shrink-0 select-none">
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
                            onClick={insertTableOfContents}
                            className="px-2 py-0.5 text-[10px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-400 dark:hover:bg-blue-900/80 rounded transition-colors flex items-center gap-1 cursor-pointer"
                            title="在文档顶部生成并插入基于 H1-H3 的目录"
                          >
                            <ListTree size={12} />
                            <span>插入目录</span>
                          </button>
                          <span className="text-slate-300 text-[10px]">|</span>
                          <button
                            onClick={expandAllHeadings}
                            className="px-2 py-0.5 text-[10px] font-medium text-slate-500 hover:text-[var(--accent)] hover:bg-slate-100 rounded transition-colors cursor-pointer"
                            title="展开全部"
                          >
                            展开
                          </button>
                          <span className="text-slate-300 text-[10px]">|</span>
                          <button
                            onClick={collapseAllHeadings}
                            className="px-2 py-0.5 text-[10px] font-medium text-slate-500 hover:text-[var(--accent)] hover:bg-slate-100 rounded transition-colors cursor-pointer"
                            title="折叠全部"
                          >
                            折叠
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

                  </div>
                )}
                {activeSidebarTab === 'backlinks' && <section className="backlink-panel" aria-label="文档链接">
                  <h3>链接到本文 <span>{backlinks.length}</span></h3>
                  {indexingWiki && <p role="status">正在读取本地文档…</p>}
                  {!backlinks.length && !indexingWiki && <p>暂无反向链接</p>}
                  {backlinks.map(note => <button type="button" key={note.id} title={note.path} onClick={() => void openWikiNote(note)}><FileText size={15} /><span>{note.title}</span></button>)}
                  <h3>本文链接 <span>{currentWikiTargets.length}</span></h3>
                  {!currentWikiTargets.length && <p>输入 [[文档名]] 创建链接。</p>}
                  {currentWikiTargets.map(target => {
                    const matches = wikiMatches(wikiNotes, target, currentWikiPath);
                    return <button type="button" key={target} title={target} onClick={() => followWikiLink(target)}>
                      <Link2 size={15} /><span>{target}</span>{matches.length !== 1 && <small>{matches.length ? '同名' : '待链接'}</small>}
                    </button>;
                  })}
                </section>}
                <div className={activeSidebarTab === 'resources' ? 'flex flex-1 min-h-0' : 'hidden'}>
                  <ResourceTree key={resourceTreeVersion} resources={resources} directoryName={currentDirectoryName}
                    activeId={activeResourceId} onOpenDirectory={openDirectory}
                    documentName={docName} documentId={documentId.current} onRestore={restoreDraft} onOpenFile={openAppFile}
                    onRefresh={currentDirectoryHandle ? refreshDirectory : undefined}
                    onNew={currentDirectoryHandle ? () => setShowNewFileModal(true) : createNewFile}
                    onSelect={selectResource} onInsertMedia={insertResourceMedia} />
                </div>
              </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {showGraph && !isPresentation && <KnowledgeGraph notes={wikiNotes} edges={wikiEdges} currentId={currentWikiId}
          loading={indexingWiki} onOpen={note => void openWikiNote(note)} onClose={() => setShowGraph(false)} />}
        <div 
          className={`min-w-0 flex-1 ${isPresentation ? "fixed inset-0 z-[1000] flex flex-col overflow-hidden text-slate-100" : showGraph ? "hidden" : "overflow-y-auto no-scrollbar scroll-smooth bg-[var(--bg-secondary)]"}`}
          id="editor-viewport"
          style={isPresentation ? getPresBgStyle(presBgConfig) : undefined}
          onClick={event => {
            if (isPresentation || !(event.target instanceof Element)) return;
            const link = event.target.closest<HTMLElement>('.tiptap [data-wiki-target]');
            if (link?.dataset.wikiTarget) followWikiLink(link.dataset.wikiTarget);
          }}
          onKeyDown={event => {
            if (isPresentation || event.key !== 'Enter' || !(event.target instanceof HTMLElement)) return;
            if (event.target.dataset.wikiTarget) {
              event.preventDefault();
              followWikiLink(event.target.dataset.wikiTarget);
            }
          }}
        >
          {isPresentation ? (
            <div 
              className="presentation-stage w-full h-full flex flex-col overflow-hidden text-slate-100 relative"
              style={getPresBgStyle(presBgConfig)}
            >
              {/* Presentation Background Pattern / Mesh Overlay */}
              {renderPresPatternOverlay(presBgConfig)}

              <PresentationControls fit={fitSlides} onFit={()=>setFitSlides(v=>!v)} slides={slides} index={validSlideIndex} name={docName} tool={presentTool} editing={slideEditing}
                onSlide={changeSlideIndex} onTool={t=>{setPresentTool(t);setSlideEditing(false);}} onEdit={()=>{setSlideEditing(v=>!v);setPresentTool('select');}}
                onExit={togglePresentation} onClear={clearCanvas} onTimer={()=>setShowCountdownModal(true)} onBackground={()=>setShowPresBgModal(true)} onPicker={()=>setShowStudentPickerModal(true)}
                onColor={c=>{setPresentColor(c);setPresentTool('pen');}} onSize={setPresentSize} onAdd={handleAddSlideInPresentation}
                onDelete={()=>setConfirmModal({isOpen:true,title:'删除当前幻灯片？',message:'删除前会保留草稿恢复点。',onConfirm:async()=>{try{await storeDraft(documentId.current,docName,editor?.getHTML()||'');handleDeleteSlideInPresentation();}catch{showToast('无法创建恢复点，请先保存文档');}}})}/>
              {/* Slide Content Viewport (Static Fixed Full-Screen White Card) */}
              <div className="flex-1 w-full h-[calc(100vh-3rem)] min-h-0 p-3 sm:p-4 md:p-6 relative flex flex-col overflow-hidden">
                {/* Fixed Full-Screen White Rounded Rectangle Container */}
                <div data-fit={fitSlides} className="presentation-slide w-full min-h-0 flex-[1_1_0%] bg-[var(--bg-primary)] text-[var(--text-primary)] rounded-2xl md:rounded-3xl p-6 md:p-12 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] border border-slate-700/50 flex flex-col overflow-hidden relative select-text">
                  <AnimatePresence key={fitSlides ? 'fit' : 'read'} mode="wait" custom={slideDirection} initial={!fitSlides}>
                    <motion.div
                      key={fitSlides ? 'fit' : validSlideIndex}
                      custom={slideDirection}
                      variants={getSlideTransitionVariants(fitSlides ? 'none' : presBgConfig.transitionType || 'slide-x', slideDirection)}
                      initial={fitSlides ? false : 'initial'}
                      animate="animate"
                      exit="exit"
                      transition={{ duration: 0.25, ease: [0.25, 1, 0.5, 1] }}
                      ref={observeSlideViewport}
                      data-touch-zoom={canPinchSlide}
                      className="presentation-scroll w-full min-h-0 flex-1 overflow-auto"
                    >
                      {/* Active Editable Slide Content */}
                      <div className="presentation-flow" data-layout={slideLayout}>
                        {slideLayout === 'empty' && <p className="presentation-empty">此页暂无内容</p>}
                        <EditorContent editor={slideEditor} className="presentation-content" data-markdown-skin={markdownSkin} />
                      </div>
                    </motion.div>
                  </AnimatePresence>
                  {slideOverflow && <span className="presentation-scroll-hint">向下滚动查看更多</span>}
                </div>

                {/* Bottom Keyboard Shortcut Hint */}
                <div className="presentation-shortcuts absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-1.5 bg-slate-800/90 backdrop-blur-md rounded-full border border-slate-700/80 text-[11px] text-slate-400 pointer-events-none z-10 shadow-lg">
                  <span>键盘方向键 <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-slate-200 font-mono text-[10px]">←</kbd> <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-slate-200 font-mono text-[10px]">→</kbd> 或 <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-slate-200 font-mono text-[10px]">PageUp/PageDown</kbd> 切换幻灯片页（可在放映中直接编辑文本）</span>
                </div>
              </div>
            </div>
          ) : (
            <div 
              className="writing-canvas relative mx-auto w-full min-h-full bg-[var(--bg-primary)] group"
              data-markdown-skin={markdownSkin}
              style={{ zoom: zoom }}
              onClick={(e) => {
                const target = e.target as HTMLElement;
                const tocLink = target.closest('[data-toc-pos], [data-toc-text]') as HTMLElement | null;
                if (tocLink) {
                  e.preventDefault();
                  e.stopPropagation();
                  const posStr = tocLink.getAttribute('data-toc-pos');
                  const rawText = tocLink.getAttribute('data-toc-text');
                  const text = rawText ? decodeURIComponent(rawText) : '';
                  const pos = posStr ? parseInt(posStr, 10) : null;
                  jumpToHeadingByTextOrPos(pos, text);
                }
              }}
            >
              <div className="absolute top-6 right-8 flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                {(() => {
                  const count = editor?.storage.characterCount?.characters() || 0;
                  return (
                    <span className="text-[10px] font-mono tracking-wider px-2.5 py-1 rounded-lg border bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border)] transition-all flex items-center gap-1.5">
                      <Type size={12} className="text-[var(--text-secondary)]" />
                      <span>{count.toLocaleString()} 字符</span>
                    </span>
                  );
                })()}
              </div>
              
              <div className="w-full">
                <EditorContent editor={editor} />
              </div>

              <div className="editor-commandbar flex items-center gap-2 bg-[var(--bg-primary)] p-2 border border-[var(--border)] overflow-x-auto no-scrollbar">
                <label className="markdown-skin-picker" data-markdown-skin={markdownSkin} title={MARKDOWN_SKINS.find(skin => skin.id === markdownSkin)?.description}>
                  <Palette size={15} aria-hidden="true" />
                  <select aria-label="Markdown 正文皮肤" value={markdownSkin} onChange={event => changeMarkdownSkin(event.target.value)}>
                    {MARKDOWN_SKINS.map(skin => <option key={skin.id} value={skin.id}>{skin.name}</option>)}
                  </select>
                  <ChevronDown size={12} aria-hidden="true" />
                </label>
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
                <QuickTool icon={<ListTree size={14} className="text-blue-500"/>} onClick={insertTableOfContents} title="在文档顶部生成/更新目录 (基于 H1-H3 标题)" />
                <QuickTool icon={<Quote size={14}/>} onClick={() => applyStyle('quote')} title="引用" isActive={editor?.isActive('blockquote')} />
                <QuickTool icon={<TableIcon size={14}/>} onClick={() => applyStyle('table')} title="插入 / 删除表格" isActive={editor?.isActive('table')} />

                {editor?.isActive('table') && (
                  <div className="flex items-center gap-1 bg-[var(--bg-secondary)] px-1.5 py-0.5 rounded-xl border border-[var(--border)]">
                    <button onClick={() => applyStyle('addRowAfter')} className="px-1.5 py-0.5 text-[10px] hover:bg-indigo-500 hover:text-white rounded text-[var(--text-secondary)] font-medium transition-colors" title="下方插入行">+行</button>
                    <button onClick={() => applyStyle('deleteRow')} className="px-1.5 py-0.5 text-[10px] hover:bg-red-500 hover:text-white rounded text-red-500 font-medium transition-colors" title="删除当前行">-行</button>
                    <span className="w-px h-3 bg-[var(--border)]" />
                    <button onClick={() => applyStyle('addColumnAfter')} className="px-1.5 py-0.5 text-[10px] hover:bg-indigo-500 hover:text-white rounded text-[var(--text-secondary)] font-medium transition-colors" title="右侧插入列">+列</button>
                    <button onClick={() => applyStyle('deleteColumn')} className="px-1.5 py-0.5 text-[10px] hover:bg-red-500 hover:text-white rounded text-red-500 font-medium transition-colors" title="删除当前列">-列</button>
                    <span className="w-px h-3 bg-[var(--border)]" />
                    <button onClick={() => applyStyle('toggleHeaderRow')} className="px-1.5 py-0.5 text-[10px] hover:bg-amber-500 hover:text-white rounded text-amber-600 dark:text-amber-400 font-medium transition-colors" title="切换表头">表头</button>
                  </div>
                )}

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
                 style={{ width: '100%', height: '100%', touchAction: presentTool === 'select' ? 'auto' : 'none' }}
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
            <div className="flex items-center gap-1.5" title="草稿缓存在此浏览器中；使用文件 → 保存写入本地文件">
              <span className="w-2 h-2 rounded-full bg-[var(--text-secondary)]" />
              <span className="font-medium text-[11px]">{saveState}</span>
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

          {/* Right Real-time Character & Word Counter Component */}
          <div className="flex items-center gap-3">
            {(() => {
              const characters = editor?.storage.characterCount?.characters() || 0;
              const words = editor?.storage.characterCount?.words() || 0;

              return (
                <div 
                  className="flex items-center gap-2 px-3 py-1 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-xs font-mono transition-all"
                  title={`当前统计：${characters.toLocaleString()} 字符，${words.toLocaleString()} 词`}
                >
                  <Type size={14} className="text-[var(--text-secondary)] shrink-0" />

                  <div className="flex items-center gap-1.5">
                    <span className="text-[var(--text-primary)] font-bold">
                      {characters.toLocaleString()}
                    </span>
                    <span className="text-[10px] opacity-60 font-sans">字符</span>
                    <span className="opacity-30">|</span>
                    <span className="text-[var(--text-primary)] font-bold">
                      {words.toLocaleString()}
                    </span>
                    <span className="text-[10px] opacity-60 font-sans">词</span>
                  </div>
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
                    <FloatingBtn onClick={() => applyStyle('table')} icon={<TableIcon size={16}/>} label="表格" />
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
        onConfirm={async (processedBase64) => {
          if (editor) {
            try {
              const res = await fetch(processedBase64);
              const blob = await res.blob();
              const { relativePath, fileName } = await saveMediaToMedFolder(blob, 'image.png', currentDirectoryHandle);
              editor.chain().focus().setImage({ src: relativePath, alt: fileName }).run();
              if (currentDirectoryHandle) {
                refreshDirectory();
              } else {
                setResources(prev => [{
                  id: relativePath,
                  name: fileName,
                  relativePath,
                  type: 'image',
                  file: blob,
                  url: getMediaBlobUrl(relativePath) || undefined,
                }, ...prev]);
              }
              showToast(`图片已自动保存至 ${relativePath} 并插入文档`);
            } catch (err) {
              console.error('Error saving cropped image:', err);
              editor.chain().focus().setImage({ src: processedBase64 }).run();
            }
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
                <button
                  onClick={() => {
                    setShowHelpModal(false);
                    setShowPrivacyModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                >
                  <ShieldCheckIcon size={15} className="text-indigo-500" />
                  隐私说明
                </button>
                <button
                  onClick={() => {
                    setShowHelpModal(false);
                    setShowSponsorModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200"
                >
                  <HeartIcon size={15} className="fill-rose-500 text-rose-500" />
                  赏赞支持
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-8 max-h-[60vh] overflow-y-auto no-scrollbar">
                {helpTab === 'tutorial' ? (
                  <div className="space-y-6 text-slate-700">
                    {/* Welcome Banner */}
                    <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-500 text-white rounded-lg shrink-0 mt-0.5 sm:mt-0">
                          <BookOpen size={18} />
                        </div>
                        <div className="text-xs leading-relaxed">
                          <span className="font-bold text-blue-900 block text-sm mb-1">欢迎使用 FluxMark 智能 Markdown 编辑器</span>
                          FluxMark 是一款兼具沉浸创作、AI 辅助写作、多媒体管理与全屏演示放映功能的现代编辑器。
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setShowHelpModal(false);
                          setShowTemplateModal(true);
                        }}
                        className="px-3.5 py-2 bg-[var(--accent)] hover:bg-blue-600 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 shrink-0 transition-all cursor-pointer"
                      >
                        <SparklesIcon size={14} />
                        浏览精选示例模版库
                      </button>
                    </div>

                    {/* Tutorial Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Card 1 */}
                      <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-blue-200 hover:shadow-sm transition-all space-y-2">
                        <div className="flex items-center gap-2 text-blue-600 font-bold text-sm">
                          <Type size={16} />
                          <span>1. 文本排版与智能格式化</span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          直接输入标准 Markdown 语法（如 <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-700"># 标题</code>），或在编辑区中<b>选中文本</b>，唤起浮动工具栏一键加粗、高亮，点击 ✨ <b>智能排版</b> 自动规范中英文空格。
                        </p>
                      </div>

                      {/* Card 2 */}
                      <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-blue-200 hover:shadow-sm transition-all space-y-2">
                        <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                          <ImageIcon size={16} />
                          <span>2. 多媒体与本地文件夹联动</span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          将图片或视频<b>拖拽/粘贴</b>入编辑窗口。关联本地文件夹后，媒体文件会自动存入当前目录下的 <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-700">.med</code> 文件夹。选中图片可在线裁剪！
                        </p>
                      </div>

                      {/* Card 3 */}
                      <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-blue-200 hover:shadow-sm transition-all space-y-2">
                        <div className="flex items-center gap-2 text-amber-600 font-bold text-sm">
                          <SparklesIcon size={16} />
                          <span>3. KaTeX 公式与代码高亮</span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          内置 KaTeX 引擎，支持行内公式 <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-700">$E=mc^2$</code> 与块级高阶方程；代码块支持多语言语法高亮与一键复制。
                        </p>
                      </div>

                      {/* Card 4 */}
                      <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-blue-200 hover:shadow-sm transition-all space-y-2">
                        <div className="flex items-center gap-2 text-purple-600 font-bold text-sm">
                          <SparklesIcon size={16} />
                          <span>4. AI 智能对话与创作辅助</span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          点击右上角的 <b>AI 按钮</b> 唤起对话助手，支持文章润色、内容总结、多语言翻译与续写，兼容 DeepSeek、OpenAI、SiliconFlow 等 API 接口。
                        </p>
                      </div>

                      {/* Card 5 */}
                      <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-blue-200 hover:shadow-sm transition-all space-y-2">
                        <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                          <Monitor size={16} />
                          <span>5. 全屏 PPT 演示与现场批注</span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          在文档中使用 <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-700">---</code> 划定分页，按 <b>F11</b> 或点击顶部放映按钮即可全屏展示！现场提供画笔批注、激光笔、倒计时与随机抽签转盘。
                        </p>
                      </div>

                      {/* Card 6 */}
                      <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-blue-200 hover:shadow-sm transition-all space-y-2">
                        <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
                          <Folder size={16} />
                          <span>6. 多格式导出与安全备份</span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          支持将文档导出为 <b>Markdown、HTML、PDF 及 Word (.docx)</b> 格式；系统具备自动保存与极简离线存储保障，数据隐私全在本地。
                        </p>
                      </div>
                    </div>

                    {/* Pro-Tips footer */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                      <span>💡 小提示：按 <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded font-mono text-[10px] text-slate-600">Ctrl + /</kbd> 也可快速随时打开本帮助中心。</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Search Bar */}
                    <div className="relative">
                      <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={shortcutFilter}
                        onChange={(e) => setShortcutFilter(e.target.value)}
                        placeholder="搜索快捷键或功能... (例如: 加粗, 保存, F11, AI, 高亮, 标题)"
                        className="w-full pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                      {shortcutFilter && (
                        <button
                          onClick={() => setShortcutFilter('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold bg-slate-200 rounded-full w-4 h-4 flex items-center justify-center cursor-pointer"
                        >
                          ×
                        </button>
                      )}
                    </div>

                    {/* Category Grids */}
                    {(() => {
                      const allShortcutData = [
                        { category: '📝 文本格式与排版', icon: <Type size={14} className="text-blue-500" />, items: [
                          { label: '文本加粗', keys: ['Ctrl', 'B'], description: '加粗选中文本或切换加粗模式', badge: '常用' },
                          { label: '文本斜体', keys: ['Ctrl', 'I'], description: '倾斜选中文本', badge: '常用' },
                          { label: '文本背景高亮', keys: ['Ctrl', 'Shift', 'H'], description: '给选中文本叠加亮色背景', badge: '高频' },
                          { label: '一级 / 二级标题', keys: ['Ctrl', 'Alt', '1 / 2'], description: '快速应用一/二级标题结构' },
                          { label: '无序列表', keys: ['Ctrl', 'Shift', '8'], description: '转化为圆点项目符号列表' },
                          { label: '有序列表', keys: ['Ctrl', 'Shift', '7'], description: '转化为数字序号列表' },
                          { label: '交互待办清单', keys: ['Ctrl', 'Shift', '9'], description: '插入前端可直接点击勾选的任务框' },
                          { label: '块级引用', keys: ['Ctrl', 'Shift', 'B'], description: '插入带凸显背景线的引用段落' },
                          { label: '行内代码', keys: ['Ctrl', 'E'], description: '将文字转化为单行代码标签' },
                          { label: '多语言代码块', keys: ['Ctrl', 'Alt', 'C'], description: '插入带语法高亮的框体代码' },
                          { label: '标题快速补全', keys: ['#', 'Space'], description: '行首键入 # 和空格自动切标题' },
                          { label: 'Emoji 表情面板', keys: [':'], description: '键入冒号快速搜索并插入表情' },
                        ]},
                        { category: '📂 文档与文件管理', icon: <Folder size={14} className="text-amber-500" />, items: [
                          { label: '保存当前文档', keys: ['Ctrl', 'S'], description: '实时保存修改至本地或浏览器', badge: '核心' },
                          { label: '文档另存为', keys: ['Ctrl', 'Shift', 'S'], description: '导出为新 Markdown 或 HTML 文件' },
                          { label: '新建空白文档', keys: ['Ctrl', 'Alt', 'N'], description: '建立新的空白编辑视界' },
                          { label: '打开本地文件', keys: ['Ctrl', 'O'], description: '导入本地 .md 或 .txt 文本' },
                          { label: '撤销上一步', keys: ['Ctrl', 'Z'], description: '回退一步历史修改' },
                          { label: '重做下一步', keys: ['Ctrl', 'Y'], description: '恢复撤销的历史改动' },
                          { label: '高级导出选项', keys: ['Ctrl', 'Shift', 'P'], description: '唤起 PDF / 图片 / HTML 导出' },
                        ]},
                        { category: '📺 全屏 PPT 演示放映', icon: <Monitor size={14} className="text-purple-500" />, items: [
                          { label: '开启 / 退出全屏放映', keys: ['F11'], description: '一键将文档转化为全屏 PPT', badge: '特色' },
                          { label: '上一页 / 下一页', keys: ['←', '→'], description: '使用键盘方向键或 PageUp/PageDown' },
                          { label: '顺序下翻幻灯片', keys: ['Space', 'Enter'], description: '按空格或回车播放下一页' },
                          { label: '退出放映模式', keys: ['Esc'], description: '关闭放映并返回视界编辑器' },
                          { label: '幻灯片分页符', keys: ['---'], description: '文档中使用三连减号划分幻灯片' },
                          { label: '放映互动工具栏', keys: ['右侧工具'], description: '提供画笔、激光笔、倒计时与转盘' },
                        ]},
                        { category: '🤖 AI 助手与智能排版', icon: <SparklesIcon size={14} className="text-emerald-500" />, items: [
                          { label: '选区浮动工具栏', keys: ['选中文本'], description: '自动浮现高亮、大小字、智能排版', badge: '高效' },
                          { label: '一键智能格式化', keys: ['浮动栏 ✨'], description: '自动修正中英文空格与盘古排版规范', badge: '推荐' },
                          { label: 'AI 交互助手', keys: ['右上角 AI'], description: '文章润色、段落总结、多语翻译与续写' },
                          { label: '随时打开帮助', keys: ['Ctrl', '/'], description: '随时唤起本快捷键与新手教程中心' },
                        ]},
                      ];

                      const filterQuery = shortcutFilter.trim().toLowerCase();

                      const filteredCategories = allShortcutData.map(cat => ({
                        ...cat,
                        items: cat.items.filter(item => 
                          !filterQuery || 
                          item.label.toLowerCase().includes(filterQuery) ||
                          item.description.toLowerCase().includes(filterQuery) ||
                          item.keys.some(k => k.toLowerCase().includes(filterQuery)) ||
                          cat.category.toLowerCase().includes(filterQuery)
                        )
                      })).filter(cat => cat.items.length > 0);

                      if (filteredCategories.length === 0) {
                        return (
                          <div className="py-12 text-center text-slate-400 space-y-3">
                            <Keyboard size={32} className="mx-auto text-slate-300" />
                            <p className="text-xs">未找到包含 “<span className="text-slate-600 font-bold">{shortcutFilter}</span>” 的快捷键说明</p>
                            <button
                              onClick={() => setShortcutFilter('')}
                              className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                            >
                              清除搜索条件
                            </button>
                          </div>
                        );
                      }

                      return (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {filteredCategories.map((cat, idx) => (
                            <div key={idx} className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 space-y-2">
                              <h4 className="text-xs font-bold text-slate-500 tracking-wider mb-3 flex items-center gap-2 pb-2 border-b border-slate-200/60">
                                {cat.icon}
                                <span>{cat.category}</span>
                              </h4>
                              <div className="space-y-1">
                                {cat.items.map((item, iIdx) => (
                                  <ShortcutRow
                                    key={iIdx}
                                    label={item.label}
                                    keys={item.keys}
                                    description={item.description}
                                    badge={item.badge}
                                  />
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}

                    <div className="pt-3 border-t border-slate-100 text-xs text-slate-400 flex items-center justify-between">
                      <span>💡 提示：按 <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded font-mono text-[10px] text-slate-600">Ctrl + /</kbd> 也可快速随时打开本帮助中心。</span>
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

      {/* Privacy Policy Modal */}
      <PrivacyModal isOpen={showPrivacyModal} onClose={() => setShowPrivacyModal(false)} />

      {/* PDF & Long Image Export Center Modal */}
      <PDFExportModal
        isOpen={isPdfModalOpen}
        initialTab={exportModalTab}
        onClose={() => setIsPdfModalOpen(false)}
        onExportPDF={executeExportPDF}
        onExportImage={executeExportImage}
        onPreview={previewExport}
        docName={docName}
        wordCount={editor?.storage.characterCount?.words() || editor?.getText().length || 0}
        currentThemeName={THEME_OPTIONS.find(t => t.id === theme)?.name || '默认简约'}
        isGenerating={isPdfModalGenerating}
        progressPercent={pdfExportProgress}
        progressStatusText={pdfExportStatusText}
      />

      {/* Support / Sponsorship Modal */}
      <SponsorModal isOpen={showSponsorModal} onClose={() => setShowSponsorModal(false)} showToast={showToast} />

      {/* Image Preview & Quick Insert Modal */}
      <ImagePreviewModal
        isOpen={!!previewImageInfo}
        imageInfo={previewImageInfo}
        onClose={() => setPreviewImageInfo(null)}
        onInsertToEditor={(url, name) => {
          editor?.chain().focus().setImage({ src: url, alt: name }).run();
          showToast(`已成功插入图片 ${name} 到当前光标位置`);
        }}
      />

      {/* New File Modal */}
      <NewFileModal
        isOpen={showNewFileModal}
        directoryName={currentDirectoryName}
        onClose={() => setShowNewFileModal(false)}
        onConfirm={handleCreateNewFileInWorkspace}
      />

      {/* Document Template Selection Modal */}
      <TemplateModal
        isOpen={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        onSelectTemplate={handleSelectTemplate}
      />

      {/* Presentation Background & Pattern Modal */}
      <PresBgModal
        isOpen={showPresBgModal}
        onClose={() => setShowPresBgModal(false)}
        config={presBgConfig}
        onChange={(newConfig) => {
          setPresBgConfig(newConfig);
          try {
            localStorage.setItem('fluxmark_pres_bg', JSON.stringify(newConfig));
          } catch (e) {
            console.error('Failed to save presentation background config:', e);
          }
        }}
        onReset={() => {
          setPresBgConfig(DEFAULT_PRES_BG_CONFIG);
          try {
            localStorage.removeItem('fluxmark_pres_bg');
          } catch (e) {
            console.error(e);
          }
          showToast('已恢复默认 Slate 质感放映背景');
        }}
      />

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
      </div>
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

const ToolbarGroupContext = createContext<(() => void) | null>(null);

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

  const closeMenu = () => setIsOpen(false);

  return (
    <ToolbarGroupContext.Provider value={closeMenu}>
      <div ref={ref} className="relative shrink-0">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className={`px-3 py-1.5 hover:bg-[var(--bg-secondary)] rounded-lg text-sm font-medium transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap ${
            isOpen ? 'bg-[var(--bg-secondary)] text-[var(--accent)] font-bold' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          {label}
          <ChevronRight size={14} className={`transition-transform ${isOpen ? 'rotate-90 text-[var(--accent)]' : ''}`} />
        </button>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 5, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 5, scale: 0.98 }}
              transition={{ duration: 0.12 }}
              className={`absolute top-full mt-1.5 bg-[var(--bg-primary)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-y-auto max-h-[85vh] py-1.5 z-50 p-1.5 font-sans min-w-max whitespace-nowrap ${
                alignRight ? 'right-0 left-auto' : 'left-0'
              }`}
            >
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ToolbarGroupContext.Provider>
  );
}

function ToolbarItem({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick: () => void }) {
  const closeMenu = useContext(ToolbarGroupContext);
  return (
    <button 
      onClick={() => {
        onClick();
        closeMenu?.();
      }}
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

function ShortcutRow({ label, keys, description, badge }: { label: string, keys: string[], description?: string, badge?: string }) {
  return (
    <div className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl transition-all border border-transparent hover:border-slate-200/80 group">
      <div className="flex flex-col gap-0.5 pr-2 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-slate-800 font-bold group-hover:text-[var(--accent)] transition-colors">{label}</span>
          {badge && (
            <span className="px-1.5 py-0.2 bg-blue-50 text-[var(--accent)] text-[10px] font-bold rounded-md border border-blue-100/80">
              {badge}
            </span>
          )}
        </div>
        {description && (
          <span className="text-[11px] text-slate-400 leading-tight truncate">{description}</span>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {keys.map((k, i) => (
          <kbd key={i} className="px-2 py-0.5 min-w-[24px] text-center bg-white border border-slate-200 rounded-lg text-[10px] font-extrabold text-slate-600 shadow-sm font-mono uppercase tracking-wider group-hover:border-blue-300 group-hover:text-[var(--accent)] transition-all">
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

function PresToolBtn({ active, icon, onClick, label, disabled }: { active: boolean, icon: React.ReactNode, onClick: () => void, label: string, disabled?: boolean }) {
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={`p-1.5 rounded-lg transition-all flex items-center justify-center ${
        disabled 
          ? 'opacity-30 cursor-not-allowed hover:bg-transparent text-slate-400' 
          : active 
            ? 'bg-blue-600 text-white shadow-md cursor-pointer' 
            : 'text-slate-300 hover:bg-slate-800 hover:text-white cursor-pointer'
      }`}
    >
      {icon}
    </button>
  );
}

// --- 初始示例模板内容 ---
const initialMarkdown = `# 欢迎使用 FluxMark

在这里写 Markdown。打开左侧「模板」，可以找到完整功能指南。

---

# 写作与整理

- 用标题组织结构，在左侧大纲快速跳转。
- 用 Ctrl + F 查找，用 Ctrl + S 保存。
- 用独立一行三个短横线划分页。

---

# 开始你的演示

点击「演示」，先检查页数和内容，再开始放映。

需要分享时，从「导出」选择 Markdown、PDF 或长图。
`;
