import { Extension } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';
import { PluginKey } from '@tiptap/pm/state';
import { createSuggestionRenderer } from './renderSuggestionPopup';

export interface HeadingOption {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  title: string;
  subtitle: string;
  tag: string;
}

export const HEADING_ITEMS: HeadingOption[] = [
  { level: 1, title: '一级标题 (H1)', subtitle: '最高层级主标题', tag: '# H1' },
  { level: 2, title: '二级标题 (H2)', subtitle: '主要章节标题', tag: '## H2' },
  { level: 3, title: '三级标题 (H3)', subtitle: '小节标题', tag: '### H3' },
  { level: 4, title: '四级标题 (H4)', subtitle: '子小节标题', tag: '#### H4' },
  { level: 5, title: '五级标题 (H5)', subtitle: '深层节点标题', tag: '##### H5' },
  { level: 6, title: '六级标题 (H6)', subtitle: '最低层级标题', tag: '###### H6' },
];

export const HeadingSuggestion = Extension.create({
  name: 'headingSuggestion',

  addOptions() {
    return {
      suggestion: {
        char: '#',
        pluginKey: new PluginKey('headingSuggestion'),
        items: ({ query }: { query: string }) => {
          const q = query.toLowerCase().trim();
          if (!q) return HEADING_ITEMS;
          return HEADING_ITEMS.filter(
            item =>
              item.level.toString() === q ||
              item.title.toLowerCase().includes(q) ||
              item.subtitle.toLowerCase().includes(q) ||
              `h${item.level}`.includes(q)
          );
        },
        render: createSuggestionRenderer<HeadingOption>({
          type: 'heading',
          title: '标题快速插入 (#)',
          renderItem: (item, isSelected) => `
            <div class="flex items-center gap-2 w-full overflow-hidden">
              <span class="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                isSelected
                  ? 'bg-blue-200/80 dark:bg-blue-800 text-blue-800 dark:text-blue-100'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
              }">${item.tag}</span>
              <div class="flex flex-col min-w-0 flex-1">
                <span class="font-medium truncate text-slate-800 dark:text-slate-100">${item.title}</span>
                <span class="text-[10px] text-slate-400 dark:text-slate-500 truncate">${item.subtitle}</span>
              </div>
            </div>
          `,
        }),
        command: ({ editor, range, props }: any) => {
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .setNode('heading', { level: props.level })
            .run();
        },
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});
