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
          latex: element.getAttribute('data-latex') || '',
        }),
      },
      {
        tag: 'math-block',
        getAttrs: (element: HTMLElement) => ({
          latex: element.textContent || '',
        }),
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'block-math' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MathematicsComponent);
  },

  addInputRules() {
    return [
      // Rule 1: Typing $$latex$$
      new InputRule({
        find: /(?:^|[^$])\$\$([^$]+)\$\$$/,
        handler: ({ state, range, match }) => {
          const { tr } = state;
          const latex = match[1] ? match[1].trim() : '';

          const offset = match[0].indexOf('$');
          const start = range.from + offset;
          const end = range.to;

          tr.replaceWith(
            start,
            end,
            this.type.create({
              latex,
              displayMode: true,
            })
          );
        },
      }),
      // Rule 2: Typing $$ followed by a space or trailing space at line start or after space
      new InputRule({
        find: /(?:^|\s)\$\$\s$/,
        handler: ({ state, range, match }) => {
          const { tr } = state;
          const offset = match[0].indexOf('$');
          const start = range.from + offset;
          const end = range.to;

          tr.replaceWith(
            start,
            end,
            this.type.create({
              latex: '',
              displayMode: true,
            })
          );
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
          const latex = match[1] ? match[1].trim() : '';

          const start = range.from;
          const end = range.to;

          tr.replaceWith(
            start,
            end,
            this.type.create({
              latex,
              displayMode: true,
            })
          );
        },
      }),
    ];
  },
});

