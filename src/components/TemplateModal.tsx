import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, FileText, Check, Sparkles, BookOpen, Code2, 
  GraduationCap, Briefcase, Monitor, Layers, ArrowRight
} from 'lucide-react';
import { DOCUMENT_TEMPLATES, DocumentTemplate } from '../data/templates';

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: DocumentTemplate) => void;
}

export const TemplateModal: React.FC<TemplateModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeTemplateId, setActiveTemplateId] = useState<string>(DOCUMENT_TEMPLATES[0].id);

  if (!isOpen) return null;

  const categories = [
    { id: 'all', label: '全部模版', icon: <Layers size={14} /> },
    { id: 'overview', label: '全功能上手', icon: <Sparkles size={14} /> },
    { id: 'tech', label: '技术工程', icon: <Code2 size={14} /> },
    { id: 'academic', label: '学术科研', icon: <GraduationCap size={14} /> },
    { id: 'office', label: '日常办公', icon: <BookOpen size={14} /> },
    { id: 'resume', label: '求职简历', icon: <Briefcase size={14} /> },
    { id: 'ppt', label: '演示放映', icon: <Monitor size={14} /> },
  ];

  const filteredTemplates = selectedCategory === 'all'
    ? DOCUMENT_TEMPLATES
    : DOCUMENT_TEMPLATES.filter(t => t.category === selectedCategory);

  const activeTemplate = DOCUMENT_TEMPLATES.find(t => t.id === activeTemplateId) || DOCUMENT_TEMPLATES[0];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[250] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, y: 15, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.95, y: 15, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border)] rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden"
        >
          {/* Modal Header */}
          <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-secondary)]/50">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[var(--accent)]/10 text-[var(--accent)] rounded-2xl">
                <FileText size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <span>选择精选文档示例模版</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 dark:bg-blue-950 text-[var(--accent)] rounded-full">
                    {DOCUMENT_TEMPLATES.length} 款示例
                  </span>
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">一键载入开箱即用的专业排版内容与示例格式</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[var(--bg-secondary)] rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Category Tabs */}
          <div className="px-6 py-2.5 border-b border-[var(--border)] bg-[var(--bg-primary)] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-[var(--accent)] text-white shadow-sm shadow-blue-200 dark:shadow-none'
                    : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border)]'
                }`}
              >
                {cat.icon}
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Body: Split View (Template Grid + Live Content Preview) */}
          <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[380px]">
            {/* Left: Template Cards */}
            <div className="md:col-span-5 p-4 border-r border-[var(--border)] overflow-y-auto space-y-2.5 max-h-[55vh] md:max-h-none">
              {filteredTemplates.map((tpl) => {
                const isActive = tpl.id === activeTemplateId;
                return (
                  <div
                    key={tpl.id}
                    onClick={() => setActiveTemplateId(tpl.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-1.5 relative group ${
                      isActive
                        ? 'border-[var(--accent)] bg-blue-50/70 dark:bg-blue-950/40 shadow-sm'
                        : 'border-[var(--border)] bg-[var(--bg-primary)] hover:border-blue-300 dark:hover:border-blue-800 hover:bg-[var(--bg-secondary)]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors truncate">
                        {tpl.title}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] shrink-0">
                        {tpl.badge}
                      </span>
                    </div>

                    <p className="text-[11px] text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                      {tpl.description}
                    </p>

                    <div className="flex items-center justify-between pt-1 text-[10px] text-[var(--text-secondary)] font-mono">
                      <span>{tpl.docName}</span>
                      {isActive && <Check size={14} className="text-[var(--accent)] font-bold" />}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right: Template Content Preview & Action */}
            <div className="md:col-span-7 p-5 flex flex-col bg-[var(--bg-secondary)]/30 overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] mb-3 shrink-0">
                <div>
                  <h4 className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-2">
                    <span>{activeTemplate.title}</span>
                  </h4>
                  <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 font-mono">
                    目标文件: {activeTemplate.docName}
                  </p>
                </div>

                <button
                  onClick={() => {
                    onSelectTemplate(activeTemplate);
                    onClose();
                  }}
                  className="px-4 py-2 bg-[var(--accent)] hover:opacity-90 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer shrink-0"
                >
                  <span>使用此模版</span>
                  <ArrowRight size={14} />
                </button>
              </div>

              {/* Code / Markdown snippet preview */}
              <div className="flex-1 overflow-y-auto p-3.5 bg-[var(--bg-primary)] rounded-2xl border border-[var(--border)] font-mono text-[11px] leading-relaxed text-[var(--text-secondary)] whitespace-pre-wrap select-text">
                {activeTemplate.content}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-[var(--border)] bg-[var(--bg-secondary)]/50 flex items-center justify-between text-xs text-[var(--text-secondary)]">
            <span>💡 提示：将清空或覆盖当前编辑器内容（会弹出二次确认防护）。</span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl border border-[var(--border)] hover:bg-[var(--bg-secondary)] text-[var(--text-primary)] font-medium transition-colors cursor-pointer"
            >
              取消
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
