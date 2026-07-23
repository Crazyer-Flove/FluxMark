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
          latex: element.getAttribute('data-latex') || '',
        }),
      },
      {
        tag: 'math-inline',
        getAttrs: (element: HTMLElement) => ({
          latex: element.textContent || '',
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
        // Matches $latex$ where there is no $ before the opening $ or after the closing $
        find: /(?:^|[^$])\$([^$]+)\$$/,
        handler: ({ state, range, match }) => {
          const { tr } = state;
          const latex = match[1] ? match[1].trim() : '';
          if (!latex) return;

          const offset = match[0].indexOf('$');
          const start = range.from + offset;
          const end = range.to;

          tr.replaceWith(start, end, this.type.create({
            latex,
            displayMode: false,
          }));
        },
      }),
    ];
  },

  addPasteRules() {
    return [
      new PasteRule({
        find: /(?<!\$)\$([^\$]+?)\$(?!\$)/g,
        handler: ({ state, range, match }) => {
          const { tr } = state;
          const latex = match[1] ? match[1].trim() : '';
          if (!latex) return;

          const start = range.from;
          const end = range.to;

          tr.replaceWith(start, end, this.type.create({
            latex,
            displayMode: false,
          }));
        },
      }),
    ];
  },
});

