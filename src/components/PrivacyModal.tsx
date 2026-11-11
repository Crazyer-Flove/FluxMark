import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, HardDrive, Lock, EyeOff, ServerOff, FileCheck, X, Sparkles, CheckCircle2 } from 'lucide-react';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 z-[2500] flex items-center justify-center p-4 sm:p-6 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', duration: 0.3 }}
          className="bg-[var(--bg-primary)] rounded-3xl w-full max-w-2xl shadow-2xl border border-[var(--border)] overflow-hidden text-[var(--text-primary)] my-auto"
        >
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 p-6 text-white relative overflow-hidden">
            <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-[var(--bg-primary)]/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-[var(--bg-primary)]/15 backdrop-blur-md rounded-2xl border border-white/20 text-white shadow-inner">
                  <ShieldCheck size={28} />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                    隐私说明与数据安全承诺
                  </h2>
                  <p className="text-xs text-blue-100/90 mt-0.5">
                    FluxMark 坚守“本地优先”原则，全方位守护您的文档资产与个人隐私
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-[var(--bg-primary)]/20 rounded-full text-white/80 hover:text-white transition-colors cursor-pointer"
                title="关闭"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
            {/* Quick Highlight Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100/80 flex items-start gap-3">
                <div className="p-2 bg-emerald-500 text-white rounded-xl shrink-0 mt-0.5">
                  <HardDrive size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-emerald-900">100% 本地数据存取</h4>
                  <p className="text-[11px] text-emerald-700/90 leading-relaxed mt-0.5">
                    文档与数据完全离线保存在您的浏览器与本地文件系统中，不向任何远程服务器静默同步。
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-100/80 flex items-start gap-3">
                <div className="p-2 bg-blue-500 text-white rounded-xl shrink-0 mt-0.5">
                  <ServerOff size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-blue-900">无广告 & 无后台追踪</h4>
                  <p className="text-[11px] text-blue-700/90 leading-relaxed mt-0.5">
                    完全零广告嵌入，绝无隐藏的第三方 User Analytics 追踪代码与 Cookie 收集。
                  </p>
                </div>
              </div>
            </div>

            {/* Detailed Policies */}
            <div className="space-y-4 pt-1">
              <div className="border-l-2 border-indigo-500 pl-4 space-y-1">
                <h4 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <Lock size={16} className="text-indigo-600" />
                  1. 本地存储与文件读取安全
                </h4>
                <p className="text-xs text-[var(--text-primary)] leading-relaxed">
                  FluxMark 采用标准 Web File System Access API 与 IndexedDB 本地数据库存储。您通过本地导入或保存的文件，仅在您授权的本机目录中读写，应用程序无权限越权访问您电脑中的其他隐私文件。
                </p>
              </div>

              <div className="border-l-2 border-purple-500 pl-4 space-y-1">
                <h4 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <Sparkles size={16} className="text-purple-600" />
                  2. AI 交互与数据传输说明
                </h4>
                <p className="text-xs text-[var(--text-primary)] leading-relaxed">
                  使用 AI 时，您发送的内容和对话上下文会提交给所配置的模型服务商。数据保留与训练用途取决于该服务商政策。对话记录根据设置保存在会话或本机浏览器中；本地模型的传输方式由您配置的地址决定。
                </p>
              </div>

              <div className="border-l-2 border-cyan-500 pl-4 space-y-1">
                <h4 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <EyeOff size={16} className="text-cyan-600" />
                  3. 导出与知识产权归属
                </h4>
                <p className="text-xs text-[var(--text-primary)] leading-relaxed">
                  您在 FluxMark 中创作、导出的所有 Markdown、Word、PDF、HTML 以及图片长图，知识产权与所有权 100% 完全归属于您个人。导出的文档不带有任何隐形水印或上传记录。
                </p>
              </div>
            </div>

            {/* Security Compliance Badge */}
            <div className="p-3 bg-[var(--bg-secondary)] border border-[var(--border)]/80 rounded-2xl flex items-center justify-between text-xs text-[var(--text-secondary)]">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-500" />
                <span>隐私协议安全状态：<strong className="text-[var(--text-primary)]">已激活并实时保护中</strong></span>
              </div>
              <span className="text-[11px] font-mono text-[var(--text-secondary)]">v2.5 Local Security</span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-5 bg-[var(--bg-secondary)] border-t border-[var(--border)] flex items-center justify-between">
            <span className="text-xs text-[var(--text-secondary)]">
              FluxMark 极简纯粹，为您的创作保驾护航
            </span>
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-slate-900 text-white hover:bg-slate-800 font-bold text-sm rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
            >
              理解并同意
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
