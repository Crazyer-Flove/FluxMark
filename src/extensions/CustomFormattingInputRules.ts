import { Extension, markInputRule } from '@tiptap/core';

export const CustomFormattingInputRules = Extension.create({
  name: 'customFormattingInputRules',

  addInputRules() {
    return [
      // 4 asterisks: ****text**** -> Bold
      markInputRule({
        find: /(?:^|\s)(?:\*{4})([^*]+)(?:\*{4})$/,
        type: this.editor.schema.marks.bold,
      }),
      // 3 asterisks: ***text*** -> Bold
      markInputRule({
        find: /(?:^|\s)(?:\*{3})([^*]+)(?:\*{3})$/,
        type: this.editor.schema.marks.bold,
      }),
      // 3 asterisks: ***text*** -> Italic
      markInputRule({
        find: /(?:^|\s)(?:\*{3})([^*]+)(?:\*{3})$/,
        type: this.editor.schema.marks.italic,
      }),
      // 2 asterisks: **text** -> Bold
      markInputRule({
        find: /(?:^|\s)(?:\*{2})([^*]+)(?:\*{2})$/,
        type: this.editor.schema.marks.bold,
      }),
      // 1 asterisk: *text* -> Italic
      markInputRule({
        find: /(?:^|\s)(?:\*)([^*]+)(?:\*)$/,
        type: this.editor.schema.marks.italic,
      }),
      // 2 underscores: __text__ -> Bold
      markInputRule({
        find: /(?:^|\s)(?:_{2})([^_]+)(?:_{2})$/,
        type: this.editor.schema.marks.bold,
      }),
      // 1 underscore: _text_ -> Italic
      markInputRule({
        find: /(?:^|\s)(?:_)([^_]+)(?:_)$/,
        type: this.editor.schema.marks.italic,
      }),
    ];
  },
});
