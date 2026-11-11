import DOMPurify from 'dompurify';
import {DOMParser as EditorDOMParser} from '@tiptap/pm/model';
import type {Editor} from '@tiptap/react';

export function cleanDocumentHtml(html: string) {
  return DOMPurify.sanitize(html, {
    FORBID_TAGS: ['style', 'form', 'iframe'],
    FORBID_ATTR: ['srcdoc'],
    ADD_ATTR: ['latex'],
  });
}

export function parseSafeEditorContent(editor: Editor, content: string) {
  const markdown = (editor.storage as any).markdown;
  const template = document.createElement('template');
  template.innerHTML = cleanDocumentHtml(markdown?.parser.parse(content) ?? content);
  return EditorDOMParser.fromSchema(editor.schema).parse(template.content).toJSON();
}

export function parseSafeEditorSlice(editor: Editor, content: string) {
  const markdown = (editor.storage as any).markdown;
  const template = document.createElement('template');
  template.innerHTML = cleanDocumentHtml(markdown?.parser.parse(content) ?? content);
  return EditorDOMParser.fromSchema(editor.schema).parseSlice(template.content).content.toJSON();
}
