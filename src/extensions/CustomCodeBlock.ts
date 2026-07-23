import { ReactNodeViewRenderer } from '@tiptap/react';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { CodeBlockComponent } from '../components/CodeBlockComponent';

export const CustomCodeBlock = CodeBlockLowlight.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      showLineNumbers: {
        default: true,
        parseHTML: element => {
          const val = element.getAttribute('data-line-numbers');
          return val === null ? true : val === 'true';
        },
        renderHTML: attributes => {
          if (!attributes.showLineNumbers) {
            return {
              'data-line-numbers': 'false',
            };
          }
          return {
            'data-line-numbers': 'true',
          };
        },
      },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockComponent);
  },
});

