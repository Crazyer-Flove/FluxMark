import React, {useEffect} from 'react';
import type {Editor} from '@tiptap/react';
import {parseSafeEditorSlice} from '../lib/editorContent';
export function AIReview({editor,text,onClose}:{editor:Editor|null;text:string;onClose:()=>void}) {
  useEffect(()=>{if(!editor)return;const editable=editor.isEditable;editor.setEditable(false);return()=>{editor.setEditable(editable);};},[editor]);
  const selection=editor?.state.selection;
  const original=selection?editor?.state.doc.textBetween(selection.from,selection.to,'\n'):'';
  const apply=(replace:boolean)=>{
    if(!editor||!selection)return;
    const content = parseSafeEditorSlice(editor, text);
    if (!content?.length) return;
    editor.chain().focus().insertContentAt(replace?{from:selection.from,to:selection.to}:selection.to,content).run();onClose();
  };
  return <div className="ai-review fixed inset-0 z-[2600] bg-black/40 flex items-center justify-center p-5"><section role="dialog" aria-modal="true" aria-label="采纳 AI 修改" className="bg-[var(--bg-primary)] text-[var(--text-primary)] rounded-2xl p-6 w-full max-w-3xl border border-[var(--border)]"><h2>采纳 AI 修改</h2><div className="ai-review-columns"><div><h3>当前选区</h3><pre>{original||'未选择文字，建议将结果插入光标后。'}</pre></div><div><h3>AI 建议</h3><pre>{text}</pre></div></div><div className="flex gap-3 justify-end"><button onClick={onClose}>放弃</button><button onClick={()=>apply(false)}>插入结果</button><button disabled={!original} onClick={()=>apply(true)}>替换选区</button></div><small>采纳后可通过撤销恢复。结果按纯文本段落插入。</small></section></div>;
}
