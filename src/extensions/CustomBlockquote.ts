import { ReactNodeViewRenderer } from '@tiptap/react';
import Blockquote from '@tiptap/extension-blockquote';
import { BlockquoteComponent } from '../components/BlockquoteComponent';

export const CustomBlockquote = Blockquote.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      spacing: {
        default: 'compact',
        parseHTML: (element) => {
          return element.getAttribute('data-spacing') || 'compact';
        },
        renderHTML: (attributes) => {
          return {
            'data-spacing': attributes.spacing || 'compact',
          };
        },
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(BlockquoteComponent);
  },
});

