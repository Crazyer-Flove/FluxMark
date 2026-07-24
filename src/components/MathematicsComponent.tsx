import React, { useState, useEffect, useRef } from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

export const MathematicsComponent = (props: any) => {
  const { node, updateAttributes, selected } = props;
  const { latex, displayMode } = node.attrs;
  const [isEditing, setIsEditing] = useState(() => !latex || latex.trim() === '');
  const [inputValue, setInputValue] = useState(latex || '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputValue(latex || '');
    if (!latex || latex.trim() === '') {
      setIsEditing(true);
    }
  }, [latex]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleToggleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(!isEditing);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputBlur = () => {
    setIsEditing(false);
    queueMicrotask(() => {
      updateAttributes({ latex: inputValue });
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleInputBlur();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      setInputValue(latex || '');
      setIsEditing(false);
    }
  };

  const renderedHtml = React.useMemo(() => {
    const raw = inputValue || latex || '';
    if (!raw.trim()) {
      return '<span style="opacity: 0.5; font-style: italic;">[点击编辑公式]</span>';
    }
    try {
      return katex.renderToString(raw, {
        displayMode: displayMode,
        throwOnError: false,
      });
    } catch (e) {
      return raw;
    }
  }, [inputValue, latex, displayMode]);

  return (
    <NodeViewWrapper 
      className={`mathematics-node ${displayMode ? 'block-math my-2 text-center' : 'inline-math mx-0.5'} ${selected ? 'ProseMirror-selectednode ring-2 ring-blue-500 rounded' : ''}`}
      style={{ display: displayMode ? 'block' : 'inline-block', cursor: 'pointer' }}
    >
      {isEditing ? (
        <div className={displayMode ? 'w-full max-w-lg mx-auto py-1' : 'inline-block'}>
          <input
            ref={inputRef}
            className={`math-input ${displayMode ? 'w-full text-center' : 'w-36'}`}
            value={inputValue}
            placeholder="输入 LaTeX，例如: E=mc^2"
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyDown={handleKeyDown}
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--accent)',
              borderRadius: '6px',
              padding: '3px 8px',
              color: 'var(--text-primary)',
              outline: 'none',
              fontFamily: 'monospace',
              fontSize: '0.875rem'
            }}
          />
        </div>
      ) : (
        <span 
          onClick={handleToggleEdit}
          dangerouslySetInnerHTML={{ __html: renderedHtml }} 
          className={`math-render hover:bg-blue-50/80 dark:hover:bg-blue-950/60 transition-all rounded inline-block ${
            displayMode 
              ? 'py-2 px-4 bg-[var(--bg-secondary)] border border-[var(--border)] shadow-2xs my-1' 
              : 'px-1 py-0.5'
          }`}
          style={{ verticalAlign: 'middle' }}
          title="点击编辑 LaTeX 公式"
        />
      )}
    </NodeViewWrapper>
  );
};

