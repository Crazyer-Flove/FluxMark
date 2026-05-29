import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Copy, Check, FileDown, Trash2, X, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import { Editor } from '@tiptap/react';

interface Message {
  role: 'user' | 'ai';
  content: string;
}

interface AIChatProps {
  editor: Editor | null;
  onClose: () => void;
}

export const AIChat: React.FC<AIChatProps> = ({ editor, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            role: 'user',
            parts: [{ text: userMessage }]
          }
        ],
        config: {
          systemInstruction: "你是一个专业的写作助手，正在帮助用户在 Markdown 编辑器中进行创作。你可以直接生成 Markdown 内容，或者为用户的内容提供建议。请保持友好、专业且简洁。如果你生成的是可以直接插入文档的内容，请尽量使用标准的 Markdown 格式。",
        }
      });

      const aiResponse = response.text || '没能生成内容，请重试。';
      setMessages(prev => [...prev, { role: 'ai', content: aiResponse }]);
    } catch (error) {
      console.error('AI Error:', error);
      setMessages(prev => [...prev, { role: 'ai', content: '连接 AI 失败，请检查网络或配置。' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const insertToEditor = (text: string) => {
    if (editor) {
      editor.chain().focus().insertContent(text).run();
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      className="w-96 border-l border-[var(--border)] bg-[var(--bg-primary)] flex flex-col shadow-2xl z-50 relative"
    >
      <div className="p-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-secondary)]">
        <div className="flex items-center gap-2 text-[var(--accent)] font-bold">
          <Sparkles size={18} />
          <span>Flux AI 助手</span>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={clearChat}
            className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
            title="清空对话"
          >
            <Trash2 size={16} />
          </button>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
            title="关闭 AI 助手"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2 opacity-50">
            <MessageSquare size={48} />
            <p className="text-sm">你可以问我任何关于写作的问题</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[90%] p-3 rounded-2xl text-sm leading-relaxed ${
              msg.role === 'user' 
                ? 'bg-[var(--accent)] text-white' 
                : 'bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)]'
            }`}>
              {msg.content}
            </div>
            {msg.role === 'ai' && (
              <div className="flex gap-2 mt-2 ml-1">
                <button 
                  onClick={() => copyToClipboard(msg.content, i)}
                  className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-[var(--accent)] transition-colors"
                >
                  {copiedIndex === i ? <Check size={12} /> : <Copy size={12} />}
                  {copiedIndex === i ? '已复制' : '复制'}
                </button>
                <button 
                  onClick={() => insertToEditor(msg.content)}
                  className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-[var(--accent)] transition-colors"
                >
                  <FileDown size={12} />
                  插入编辑器
                </button>
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex items-start">
            <div className="bg-[var(--bg-secondary)] border border-[var(--border)] p-3 rounded-2xl">
              <div className="flex gap-1">
                <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full" />
                <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full" />
                <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full" />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-[var(--border)] bg-[var(--bg-secondary)]">
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="输入您的问题..."
            className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-4 py-3 pr-12 text-sm focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent outline-none resize-none no-scrollbar h-24"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className={`absolute right-3 bottom-3 p-2 rounded-lg transition-all ${
              isLoading || !input.trim() ? 'text-slate-300' : 'bg-[var(--accent)] text-white shadow-md active:scale-95'
            }`}
          >
            <Send size={18} />
          </button>
        </div>
        <p className="mt-2 text-[10px] text-slate-400 text-center">
          由 Gemini 3 Flash 提供技术支持
        </p>
      </div>
    </motion.div>
  );
};
