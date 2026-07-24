import React from 'react';
import { NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import { Quote } from 'lucide-react';

export const BlockquoteComponent: React.FC<any> = () => {
  return (
    <NodeViewWrapper
      className="blockquote-node-wrapper relative group/bq my-2 transition-all duration-300 animate-blockquote-extend blockquote-compact"
      data-spacing="compact"
    >
      {/* Accent border line on left */}
      <div className="absolute -left-1 top-0 bottom-0 w-2 select-none pointer-events-none">
        <div className="w-1.5 h-full rounded-full bg-[var(--accent)] transition-all duration-300" />
      </div>

      {/* Compact Blockquote content box */}
      <blockquote
        className="relative rounded-r-xl border-l-[3px] border-[var(--accent)] transition-all duration-300 bg-[var(--bg-secondary)]/60 hover:bg-[var(--bg-secondary)]/90 pl-4 pr-3 py-1.5 my-1 text-xs sm:text-sm leading-normal italic text-[var(--text-secondary)]"
      >
        {/* Decorative Quote Mark background icon */}
        <Quote
          size={16}
          className="absolute right-2 top-2 text-[var(--accent)]/15 pointer-events-none select-none"
        />

        {/* Tiptap content container */}
        <NodeViewContent className="blockquote-content relative z-0 outline-none" />
      </blockquote>
    </NodeViewWrapper>
  );
};

