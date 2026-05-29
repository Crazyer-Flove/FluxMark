import React, { useState } from 'react';
import { NodeViewContent, NodeViewWrapper } from '@tiptap/react';
import { Copy, Check } from 'lucide-react';

export const CodeBlockComponent = ({ node, updateAttributes, extension, editor, getPos }: any) => {
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(node.textContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const languages = extension.options.lowlight.listLanguages();

  return (
    <NodeViewWrapper className="code-block-custom my-8 group relative">
      {/* Mac-style Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#f8fafc] border border-slate-200 rounded-t-xl">
        <div className="flex items-center gap-1.5 ">
          <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
          <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
          <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
          <select
            contentEditable={false}
            value={node.attrs.language || ''}
            onChange={event => updateAttributes({ language: event.target.value })}
            className="ml-3 bg-transparent text-[10px] font-mono text-slate-400 uppercase tracking-wider outline-none cursor-pointer hover:text-slate-600 transition-colors appearance-none"
          >
            <option value="">Auto</option>
            {languages.map((lang: string) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={copyCode}
            className="p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors"
            title="复制代码"
          >
            {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
          </button>
          
          <div className="w-px h-3 bg-slate-300 mx-1" />
          
          <button 
            onClick={() => {
              const pos = getPos() + node.nodeSize;
              editor.chain().focus().insertContentAt(pos, { type: 'paragraph' }).run();
            }}
            className="px-2 py-0.5 hover:bg-slate-100 rounded text-slate-500 font-medium text-[10px] border border-slate-200 bg-white shadow-sm transition-all"
            title="在下方开启新行"
          >
            跳出代码块
          </button>
        </div>
      </div>

      <div className="relative">
        <pre className="m-0 border border-t-0 border-slate-200 rounded-b-xl overflow-hidden bg-white">
          <code className="block p-4 font-mono text-sm leading-relaxed">
            <NodeViewContent />
          </code>
        </pre>
      </div>
    </NodeViewWrapper>
  );
};
