import React, { useState, useEffect, useRef } from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

export const MathematicsComponent = (props: any) => {
  const { node, updateAttributes, selected } = props;
  const { latex, displayMode } = node.attrs;
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(latex);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputValue(latex);
  }, [latex]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleToggleEdit = () => {
    setIsEditing(!isEditing);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputBlur = () => {
    setIsEditing(false);
    updateAttributes({ latex: inputValue });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleInputBlur();
    }
    if (e.key === 'Escape') {
      setInputValue(latex);
      setIsEditing(false);
    }
  };

  const renderedHtml = React.useMemo(() => {
    try {
      return katex.renderToString(latex || '...', {
        displayMode: displayMode,
        throwOnError: false,
      });
    } catch (e) {
      return latex;
    }
  }, [latex, displayMode]);

  return (
    <NodeViewWrapper 
      className={`mathematics-node ${displayMode ? 'block-math' : 'inline-math'} ${selected ? 'ProseMirror-selectednode' : ''}`}
      style={{ display: displayMode ? 'block' : 'inline-block', cursor: 'pointer' }}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          className={`math-input ${displayMode ? 'w-full' : ''}`}
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--accent)',
            borderRadius: '4px',
            padding: '2px 4px',
            color: 'var(--text-primary)',
            outline: 'none',
            fontFamily: 'monospace'
          }}
        />
      ) : (
        <span 
          onClick={handleToggleEdit}
          dangerouslySetInnerHTML={{ __html: renderedHtml }} 
          className="math-render hover:bg-blue-50 transition-colors px-1 rounded inline-block"
          style={{ verticalAlign: 'middle' }}
        />
      )}
    </NodeViewWrapper>
  );
};
