import { Extension } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';
import { PluginKey } from '@tiptap/pm/state';
import { createSuggestionRenderer } from './renderSuggestionPopup';

export interface EmojiOption {
  emoji: string;
  name: string;
  label: string;
  keywords: string[];
}

export const EMOJI_ITEMS: EmojiOption[] = [
  { emoji: '😀', name: 'smile', label: '微笑', keywords: ['smile', 'happy', '开怀', '微笑'] },
  { emoji: '😊', name: 'blush', label: '欢喜', keywords: ['blush', 'happy', '欢喜', '高兴'] },
  { emoji: '😂', name: 'joy', label: '破涕为笑', keywords: ['joy', 'laugh', '笑', '哈哈', '破涕为笑'] },
  { emoji: '🤣', name: 'rofl', label: '爆笑', keywords: ['rofl', 'laugh', '爆笑', '搞笑'] },
  { emoji: '😍', name: 'heart_eyes', label: '喜爱', keywords: ['heart_eyes', 'love', '喜爱', '色', '爱'] },
  { emoji: '🥰', name: 'smiling_face_with_3_hearts', label: '幸福', keywords: ['love', '幸福', '温暖', '心'] },
  { emoji: '😭', name: 'sob', label: '大哭', keywords: ['sob', 'cry', '哭', '伤心', '大哭'] },
  { emoji: '😎', name: 'sunglasses', label: '酷', keywords: ['cool', '酷', '帅气', '墨镜'] },
  { emoji: '🤔', name: 'thinking', label: '思考', keywords: ['thinking', 'think', '思考', '考虑', '想'] },
  { emoji: '🥳', name: 'party', label: '庆祝', keywords: ['party', 'celebrate', '庆祝', '欢呼', '派对'] },
  { emoji: '👍', name: 'thumbsup', label: '点赞', keywords: ['thumbsup', 'like', '赞', '点赞', '好'] },
  { emoji: '👎', name: 'thumbsdown', label: '踩', keywords: ['thumbsdown', 'dislike', '踩', '不好'] },
  { emoji: '👏', name: 'claps', label: '鼓掌', keywords: ['clap', 'applaud', '鼓掌', '赞许', '掌声'] },
  { emoji: '🙌', name: 'raised_hands', label: '举手', keywords: ['raise', '举手', '万岁', '欢呼'] },
  { emoji: '🙏', name: 'pray', label: '感谢', keywords: ['pray', 'thank', '感谢', '祈祷', '拜托'] },
  { emoji: '❤️', name: 'heart', label: '红心', keywords: ['heart', 'love', '心', '爱心', '红心'] },
  { emoji: '💖', name: 'sparkling_heart', label: '闪亮心', keywords: ['heart', '闪心', '喜欢', '爱'] },
  { emoji: '🔥', name: 'fire', label: '火焰', keywords: ['fire', 'hot', '火', '火焰', '热门', '爆'] },
  { emoji: '🚀', name: 'rocket', label: '火箭', keywords: ['rocket', 'launch', '火箭', '发射', '起飞'] },
  { emoji: '✨', name: 'sparkles', label: '闪烁', keywords: ['sparkles', 'star', '闪烁', '亮', '特效'] },
  { emoji: '🌟', name: 'star', label: '星星', keywords: ['star', '星星', '推荐', '优秀'] },
  { emoji: '💡', name: 'idea', label: '灵感', keywords: ['idea', 'light', '灵感', '灯泡', '想法'] },
  { emoji: '📌', name: 'pin', label: '图钉', keywords: ['pin', '图钉', '置顶', '固定'] },
  { emoji: '📝', name: 'memo', label: '备忘录', keywords: ['memo', 'note', '备忘录', '笔记', '记录'] },
  { emoji: '✏️', name: 'pencil', label: '铅笔', keywords: ['pencil', 'write', '铅笔', '编辑', '写'] },
  { emoji: '📚', name: 'books', label: '图书', keywords: ['books', 'read', '图书', '书', '知识'] },
  { emoji: '🐛', name: 'bug', label: '调试', keywords: ['bug', 'code', '漏洞', '调试', '问题'] },
  { emoji: '⚡', name: 'zap', label: '闪电', keywords: ['zap', 'electric', '闪电', '快捷', '快'] },
  { emoji: '🎯', name: 'target', label: '目标', keywords: ['target', 'goal', '目标', '准确', '靶心'] },
  { emoji: '✅', name: 'check', label: '完成', keywords: ['check', 'done', '完成', '正确', '对', '勾'] },
  { emoji: '❌', name: 'cross', label: '错误', keywords: ['cross', 'error', '错误', '取消', '叉'] },
  { emoji: '⚠️', name: 'warning', label: '警告', keywords: ['warning', '警告', '注意', '提醒'] },
  { emoji: '🚨', name: 'rotating_light', label: '警报', keywords: ['alert', '警报', '紧急', '危险'] },
  { emoji: '🎨', name: 'palette', label: '调色板', keywords: ['art', '调色板', '设计', '艺术'] },
  { emoji: '☕', name: 'coffee', label: '咖啡', keywords: ['coffee', '咖啡', '休息', '下午茶'] },
  { emoji: '🔍', name: 'search', label: '搜索', keywords: ['search', '搜索', '查找', '查询'] },
  { emoji: '🤖', name: 'robot', label: '机器人', keywords: ['robot', 'ai', '机器人', '智能', 'AI'] },
  { emoji: '💬', name: 'speech', label: '对话', keywords: ['chat', '对话', '消息', '沟通'] },
  { emoji: '🌈', name: 'rainbow', label: '彩虹', keywords: ['rainbow', '彩虹', '美丽'] },
  { emoji: '🎁', name: 'gift', label: '礼物', keywords: ['gift', '礼物', '惊喜'] },
  { emoji: '✌️', name: 'v', label: '胜利', keywords: ['v', 'victory', '胜利', '耶'] },
  { emoji: '🎉', name: 'tada', label: '礼花', keywords: ['tada', 'party', '礼花', '恭喜', '庆祝'] },
  { emoji: '🔒', name: 'lock', label: '锁', keywords: ['lock', 'secure', '锁', '安全', '私密'] },
  { emoji: '🔓', name: 'unlock', label: '解锁', keywords: ['unlock', '解锁', '开放'] },
  { emoji: '🌐', name: 'globe', label: '网络', keywords: ['globe', 'web', '网络', '全球'] },
  { emoji: '⏰', name: 'clock', label: '时间', keywords: ['clock', 'time', '时钟', '时间', '定时'] },
  { emoji: '📅', name: 'calendar', label: '日历', keywords: ['calendar', 'date', '日历', '日期'] },
  { emoji: '💰', name: 'money', label: '金钱', keywords: ['money', '金钱', '预算', '钱'] },
  { emoji: '🏆', name: 'trophy', label: '奖杯', keywords: ['trophy', '奖杯', '荣誉', '第一'] },
  { emoji: '🎵', name: 'music', label: '音乐', keywords: ['music', '音乐', '音符', '歌'] },
];

export const EmojiSuggestion = Extension.create({
  name: 'emojiSuggestion',

  addOptions() {
    return {
      suggestion: {
        char: ':',
        pluginKey: new PluginKey('emojiSuggestion'),
        items: ({ query }: { query: string }) => {
          const q = query.toLowerCase().trim();
          if (!q) return EMOJI_ITEMS.slice(0, 15);
          return EMOJI_ITEMS.filter(
            item =>
              item.name.toLowerCase().includes(q) ||
              item.label.toLowerCase().includes(q) ||
              item.keywords.some(k => k.toLowerCase().includes(q))
          ).slice(0, 20);
        },
        render: createSuggestionRenderer<EmojiOption>({
          type: 'emoji',
          title: 'Emoji 表情选择 (:)',
          renderItem: (item) => `
            <div class="flex items-center gap-2.5 w-full overflow-hidden">
              <span class="text-base leading-none shrink-0">${item.emoji}</span>
              <div class="flex items-center justify-between min-w-0 flex-1">
                <span class="font-medium truncate text-slate-800 dark:text-slate-100">${item.label}</span>
                <span class="font-mono text-[10px] text-slate-400 dark:text-slate-500 ml-1 shrink-0">:${item.name}:</span>
              </div>
            </div>
          `,
        }),
        command: ({ editor, range, props }: any) => {
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .insertContent(props.emoji)
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
