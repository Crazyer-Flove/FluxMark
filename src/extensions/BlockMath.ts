import { Node, mergeAttributes, InputRule, PasteRule } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { MathematicsComponent } from '../components/MathematicsComponent';

export const BlockMath = Node.create({
  name: 'blockMath',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      latex: {
        default: '',
      },
      displayMode: {
        default: true,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="block-math"]',
        getAttrs: (element: HTMLElement) => ({
          latex: element.getAttribute('data-latex'),
        }),
      },
      {
        tag: 'math-block',
        getAttrs: (element: HTMLElement) => ({
          latex: element.textContent,
        }),
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'block-math' }), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MathematicsComponent);
  },

  addInputRules() {
    return [
      new InputRule({
        find: /(?:^|\s)\$\$([^\s\$][^\$]*[^\s\$]?)\$\$$/,
        handler: ({ state, range, match }) => {
          const { tr } = state;
          const offset = match[0].indexOf('$');
          const start = range.from + offset;
          const end = range.to;

          if (match[1]) {
            tr.replaceWith(start, end, this.type.create({
              latex: match[1],
              displayMode: true,
            }));
          }
        },
      }),
    ];
  },

  addPasteRules() {
    return [
      new PasteRule({
        find: /\$\$([\s\S]+?)\$\$/g,
        handler: ({ state, range, match }) => {
          const { tr } = state;
          const start = range.from;
          const end = range.to;

          if (match[1]) {
            tr.replaceWith(start, end, this.type.create({
              latex: match[1],
              displayMode: true,
            }));
          }
        },
      }),
    ];
  },
});
