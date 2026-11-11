import { Extension, markInputRule, markPasteRule } from '@tiptap/core';
import { Text } from '@tiptap/extension-text';
import { wikiLinkSource } from './WikiLink';

const wikiLinkPattern = new RegExp('^' + wikiLinkSource);

const configured = new WeakSet<object>();
const decorations = [
  { name: 'highlight', pattern: /^==([^=\n]+)==/, tag: 'mark', boundary: /(?<![\\=])/ },
  { name: 'superscript', pattern: /^\^([^\s^]+)\^/, tag: 'sup', boundary: /(?<![\\^])/ },
  { name: 'subscript', pattern: /^~([^\s~]+)~(?!~)/, tag: 'sub', boundary: /(?<![\\~])/ },
] as const;

export const MarkdownText = Text.extend({
  addStorage() {
    return { markdown: { serialize(state: any, node: any) {
      state.options.escapeExtraCharacters = /[$^=]/g;
      state.text(node.text.replace(/</g, '&lt;').replace(/>/g, '&gt;'));
    } } };
  },
});

export const MarkdownSyntax = Extension.create({
  name: 'fluxmarkMarkdownSyntax',
  priority: 50,

  addStorage() {
    return { markdown: { parse: {
      setup(md: any) {
        if (configured.has(md)) return;
        configured.add(md);
        md.inline.ruler.before('link', 'fluxmarkWikiLink', (state: any, silent: boolean) => {
          if (state.src[state.pos] !== '[' || state.src[state.pos + 1] !== '[') return false;
          const match = wikiLinkPattern.exec(state.src.slice(state.pos, state.posMax));
          if (!match || !match[1].trim()) return false;
          if (!silent) {
            const escape = md.utils.escapeHtml;
            const target = match[1].trim();
            const alias = match[2]?.trim() || '';
            state.push('html_inline', '', 0).content =
              `<span data-wiki-target="${escape(target)}" data-wiki-alias="${escape(alias)}">${escape(alias || target)}</span>`;
          }
          state.pos += match[0].length;
          return true;
        });
        md.inline.ruler.before('emphasis', 'fluxmarkDecorations', (state: any, silent: boolean) => {
          const source = state.src.slice(state.pos, state.posMax);
          const decoration = decorations.find(item => item.pattern.test(source));
          const match = decoration?.pattern.exec(source) ?? /^\$(?!\$)([^$\n]+)\$(?!\$)/.exec(source);
          if (!match || match[1] !== match[1].trim()) return false;
          if (!silent) {
            const token = state.push('html_inline', '', 0);
            token.content = decoration
              ? `<${decoration.tag}>${md.renderInline(match[1], state.env)}</${decoration.tag}>`
              : `<span data-type="inline-math" data-latex="${md.utils.escapeHtml(match[1])}"></span>`;
          }
          state.pos += match[0].length;
          return true;
        });
        md.block.ruler.before('fence', 'fluxmarkBlockMath', (state: any, start: number, end: number, silent: boolean) => {
          const line = (index: number) => state.src.slice(state.bMarks[index] + state.tShift[index], state.eMarks[index]);
          const opening = line(start);
          if (!opening.startsWith('$$') || state.sCount[start] - state.blkIndent >= 4) return false;
          let closing = start;
          let latex = opening.slice(2);
          while (!latex.trimEnd().endsWith('$$')) {
            if (++closing >= end || (line(closing).trim() && state.sCount[closing] < state.blkIndent)) return false;
            latex += '\n' + line(closing);
          }
          latex = latex.trimEnd().slice(0, -2).trim();
          if (!latex) return false;
          if (!silent) {
            const token = state.push('html_block', '', 0);
            token.content = `<div data-type="block-math" data-latex="${md.utils.escapeHtml(latex)}"></div>`;
            state.line = closing + 1;
          }
          return true;
        }, { alt: ['paragraph', 'reference', 'blockquote', 'list'] });
      },
      updateDOM(root: HTMLElement) {
        for (const list of root.querySelectorAll<HTMLUListElement | HTMLOListElement>('.contains-task-list')) {
          let group: HTMLElement | undefined;
          let previousTask: boolean | undefined;
          let ordinal = Number(list.getAttribute('start') ?? 1);
          for (const item of Array.from(list.children)) {
            const task = item.getAttribute('data-type') === 'taskItem';
            if (!group || task !== previousTask) {
              group = document.createElement(task ? 'ul' : list.tagName.toLowerCase());
              if (task) group.setAttribute('data-type', 'taskList');
              else if (list.tagName === 'OL' && ordinal !== 1) group.setAttribute('start', String(ordinal));
              list.before(group);
              previousTask = task;
            }
            group.append(item);
            ordinal++;
          }
          list.remove();
        }
      },
    } } };
  },

  addInputRules() {
    return decorations.map(({ name, pattern, boundary }) => markInputRule({
      find: new RegExp(boundary.source + pattern.source.slice(1) + '$'),
      type: this.editor.schema.marks[name],
    }));
  },

  addPasteRules() {
    return decorations.map(({ name, pattern, boundary }) => markPasteRule({
      find: new RegExp(boundary.source + pattern.source.slice(1), 'g'),
      type: this.editor.schema.marks[name],
    }));
  },
});
