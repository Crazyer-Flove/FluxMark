import { ReactNodeViewRenderer } from '@tiptap/react';
import Blockquote from '@tiptap/extension-blockquote';
import { BlockquoteComponent } from '../components/BlockquoteComponent';

export const CustomBlockquote = Blockquote.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      spacing: {
        default: 'loose',
        parseHTML: (element) => {
          return element.getAttribute('data-spacing') || 'loose';
        },
        renderHTML: (attributes) => {
          return {
            'data-spacing': attributes.spacing || 'loose',
          };
        },
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(BlockquoteComponent);
  },
});
