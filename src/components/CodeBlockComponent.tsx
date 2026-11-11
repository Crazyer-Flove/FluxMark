import React, { useState } from 'react';
import { NodeViewContent, NodeViewWrapper } from '@tiptap/react';
import { Copy, Check, Hash } from 'lucide-react';

export const CodeBlockComponent = ({ node, updateAttributes, extension, editor, getPos }: any) => {
  const [copied, setCopied] = useState(false);

  const showLineNumbers = node.attrs.showLineNumbers ?? true;

  const copyCode = () => {
    navigator.clipboard.writeText(node.textContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const languages = extension.options.lowlight.listLanguages();
  const lineCount = Math.max(1, node.textContent.split('\n').length);

  return (
    <NodeViewWrapper className="code-block-custom my-6 group relative">
      {/* Mac-style Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#f8fafc] dark:bg-slate-800/80 border border-[var(--border)] dark:border-slate-700 rounded-t-xl select-none">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
          <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
          <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
          <select
            contentEditable={false}
            value={node.attrs.language || ''}
            onChange={event => updateAttributes({ language: event.target.value })}
            className="ml-3 bg-transparent text-[11px] font-mono text-[var(--text-secondary)] dark:text-[var(--text-secondary)] uppercase tracking-wider outline-none cursor-pointer hover:text-[var(--text-primary)] dark:hover:text-slate-200 transition-colors appearance-none"
          >
            <option value="">Auto Language</option>
            {languages.map((lang: string) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex items-center gap-2">
          {/* 行号显示开关 */}
          <button 
            onClick={() => updateAttributes({ showLineNumbers: !showLineNumbers })}
            className={`px-2 py-0.5 rounded text-[10px] font-medium border transition-all flex items-center gap-1 cursor-pointer ${
              showLineNumbers 
                ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/60 dark:text-blue-400 dark:border-blue-800' 
                : 'bg-[var(--bg-primary)] hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border)] dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-[var(--text-secondary)] dark:border-slate-700'
            }`}
            title={showLineNumbers ? "关闭代码块行号" : "开启代码块行号"}
          >
            <Hash size={12} />
            <span>{showLineNumbers ? "行号: 开" : "行号: 关"}</span>
          </button>

          <button 
            onClick={copyCode}
            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-[var(--text-secondary)] dark:text-[var(--text-secondary)] transition-colors cursor-pointer"
            title="复制代码"
          >
            {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
          </button>
          
          <div className="w-px h-3 bg-slate-300 dark:bg-slate-700 mx-1" />
          
          <button 
            onClick={() => {
              const pos = getPos() + node.nodeSize;
              editor.chain().focus().insertContentAt(pos, { type: 'paragraph' }).run();
            }}
            className="px-2 py-0.5 hover:bg-[var(--bg-secondary)] dark:hover:bg-slate-700 rounded text-[var(--text-secondary)] dark:text-slate-300 font-medium text-[10px] border border-[var(--border)] dark:border-slate-700 bg-[var(--bg-primary)] dark:bg-slate-800 shadow-xs transition-all cursor-pointer"
            title="在下方开启新行"
          >
            跳出代码块
          </button>
        </div>
      </div>

      <div className="relative border border-t-0 border-[var(--border)] dark:border-slate-700 rounded-b-xl overflow-hidden bg-[var(--bg-primary)] dark:bg-slate-900 flex">
        {showLineNumbers && (
          <div 
            contentEditable={false} 
            className="select-none py-4 px-2.5 text-right font-mono text-sm leading-relaxed text-[var(--text-secondary)] dark:text-[var(--text-primary)] bg-[var(--bg-secondary)]/90 dark:bg-slate-800/50 border-r border-[var(--border)]/80 dark:border-slate-800 shrink-0 min-w-[2.75rem]"
          >
            {Array.from({ length: lineCount }).map((_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>
        )}
        <pre className="m-0 flex-1 overflow-x-auto bg-[var(--bg-primary)] dark:bg-slate-900 p-0 border-none">
          <code className="block p-4 font-mono text-sm leading-relaxed">
            <NodeViewContent />
          </code>
        </pre>
      </div>
    </NodeViewWrapper>
  );
};
