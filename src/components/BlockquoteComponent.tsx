import React from 'react';
import { NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import { Quote, Sparkles } from 'lucide-react';

export const BlockquoteComponent: React.FC<any> = (props) => {
  const spacing = props.node.attrs.spacing || 'loose';
  const isCompact = spacing === 'compact';

  const toggleSpacing = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    props.updateAttributes({
      spacing: isCompact ? 'loose' : 'compact',
    });
  };

  return (
    <NodeViewWrapper
      className={`blockquote-node-wrapper relative group/bq my-4 transition-all duration-300 animate-blockquote-extend ${
        isCompact ? 'blockquote-compact' : 'blockquote-loose'
      }`}
      data-spacing={spacing}
    >
      {/* Left border interactive hover target and toggle handle */}
      <div
        onClick={toggleSpacing}
        title={`点击切换引用排版模式 (当前: ${isCompact ? '紧凑模式' : '宽松模式'})`}
        className="absolute -left-1 top-0 bottom-0 w-4 cursor-pointer z-20 flex items-center justify-center group/border select-none"
      >
        {/* Animated indicator bar on the left */}
        <div className="w-1.5 h-full rounded-full bg-[var(--accent)] transition-all duration-300 group-hover/border:w-2.5 group-hover/border:shadow-lg group-hover/border:shadow-[var(--accent)]/50 relative">
          {/* Popover badge tooltip on border hover */}
          <div className="opacity-0 group-hover/border:opacity-100 transition-all duration-200 pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 whitespace-nowrap bg-slate-900/90 text-white dark:bg-slate-100 dark:text-slate-900 text-[11px] px-2.5 py-1 rounded-lg shadow-xl font-sans font-medium flex items-center gap-1.5 z-30 backdrop-blur-xs">
            <Sparkles size={12} className="text-amber-400 dark:text-amber-600 shrink-0" />
            <span>切换为{isCompact ? '宽松模式' : '紧凑模式'}</span>
            <span className="text-[9px] opacity-70 font-mono">(点击边框)</span>
          </div>
        </div>
      </div>

      {/* Main Blockquote content box */}
      <blockquote
        className={`relative rounded-r-xl border-l-4 border-[var(--accent)] transition-all duration-300 bg-[var(--bg-secondary)]/60 hover:bg-[var(--bg-secondary)]/90 ${
          isCompact
            ? 'pl-4 pr-3 py-1.5 my-1.5 text-xs sm:text-sm leading-normal italic text-[var(--text-secondary)] border-l-[3px]'
            : 'pl-6 pr-5 py-3.5 my-4 text-sm sm:text-base leading-relaxed italic text-[var(--text-secondary)] shadow-xs'
        }`}
      >
        {/* Decorative Quote Mark background icon */}
        <Quote
          size={isCompact ? 18 : 28}
          className="absolute right-2 top-2 text-[var(--accent)]/15 pointer-events-none select-none transition-all duration-300"
        />

        {/* Floating badge for quick mode toggle at top-right */}
        <div
          onClick={toggleSpacing}
          title="点击切换紧凑/宽松排版"
          className="absolute right-2 top-2 opacity-0 group-hover/bq:opacity-100 transition-all duration-200 cursor-pointer select-none z-10"
        >
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-[var(--accent)]/15 text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white transition-all shadow-2xs font-semibold flex items-center gap-1">
            {isCompact ? '紧凑' : '宽松'}
          </span>
        </div>

        {/* Tiptap content container */}
        <NodeViewContent className="blockquote-content relative z-0 outline-none" />
      </blockquote>
    </NodeViewWrapper>
  );
};
