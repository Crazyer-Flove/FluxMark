import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, Sparkles, Copy, Check, FileDown, Trash2, X, 
  MessageSquare, Settings, Key, Globe, Cpu, 
  AlertCircle, Sliders, ShieldCheck, Lock, Eye, EyeOff, 
  LogOut, CheckCircle2, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AIReview } from './AIReview';
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

type StorageMode = 'session' | 'local';

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
    name: '智谱 BigModel',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    defaultModel: 'glm-4-flash',
  },
  {
    name: 'Ollama 本地模型',
    baseUrl: 'http://localhost:11434/v1',
    defaultModel: 'llama3',
  },
];

// Helper to get or generate current tab session device ID
const getSessionDeviceId = (): string => {
  try {
    let sessionId = sessionStorage.getItem('flux_ai_session_id');
    if (!sessionId) {
      sessionId = 'DEV-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      sessionStorage.setItem('flux_ai_session_id', sessionId);
    }
    return sessionId;
  } catch {
    return 'DEV-LOCAL-SESSION';
  }
};

export const AIChat: React.FC<AIChatProps> = ({ editor, onClose }) => {
  const [deviceId] = useState<string>(getSessionDeviceId);

  // Storage mode: 'session' (current browser tab session only) or 'local' (this device browser storage)
  const [storageMode, setStorageMode] = useState<StorageMode>(() => {
    try {
      return (localStorage.getItem('flux_ai_storage_mode') as StorageMode) || 'session';
    } catch {
      return 'session';
    }
  });

  // Helper to read item adhering to device storage mode
  const readConfigValue = (key: string, defaultValue: string = ''): string => {
    try {
      // 1. Session storage has priority for active device session
      const sessionVal = sessionStorage.getItem(key);
      if (sessionVal !== null) return sessionVal;
      if (key === 'flux_ai_apiKey') {
        const previous = localStorage.getItem(key);
        if (previous) {
          sessionStorage.setItem(key, previous);
          localStorage.removeItem(key);
          return previous;
        }
      }

      // 2. If storageMode is 'local', allow fallback to localStorage
      const mode = localStorage.getItem('flux_ai_storage_mode') || 'session';
      if (mode === 'local') {
        return localStorage.getItem(key) || defaultValue;
      }
    } catch (e) {
      console.warn('Storage access warning:', e);
    }
    return defaultValue;
  };

  // Config states
  const [baseUrl, setBaseUrl] = useState<string>(() => {
    return readConfigValue('flux_ai_baseUrl', 'https://api.deepseek.com/v1');
  });
  const [apiKey, setApiKey] = useState<string>(() => {
    return readConfigValue('flux_ai_apiKey', '');
  });
  const [modelName, setModelName] = useState<string>(() => {
    return readConfigValue('flux_ai_model', 'deepseek-chat');
  });
  const [systemPrompt, setSystemPrompt] = useState<string>(() => {
    return readConfigValue(
      'flux_ai_system',
      '你是一个专业的 Markdown 写作助手，正在帮助用户在编辑器中进行创作。你可以直接生成 Markdown 内容，或者为用户的内容提供修改意见。请保持友好、专业且简洁。'
    );
  });

  // UI state
  const [showSettings, setShowSettings] = useState<boolean>(() => {
    // Show settings by default if no API key is configured
    return !readConfigValue('flux_ai_apiKey');
  });
  const [showApiKey, setShowApiKey] = useState<boolean>(false);

  // Load saved chat messages from storage
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const savedSession = sessionStorage.getItem('flux_ai_chat_messages');
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }

      const mode = localStorage.getItem('flux_ai_storage_mode') || 'session';
      if (mode === 'local') {
        const savedLocal = localStorage.getItem('flux_ai_chat_messages');
        if (savedLocal) {
          const parsed = JSON.parse(savedLocal);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse saved chat messages:', e);
    }
    return [];
  });

  const [input, setInput] = useState('');
  const [attachedSelection, setAttachedSelection] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, errorMessage]);

  // Persist messages whenever messages or storageMode changes
  useEffect(() => {
    try {
      const serialized = JSON.stringify(messages);
      sessionStorage.setItem('flux_ai_chat_messages', serialized);
      if (storageMode === 'local') {
        localStorage.setItem('flux_ai_chat_messages', serialized);
      } else {
        localStorage.removeItem('flux_ai_chat_messages');
      }
    } catch (e) {
      console.warn('Failed to save chat messages:', e);
    }
  }, [messages, storageMode]);

  // Save config based on selected device storage mode
  const handleSaveSettings = () => {
    const trimmedBaseUrl = baseUrl.trim();
    const trimmedApiKey = apiKey.trim();
    const trimmedModel = modelName.trim();
    const trimmedSystem = systemPrompt.trim();

    try {
      localStorage.setItem('flux_ai_storage_mode', storageMode);

      if (storageMode === 'session') {
        // Store in sessionStorage for current browser tab session only
        sessionStorage.setItem('flux_ai_baseUrl', trimmedBaseUrl);
        sessionStorage.setItem('flux_ai_apiKey', trimmedApiKey);
        sessionStorage.setItem('flux_ai_model', trimmedModel);
        sessionStorage.setItem('flux_ai_system', trimmedSystem);

        // Wipe from localStorage so no leftover credentials remain for future users
        localStorage.removeItem('flux_ai_baseUrl');
        localStorage.removeItem('flux_ai_apiKey');
        localStorage.removeItem('flux_ai_model');
        localStorage.removeItem('flux_ai_system');
      } else {
        // Store in localStorage for persistent use on this device
        localStorage.setItem('flux_ai_baseUrl', trimmedBaseUrl);
        localStorage.removeItem('flux_ai_apiKey');
        localStorage.setItem('flux_ai_model', trimmedModel);
        localStorage.setItem('flux_ai_system', trimmedSystem);

        sessionStorage.setItem('flux_ai_baseUrl', trimmedBaseUrl);
        sessionStorage.setItem('flux_ai_apiKey', trimmedApiKey);
        sessionStorage.setItem('flux_ai_model', trimmedModel);
        sessionStorage.setItem('flux_ai_system', trimmedSystem);
      }

      setShowSettings(false);
      setErrorMessage(null);
      setSuccessMessage('配置已更新！凭证已安全存储在当前设备/会话中。');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (e) {
      console.error('Failed to save AI config:', e);
      setErrorMessage('无法写入浏览器本地存储，请检查隐私模式设置。');
    }
  };

  // Clear/Logout API credentials
  const handleClearCredentials = () => {
    try {
      sessionStorage.removeItem('flux_ai_baseUrl');
      sessionStorage.removeItem('flux_ai_apiKey');
      sessionStorage.removeItem('flux_ai_model');
      sessionStorage.removeItem('flux_ai_system');
      sessionStorage.removeItem('flux_ai_chat_messages');

      localStorage.removeItem('flux_ai_baseUrl');
      localStorage.removeItem('flux_ai_apiKey');
      localStorage.removeItem('flux_ai_model');
      localStorage.removeItem('flux_ai_system');
      localStorage.removeItem('flux_ai_storage_mode');
      localStorage.removeItem('flux_ai_chat_messages');
    } catch (e) {
      console.warn('Clear storage error:', e);
    }

    setMessages([]);
    setApiKey('');
    setBaseUrl('https://api.deepseek.com/v1');
    setModelName('deepseek-chat');
    setSystemPrompt('你是一个专业的 Markdown 写作助手，正在帮助用户在编辑器中进行创作。你可以直接生成 Markdown 内容，或者为用户的内容提供修改意见。请保持友好、专业且简洁。');
    setStorageMode('session');
    setErrorMessage(null);
    setSuccessMessage('已清除所有 API Key 登录信息与本地缓存！');
    setTimeout(() => setSuccessMessage(null), 3000);
    setShowSettings(true);
  };

  const applyPreset = (preset: PresetProvider) => {
    setBaseUrl(preset.baseUrl);
    setModelName(preset.defaultModel);
  };

  const constructApiUrl = (endpoint: string) => {
    const parsed = new URL(endpoint.trim());
    const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname);
    if ((parsed.protocol !== 'https:' && !(loopback && parsed.protocol === 'http:')) ||
        parsed.username || parsed.password || parsed.search || parsed.hash) {
      throw new Error('模型服务地址必须使用 HTTPS，本机 HTTP 地址除外。请移除凭证、查询参数及片段。');
    }
    const url = parsed.href.replace(/\/+$/, '');
    if (url.endsWith('/chat/completions')) {
      return url;
    }
    // If url ends with a version string like /v1, /v2, /v4, /v1beta, etc.
    if (/\/(v\d+[\w.-]*)$/i.test(url)) {
      return `${url}/chat/completions`;
    }
    return `${url}/v1/chat/completions`;
  };

  // Test connection to API
  const handleTestConnection = async () => {
    const trimmedBaseUrl = baseUrl.trim();
    const trimmedApiKey = apiKey.trim();
    const trimmedModel = modelName.trim() || 'deepseek-chat';

    if (!trimmedBaseUrl) {
      setErrorMessage('请填写 API 服务地址（Base URL）');
      return;
    }

    setIsTesting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const targetUrl = constructApiUrl(trimmedBaseUrl);
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (trimmedApiKey) headers['Authorization'] = `Bearer ${trimmedApiKey}`;

      const response = await fetch(targetUrl, {
        method: 'POST',
        redirect: 'error',
        headers,
        body: JSON.stringify({
          model: trimmedModel,
          messages: [{ role: 'user', content: 'Ping' }],
          max_tokens: 16,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        let parsed = errText;
        try {
          const jsonErr = JSON.parse(errText);
          parsed = jsonErr.error?.message || jsonErr.error || jsonErr.message || errText;
        } catch {
          // ignore
        }

        if (response.status === 401 || response.status === 403) {
          throw new Error(`身份验证失败 (HTTP ${response.status})：请检查 API Key 是否正确，或账户余额是否充裕。`);
        } else if (response.status === 404) {
          throw new Error(`请求路径未找到 (HTTP 404)：请检查 Base URL (${targetUrl}) 或模型名称 (${trimmedModel}) 是否拼写正确。`);
        } else if (response.status === 429) {
          throw new Error(`请求过于频繁或额度受限 (HTTP 429)：${parsed}`);
        }

        throw new Error(`测试连通失败 (HTTP ${response.status}): ${parsed}`);
      }

      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content ? ` (收到响应: "${data.choices[0].message.content.trim().slice(0, 30)}...")` : '';
      setSuccessMessage(`✅ 连通测试成功！API 服务与模型 [${trimmedModel}] 正常响应${reply}`);
    } catch (err: any) {
      console.error('Test connection error:', err);
      let msg = err.message || 'API 连通测试失败，请检查 Base URL 与 API Key。';
      if (msg === 'Failed to fetch' || err.name === 'TypeError') {
        msg = '网络连接失败 (Failed to fetch)。请检查：\n1. Base URL 网址拼写是否正确；\n2. 目标 API 是否支持跨域(CORS)请求；\n3. 是否在 HTTPS 页面中请求了 HTTP 接口。';
      }
      setErrorMessage(msg);
    } finally {
      setIsTesting(false);
    }
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

    const isLocalOllama = trimmedBaseUrl.includes('localhost') || trimmedBaseUrl.includes('127.0.0.1');
    if (!trimmedApiKey && !isLocalOllama) {
      setErrorMessage('未检测到 API Key！请先在设置中填入您的 API Key。');
      setShowSettings(true);
      return;
    }

    const userMessage = attachedSelection ? `${input.trim()}\n\n文档选区：\n${attachedSelection}` : input.trim();
    setInput('');
    setAttachedSelection('');
    setErrorMessage(null);
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const targetUrl = constructApiUrl(trimmedBaseUrl);
      
      // Preserve multi-turn chat history (limit to last 20 messages for context safety)
      const recentHistory = messages.slice(-20);
      const payloadMessages = [
        { role: 'system', content: systemPrompt },
        ...recentHistory.map(m => ({
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
        redirect: 'error',
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
          parsedError = jsonErr.error?.message || jsonErr.error || jsonErr.message || errorData;
        } catch {
          // ignore
        }

        if (response.status === 401 || response.status === 403) {
          throw new Error(`API Key 身份校验失败 (HTTP ${response.status})：请检查您填写的 API Key 是否正确无误，或者账户余额是否充裕。`);
        } else if (response.status === 404) {
          throw new Error(`请求路径未找到 (HTTP 404)：请检查 Base URL (${targetUrl}) 或模型名称 (${modelName}) 是否拼写正确。`);
        }

        throw new Error(`请求失败 (${response.status}): ${parsedError}`);
      }

      const data = await response.json();
      const aiResponse = data.choices?.[0]?.message?.content || '未能返回生成内容，请检查模型配置。';
      
      setMessages(prev => [...prev, { role: 'ai', content: aiResponse }]);
    } catch (error: any) {
      console.error('AI Request Error:', error);
      let msg = error.message || '网络连接失败，请检查 API 地址、API Key 或网络状态。';
      if (msg === 'Failed to fetch' || error.name === 'TypeError') {
        msg = '网络连接失败 (Failed to fetch)。请检查 Base URL 是否可访问或是否受 CORS 限制。';
      }
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

  const [reviewText,setReviewText]=useState<string|null>(null);
  const insertToEditor = (text: string) => {
    if (editor) {
      setReviewText(text);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      sessionStorage.removeItem('flux_ai_chat_messages');
      localStorage.removeItem('flux_ai_chat_messages');
    } catch (e) {
      console.warn('Failed to clear chat storage:', e);
    }
  };

  return (<>
    {reviewText !== null && <AIReview editor={editor} text={reviewText} onClose={()=>setReviewText(null)}/>}
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      className="assistant-panel w-96 border-l border-[var(--border)] bg-[var(--bg-primary)] flex flex-col shadow-2xl z-50 relative h-full"
    >
      {/* Header Bar */}
      <div className="p-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-secondary)] shrink-0">
        <div className="flex items-center gap-2 text-[var(--accent)] font-bold">
          <Sparkles size={18} />
          <div className="flex flex-col">
            <span className="text-sm">Flux AI 助手</span>
            <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-secondary)] font-normal">
              <span className="truncate max-w-[90px]">{modelName || '自定义模型'}</span>
              {messages.length > 0 && (
                <>
                  <span className="text-slate-300">•</span>
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/80 px-1 py-0.2 rounded font-medium">
                    {messages.length}条上下文
                  </span>
                </>
              )}
              <span className="text-slate-300">•</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-mono flex items-center gap-0.5">
                <Lock size={9} />
                {storageMode === 'session' ? '会话' : '本端'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-1.5 rounded-lg transition-colors ${
              showSettings 
                ? 'bg-[var(--accent)] text-white' 
                : 'hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
            title="配置 API 地址与密钥"
          >
            <Settings size={16} />
          </button>
          <button 
            onClick={clearChat}
            className="p-1.5 hover:bg-red-50 text-[var(--text-secondary)] hover:text-red-500 rounded-lg transition-colors"
            title="清空对话历史"
          >
            <Trash2 size={16} />
          </button>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg transition-colors"
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
                    <span>连接 AI 服务</span>
                  </div>
                  <button 
                    onClick={() => setShowSettings(false)}
                    className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  >
                    取消
                  </button>
                </div>

                <details className="assistant-advanced"><summary>存储与隐私选项</summary>                {/* Device & Privacy Badge */}
                <div className="p-2.5 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/60 rounded-xl text-xs space-y-1">
                  <div className="flex items-center justify-between text-blue-700 dark:text-blue-300 font-bold">
                    <span className="flex items-center gap-1">
                      <ShieldCheck size={14} />
                      设备安全与会话隔离
                    </span>
                    <span className="font-mono text-[10px] bg-blue-100 dark:bg-blue-900 px-1.5 py-0.5 rounded text-blue-800 dark:text-blue-200">
                      {deviceId}
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--text-primary)] dark:text-slate-300 leading-snug">
                    API 密钥只保留在当前标签页会话。发送请求时，密钥会作为认证信息交给所配置的模型服务商。
                  </p>
                </div>

                {/* Storage Mode Selection */}
                <div>
                  <label className="text-xs font-bold text-[var(--text-primary)] mb-1.5 block flex items-center gap-1">
                    <Lock size={13} className="text-[var(--accent)]" />
                    凭证保存模式 (Storage Scope)：
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setStorageMode('session')}
                      className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                        storageMode === 'session'
                          ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold shadow-2xs'
                          : 'border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] dark:text-[var(--text-secondary)]'
                      }`}
                    >
                      <div className="text-xs flex items-center justify-between">
                        <span>仅单次会话 (推荐)</span>
                        {storageMode === 'session' && <CheckCircle2 size={13} />}
                      </div>
                      <p className="text-[10px] opacity-75 font-normal mt-0.5">
                        关闭标签页或换账号登录后自动失效，彻底防残留
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setStorageMode('local')}
                      className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                        storageMode === 'local'
                          ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold shadow-2xs'
                          : 'border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] dark:text-[var(--text-secondary)]'
                      }`}
                    >
                      <div className="text-xs flex items-center justify-between">
                        <span>记住配置和对话</span>
                        {storageMode === 'local' && <CheckCircle2 size={13} />}
                      </div>
                      <p className="text-[10px] opacity-75 font-normal mt-0.5">
                        在此浏览器记住配置与对话，密钥仍只保留在当前会话
                      </p>
                    </button>
                  </div>
                </div>

</details>
                {/* Quick Presets */}
                <div>
                  <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1.5">
                    模型服务商
                  </label>
                  <select aria-label="模型服务商" defaultValue="" onChange={e=>{if(e.target.value!=='')applyPreset(PRESET_PROVIDERS[Number(e.target.value)]);}} className="w-full p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-xs"><option value="" disabled>选择服务商…</option>{PRESET_PROVIDERS.map((preset,i)=><option key={preset.name} value={i}>{preset.name}</option>)}</select>
                </div>

                {/* Base URL */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--text-primary)] dark:text-slate-300 flex items-center gap-1">
                    <Globe size={13} className="text-[var(--text-secondary)]" />
                    <span>API 服务地址 (Base URL)</span>
                  </label>
                  <input
                    type="text"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    placeholder="https://api.openai.com/v1"
                    className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent)] outline-none"
                  />
                </div>

                {/* API Key */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--text-primary)] dark:text-slate-300 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Key size={13} className="text-[var(--text-secondary)]" />
                      <span>API 密钥 (API Key)</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      {showApiKey ? <EyeOff size={12} /> : <Eye size={12} />}
                      {showApiKey ? '隐藏明文' : '显示明文'}
                    </button>
                  </label>
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-..."
                    className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent)] outline-none font-mono"
                  />
                </div>

                {/* Model Name */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--text-primary)] dark:text-slate-300 flex items-center gap-1">
                    <Cpu size={13} className="text-[var(--text-secondary)]" />
                    <span>模型名称 (Model Name)</span>
                  </label>
                  <input
                    type="text"
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                    placeholder="deepseek-chat"
                    className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent)] outline-none"
                  />
                </div>

                <details className="assistant-advanced"><summary>高级提示词</summary>                {/* System Prompt */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--text-primary)] dark:text-slate-300 block">
                    系统提示词 (System Instruction)
                  </label>
                  <textarea
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    rows={2}
                    className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent)] outline-none resize-none"
                  />
                </div>
</details>
              </div>

              {/* Action Toolbar */}
              <div className="pt-3 border-t border-[var(--border)] mt-4 space-y-2">
                {/* Instant Feedback Alert inside Settings Panel */}
                {successMessage && (
                  <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-700 dark:text-emerald-300 text-xs flex items-start gap-2 shadow-sm">
                    <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                    <div className="flex-1 leading-snug break-words">
                      <p className="font-bold">连通测试通过</p>
                      <p className="text-[11px] opacity-90 whitespace-pre-wrap">{successMessage}</p>
                    </div>
                  </div>
                )}

                {errorMessage && (
                  <div className="p-2.5 bg-red-50 dark:bg-red-950/70 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-300 text-xs flex items-start gap-2 shadow-sm">
                    <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-500 shrink-0" />
                    <div className="flex-1 leading-snug break-words">
                      <p className="font-bold">连通失败 / 校验异常</p>
                      <p className="text-[11px] opacity-90 whitespace-pre-wrap">{errorMessage}</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={isTesting}
                    className="bg-[var(--bg-secondary)] border border-[var(--border)] hover:bg-[var(--bg-primary)] text-[var(--text-primary)] text-xs py-2 rounded-xl font-medium transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw size={12} className={isTesting ? 'animate-spin text-[var(--accent)]' : ''} />
                    {isTesting ? '正在测试连通性...' : '测试连通性'}
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveSettings}
                    className="bg-[var(--accent)] text-white text-xs py-2 rounded-xl font-bold shadow-md hover:opacity-90 active:scale-98 transition-all cursor-pointer"
                  >
                    保存配置并开启
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleClearCredentials}
                  className="w-full text-center py-1.5 text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <LogOut size={13} />
                  一键清除 / 退出本端 API 登录凭证
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
          {messages.length === 0 && !showSettings && (
            <div className="h-full flex flex-col items-center justify-center text-[var(--text-secondary)] space-y-3 opacity-70 my-auto py-12">
              <MessageSquare size={40} className="text-[var(--accent)] opacity-60" />
              <div className="text-center space-y-1 px-4">
                <p className="text-xs font-medium text-[var(--text-primary)]">Flux AI 大模型助手</p>
                <p className="text-[11px] text-[var(--text-secondary)]">
                  当前模型：<span className="font-mono text-[var(--accent)]">{modelName || '未设置'}</span>
                </p>
                <p className="text-[10px] text-[var(--text-secondary)] pt-2">
                  调用您自己的 API Key 辅助创作。凭证隔离保护，跨用户绝不残留。
                </p>
              </div>
              <button
                onClick={() => setShowSettings(true)}
                className="text-xs px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] hover:text-[var(--accent)] transition-colors flex items-center gap-1.5 cursor-pointer"
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
                    className="flex items-center gap-1 text-[10px] text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors cursor-pointer"
                  >
                    {copiedIndex === i ? <Check size={11} /> : <Copy size={11} />}
                    {copiedIndex === i ? '已复制' : '复制'}
                  </button>
                  <button 
                    onClick={() => insertToEditor(msg.content)}
                    className="flex items-center gap-1 text-[10px] text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors cursor-pointer"
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
                  <span className="text-[10px] text-[var(--text-secondary)] mr-1">思考生成中</span>
                  <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full" />
                  <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full" />
                  <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full" />
                </div>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 size={16} className="shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-2 text-red-600 dark:text-red-300 text-xs">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1">
                <p className="font-bold">请求未完成</p>
                <p className="text-[11px] opacity-90">{errorMessage}</p>
                <button
                  onClick={() => setShowSettings(true)}
                  className="text-[10px] underline hover:opacity-80 pt-1 block cursor-pointer"
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
        <details className="mb-2 text-xs text-[var(--text-secondary)]">
          <summary className="cursor-pointer">发送内容 · {Math.min(messages.length, 20)} 条历史{attachedSelection ? ' · 已附选区' : ''}</summary>
          <div className="max-h-40 overflow-auto space-y-2 py-2">
            <p>目标服务：{baseUrl || '尚未配置'}</p>
            <button type="button" onClick={() => {
              if (!editor) return;
              const {from, to} = editor.state.selection;
              setAttachedSelection(editor.state.doc.textBetween(from, to, '\n').trim());
            }}>附加当前选区</button>
            {attachedSelection && <><pre className="whitespace-pre-wrap">{attachedSelection}</pre><button type="button" onClick={()=>setAttachedSelection('')}>移除选区</button></>}
            <p className="whitespace-pre-wrap">系统提示：{systemPrompt}</p>
            {messages.slice(-20).map((message,index)=><p className="whitespace-pre-wrap" key={index}>{message.role === 'user' ? '我' : '助手'}：{message.content}</p>)}
          </div>
        </details>
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
                ? 'text-slate-300 bg-[var(--bg-secondary)] dark:bg-slate-800 cursor-not-allowed' 
                : 'bg-[var(--accent)] text-white shadow-md active:scale-95 cursor-pointer'
            }`}
          >
            <Send size={15} />
          </button>
        </div>
        <div className="mt-1.5 flex items-center justify-between text-[10px] text-[var(--text-secondary)] px-1">
          <span className="flex items-center gap-1">
            <Lock size={10} className="text-emerald-500" />
            {storageMode === 'session' ? '会话单次模式 (无残留)' : '本端持久保存模式'}
          </span>
          <button 
            onClick={() => setShowSettings(true)}
            className="hover:text-[var(--accent)] transition-colors flex items-center gap-0.5 cursor-pointer"
          >
            <span>{modelName || '设置 API'}</span>
            <Settings size={10} />
          </button>
        </div>
      </div>
    </motion.div></>
  );
};
