import { Node, mergeAttributes, InputRule, PasteRule } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { MathematicsComponent } from '../components/MathematicsComponent';

export const InlineMath = Node.create({
  name: 'inlineMath',
  group: 'inline',
  inline: true,
  atom: true,

  addAttributes() {
    return {
      latex: {
        default: '',
      },
      displayMode: {
        default: false,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="inline-math"]',
        getAttrs: (element: HTMLElement) => ({
          latex: element.getAttribute('data-latex'),
        }),
      },
      {
        tag: 'math-inline',
        getAttrs: (element: HTMLElement) => ({
          latex: element.textContent,
        }),
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { 'data-type': 'inline-math' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MathematicsComponent);
  },

  addInputRules() {
    return [
      new InputRule({
        find: /(?:^|\s)\$([^\s\$][^\$]*[^\s\$]?)\$$/,
        handler: ({ state, range, match }) => {
          const { tr } = state;
          // match[0] is " $x$", match[1] is "x"
          // We want to keep the character before the first $ if it's a space
          const offset = match[0].indexOf('$');
          const start = range.from + offset;
          const end = range.to;

          if (match[1]) {
            tr.replaceWith(start, end, this.type.create({
              latex: match[1],
              displayMode: false,
            }));
          }
        },
      }),
    ];
  },

  addPasteRules() {
    return [
      new PasteRule({
        find: /\$([^\$]+)\$/g,
        handler: ({ state, range, match }) => {
          const { tr } = state;
          const start = range.from;
          const end = range.to;

          if (match[1]) {
            tr.replaceWith(start, end, this.type.create({
              latex: match[1],
              displayMode: false,
            }));
          }
        },
      }),
    ];
  },
});
