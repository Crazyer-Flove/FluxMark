import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, Sparkles, Copy, Check, FileDown, Trash2, X, 
  MessageSquare, Settings, Key, Globe, Cpu, RotateCcw, 
  AlertCircle, Sliders
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Editor } from '@tiptap/react';

interface Message {
  role: 'user' | 'ai';
  content: string;
}

interface AIChatProps {
  editor: Editor | null;
  onClose: () => void;
}

interface PresetProvider {
  name: string;
  baseUrl: string;
  defaultModel: string;
}

const PRESET_PROVIDERS: PresetProvider[] = [
  {
    name: 'DeepSeek 官方',
    baseUrl: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat',
  },
  {
    name: 'OpenAI 官方',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
  },
  {
    name: '硅基流动 SiliconFlow',
    baseUrl: 'https://api.siliconflow.cn/v1',
    defaultModel: 'deepseek-ai/DeepSeek-V3',
  },
  {
    name: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    defaultModel: 'deepseek/deepseek-r1',
  },
  {
    name: 'Moonshot (Kimi)',
    baseUrl: 'https://api.moonshot.cn/v1',
    defaultModel: 'moonshot-v1-8k',
  },
  {
    name: 'Ollama 本地模型',
    baseUrl: 'http://localhost:11434/v1',
    defaultModel: 'llama3',
  },
];

export const AIChat: React.FC<AIChatProps> = ({ editor, onClose }) => {
  // Config state stored in localStorage
  const [baseUrl, setBaseUrl] = useState<string>(() => {
    return localStorage.getItem('flux_ai_baseUrl') || 'https://api.deepseek.com/v1';
  });
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem('flux_ai_apiKey') || '';
  });
  const [modelName, setModelName] = useState<string>(() => {
    return localStorage.getItem('flux_ai_model') || 'deepseek-chat';
  });
  const [systemPrompt, setSystemPrompt] = useState<string>(() => {
    return localStorage.getItem('flux_ai_system') || 
      '你是一个专业的 Markdown 写作助手，正在帮助用户在编辑器中进行创作。你可以直接生成 Markdown 内容，或者为用户的内容提供修改意见。请保持友好、专业且简洁。';
  });

  // UI state
  const [showSettings, setShowSettings] = useState<boolean>(() => {
    // Show settings by default if API key or base URL is empty
    return !localStorage.getItem('flux_ai_apiKey') && !localStorage.getItem('flux_ai_baseUrl');
  });

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, errorMessage]);

  // Save config to localStorage
  const handleSaveSettings = () => {
    localStorage.setItem('flux_ai_baseUrl', baseUrl.trim());
    localStorage.setItem('flux_ai_apiKey', apiKey.trim());
    localStorage.setItem('flux_ai_model', modelName.trim());
    localStorage.setItem('flux_ai_system', systemPrompt.trim());
    setShowSettings(false);
    setErrorMessage(null);
  };

  const applyPreset = (preset: PresetProvider) => {
    setBaseUrl(preset.baseUrl);
    setModelName(preset.defaultModel);
  };

  const constructApiUrl = (endpoint: string) => {
    let url = endpoint.trim().replace(/\/+$/, '');
    if (!url.endsWith('/chat/completions')) {
      if (!url.endsWith('/v1')) {
        url = `${url}/v1`;
      }
      url = `${url}/chat/completions`;
    }
    return url;
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const trimmedBaseUrl = baseUrl.trim();
    const trimmedApiKey = apiKey.trim();

    if (!trimmedBaseUrl) {
      setErrorMessage('请先在设置中填写 API 服务地址（Base URL）');
      setShowSettings(true);
      return;
    }

    // Check if provider is not a local Ollama service and missing API Key
    const isLocalOllama = trimmedBaseUrl.includes('localhost') || trimmedBaseUrl.includes('127.0.0.1');
    if (!trimmedApiKey && !isLocalOllama) {
      setErrorMessage('未检测到 API Key！请先在设置中填入您的 API Key（例如 DeepSeek、OpenAI 或 硅基流动 等平台的密钥）。');
      setShowSettings(true);
      return;
    }

    const userMessage = input.trim();
    setInput('');
    setErrorMessage(null);
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const targetUrl = constructApiUrl(trimmedBaseUrl);
      
      const payloadMessages = [
        { role: 'system', content: systemPrompt },
        ...messages.map(m => ({
          role: m.role === 'ai' ? 'assistant' : 'user',
          content: m.content,
        })),
        { role: 'user', content: userMessage }
      ];

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (trimmedApiKey) {
        headers['Authorization'] = `Bearer ${trimmedApiKey}`;
      }

      const response = await fetch(targetUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: modelName.trim() || 'deepseek-chat',
          messages: payloadMessages,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        let parsedError = errorData;
        try {
          const jsonErr = JSON.parse(errorData);
          parsedError = jsonErr.error?.message || jsonErr.message || errorData;
        } catch {
          // ignore
        }

        if (response.status === 401 || response.status === 403) {
          throw new Error(`API Key 身份校验失败 (HTTP ${response.status})：请检查您填写的 API Key 是否正确无误，或者账户余额是否充裕。`);
        }

        throw new Error(`请求失败 (${response.status}): ${parsedError}`);
      }

      const data = await response.json();
      const aiResponse = data.choices?.[0]?.message?.content || '未能返回生成内容，请检查模型配置。';
      
      setMessages(prev => [...prev, { role: 'ai', content: aiResponse }]);
    } catch (error: any) {
      console.error('AI Request Error:', error);
      const msg = error.message || '网络连接失败，请检查 API 地址、API Key 或网络状态。';
      setErrorMessage(msg);
      setMessages(prev => [...prev, { role: 'ai', content: `❌ 请求出错: ${msg}` }]);
      setShowSettings(true);
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
    setErrorMessage(null);
  };

  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      className="w-96 border-l border-[var(--border)] bg-[var(--bg-primary)] flex flex-col shadow-2xl z-50 relative h-full"
    >
      {/* Header Bar */}
      <div className="p-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-secondary)] shrink-0">
        <div className="flex items-center gap-2 text-[var(--accent)] font-bold">
          <Sparkles size={18} />
          <div className="flex flex-col">
            <span className="text-sm">Flux AI 助手</span>
            <span className="text-[10px] text-slate-400 font-normal truncate max-w-[150px]">
              {modelName || '自定义模型'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-1.5 rounded-lg transition-colors ${
              showSettings 
                ? 'bg-[var(--accent)] text-white' 
                : 'hover:bg-slate-100 text-slate-400 hover:text-slate-600'
            }`}
            title="配置 API 地址与模型"
          >
            <Settings size={16} />
          </button>
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

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative flex flex-col">
        {/* API Settings Modal Panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute inset-0 bg-[var(--bg-primary)] z-20 p-4 overflow-y-auto flex flex-col justify-between border-b border-[var(--border)]"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
                  <div className="flex items-center gap-2 font-semibold text-sm text-[var(--text-primary)]">
                    <Sliders size={16} className="text-[var(--accent)]" />
                    <span>大模型 API 自定义配置</span>
                  </div>
                  <button 
                    onClick={() => setShowSettings(false)}
                    className="text-xs text-slate-400 hover:text-slate-600"
                  >
                    取消
                  </button>
                </div>

                {/* Quick Presets */}
                <div>
                  <label className="text-xs font-medium text-slate-500 block mb-1.5">
                    预设服务（快捷填充）：
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {PRESET_PROVIDERS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => applyPreset(preset)}
                        className="text-left px-2 py-1.5 rounded border border-[var(--border)] bg-[var(--bg-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)] text-xs transition-all text-slate-600 truncate"
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Base URL */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600 flex items-center gap-1">
                    <Globe size={13} className="text-slate-400" />
                    <span>API 服务地址 (Base URL)</span>
                  </label>
                  <input
                    type="text"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    placeholder="https://api.openai.com/v1"
                    className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent)] outline-none"
                  />
                  <p className="text-[10px] text-slate-400">
                    支持 OpenAI 标准兼容接口 (如 DeepSeek, SiliconFlow, OpenRouter, Ollama 等)
                  </p>
                </div>

                {/* API Key */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600 flex items-center gap-1">
                    <Key size={13} className="text-slate-400" />
                    <span>API Key</span>
                  </label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-..."
                    className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent)] outline-none"
                  />
                  <p className="text-[10px] text-slate-400">
                    本地 Ollama 或无鉴权服务可留空
                  </p>
                </div>

                {/* Model Name */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600 flex items-center gap-1">
                    <Cpu size={13} className="text-slate-400" />
                    <span>模型名称 (Model)</span>
                  </label>
                  <input
                    type="text"
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                    placeholder="deepseek-chat"
                    className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent)] outline-none"
                  />
                </div>

                {/* System Prompt */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600 block">
                    系统提示词 (System Instruction)
                  </label>
                  <textarea
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    rows={2}
                    className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent)] outline-none resize-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--border)] mt-4">
                <button
                  onClick={handleSaveSettings}
                  className="w-full bg-[var(--accent)] text-white text-xs py-2.5 rounded-lg font-medium shadow-md hover:opacity-90 active:scale-98 transition-all"
                >
                  保存配置并开始对话
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
          {messages.length === 0 && !showSettings && (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3 opacity-70 my-auto py-12">
              <MessageSquare size={40} className="text-[var(--accent)] opacity-60" />
              <div className="text-center space-y-1 px-4">
                <p className="text-xs font-medium text-[var(--text-primary)]">Flux AI 自定义模型助手</p>
                <p className="text-[11px] text-slate-400">
                  当前模型：<span className="font-mono text-[var(--accent)]">{modelName || '未设置'}</span>
                </p>
                <p className="text-[10px] text-slate-400 pt-2">
                  支持调用任意 OpenAI 兼容接口（如 DeepSeek, GPT-4, Qwen 等）协助 Markdown 创作
                </p>
              </div>
              <button
                onClick={() => setShowSettings(true)}
                className="text-xs px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] hover:text-[var(--accent)] transition-colors flex items-center gap-1.5"
              >
                <Settings size={13} />
                <span>修改 API 配置</span>
              </button>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[92%] p-3 rounded-2xl text-xs leading-relaxed break-words ${
                msg.role === 'user' 
                  ? 'bg-[var(--accent)] text-white' 
                  : 'bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)]'
              }`}>
                {msg.content}
              </div>
              {msg.role === 'ai' && !msg.content.startsWith('❌') && (
                <div className="flex gap-2 mt-1.5 ml-1">
                  <button 
                    onClick={() => copyToClipboard(msg.content, i)}
                    className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-[var(--accent)] transition-colors"
                  >
                    {copiedIndex === i ? <Check size={11} /> : <Copy size={11} />}
                    {copiedIndex === i ? '已复制' : '复制'}
                  </button>
                  <button 
                    onClick={() => insertToEditor(msg.content)}
                    className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-[var(--accent)] transition-colors"
                  >
                    <FileDown size={11} />
                    插入文档
                  </button>
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-start">
              <div className="bg-[var(--bg-secondary)] border border-[var(--border)] p-3 rounded-2xl">
                <div className="flex gap-1.5 items-center">
                  <span className="text-[10px] text-slate-400 mr-1">生成中</span>
                  <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full" />
                  <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full" />
                  <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full" />
                </div>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-red-600 text-xs">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1">
                <p className="font-medium">请求未完成</p>
                <p className="text-[11px] opacity-90">{errorMessage}</p>
                <button
                  onClick={() => setShowSettings(true)}
                  className="text-[10px] underline hover:text-red-800 pt-1 block"
                >
                  去检查 API 地址与密钥配置 →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input Box */}
      <div className="p-3 border-t border-[var(--border)] bg-[var(--bg-secondary)] shrink-0">
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
            placeholder="输入您的问题 (Enter 发送, Shift+Enter 换行)..."
            className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-3 py-2.5 pr-10 text-xs text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent outline-none resize-none no-scrollbar h-20"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className={`absolute right-2.5 bottom-2.5 p-1.5 rounded-lg transition-all ${
              isLoading || !input.trim() 
                ? 'text-slate-300 bg-slate-100 cursor-not-allowed' 
                : 'bg-[var(--accent)] text-white shadow-md active:scale-95'
            }`}
          >
            <Send size={15} />
          </button>
        </div>
        <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400 px-1">
          <span>模式：自定义 API / 大模型</span>
          <button 
            onClick={() => setShowSettings(true)}
            className="hover:text-[var(--accent)] transition-colors flex items-center gap-0.5"
          >
            <span>{modelName || '设置 API'}</span>
            <Settings size={10} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
