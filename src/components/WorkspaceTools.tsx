import React, {useEffect, useState} from 'react';
import type {Editor} from '@tiptap/react';
import {X} from 'lucide-react';
import {listDrafts, storeDraft, type Draft} from '../utils/drafts';

export function useDrafts() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  useEffect(() => {
    let active = true;
    const load = () => { void listDrafts().then(items => { if (active) setDrafts(items); }).catch(console.warn); };
    load();
    window.addEventListener('fluxmark-drafts-changed', load);
    return () => { active = false; window.removeEventListener('fluxmark-drafts-changed', load); };
  }, []);
  return drafts;
}

interface Props {
  editor: Editor | null;
  name: string;
  documentId: string;
  onRestore: (draft: Draft) => void;
  commands?: {label: string; run: () => void}[];
}

export function WorkspaceTools({editor, name, documentId, onRestore, commands = []}: Props) {
  const [panel, setPanel] = useState<'search'|'history'|'commands'|null>(null);
  const [query, setQuery] = useState('');
  const [replacement, setReplacement] = useState('');
  const [matchCase, setMatchCase] = useState(false);
  const [matchIndex, setMatchIndex] = useState(-1);
  const [message, setMessage] = useState('');
  const [preview, setPreview] = useState<Draft | null>(null);
  const [confirmReplace, setConfirmReplace] = useState(false);
  const [, refresh] = useState(0);
  const drafts = useDrafts();
  useEffect(() => {
    const keydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPanel(null);
      if (!(e.ctrlKey || e.metaKey) || document.fullscreenElement) return;
      if (e.key.toLowerCase() === 'f') { e.preventDefault(); setPanel('search'); }
      if (e.key.toLowerCase() === 'k') { e.preventDefault(); setQuery(''); setPanel('commands'); }
    };
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, []);
  useEffect(() => {
    if (!editor || panel !== 'search') return;
    const update = () => { refresh(n => n + 1); setMatchIndex(-1); setConfirmReplace(false); };
    editor.on('update', update);
    return () => { editor.off('update', update); };
  }, [editor, panel]);

  const matches: {from: number; to: number}[] = [];
  if (panel === 'search' && query && editor) {
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(escaped, matchCase ? 'gu' : 'giu');
    editor.state.doc.descendants((node, pos) => {
      if (!node.isTextblock) return;
      const text = node.textBetween(0, node.content.size, '', '\uFFFC');
      for (const match of text.matchAll(pattern)) {
        if (!match[0].includes('\uFFFC')) matches.push({ from: pos + 1 + match.index!, to: pos + 1 + match.index! + match[0].length });
      }
      return false;
    });
  }

  const navigate = (direction: number) => {
    if (!matches.length || !editor) return;
    const index = matchIndex < 0 && direction < 0 ? matches.length - 1 : (matchIndex + direction + matches.length) % matches.length;
    setMatchIndex(index);
    editor.chain().focus().setTextSelection(matches[index]).scrollIntoView().run();
  };
  const replace = (all: boolean) => {
    if (!editor || !matches.length) return;
    const targets = all ? [...matches].reverse() : [matches[Math.max(0, matchIndex)]];
    const tr = editor.state.tr;
    for (const target of targets) tr.insertText(replacement, target.from, target.to);
    editor.view.dispatch(tr);
    setConfirmReplace(false);
  };
  const backup = async () => {
    if (!editor) return;
    try { await storeDraft(documentId, name, editor.getHTML()); setMessage('已创建恢复点'); }
    catch { setMessage('无法保存恢复点，请先导出备份。'); }
  };
  const title = panel === 'search' ? '查找与替换' : panel === 'commands' ? '命令面板' : '最近草稿与版本';
  if (!panel) return null;
  const availableCommands = [...commands, {
    label: '最近草稿与版本',
    run: () => { setPreview(null); setPanel('history'); },
  }];
  return <div className="workspace-tools">
    {panel && <section className="workspace-tool-panel" aria-label={title}>
      <div className="flex justify-between items-center mb-3"><strong>{title}</strong><button aria-label="关闭工具面板" onClick={()=>setPanel(null)}><X size={16}/></button></div>
      {panel === 'commands' && <>
        <input autoFocus placeholder="搜索命令…" aria-label="搜索命令" value={query} onChange={e=>setQuery(e.target.value)}/>
        <div className="draft-list">{availableCommands.filter(c=>c.label.includes(query)).map(c=><button key={c.label} onClick={()=>{setPanel(null);c.run();}}>{c.label}</button>)}</div>
      </>}
      {panel === 'search' && <>
        <input autoFocus placeholder="查找内容" aria-label="查找内容" value={query} onChange={e=>{setQuery(e.target.value);setMatchIndex(-1);setConfirmReplace(false);}}/>
        <input placeholder="替换为" aria-label="替换为" value={replacement} onChange={e=>{setReplacement(e.target.value);setConfirmReplace(false);}}/>
        <label><input type="checkbox" checked={matchCase} onChange={e=>{setMatchCase(e.target.checked);setMatchIndex(-1);setConfirmReplace(false);}}/>区分大小写</label>
        <p aria-live="polite">{matchIndex >= 0 ? `第 ${matchIndex+1} / ` : ''}{matches.length} 处匹配</p>
        <div className="flex flex-wrap gap-2">
          <button disabled={!matches.length} onClick={()=>navigate(-1)}>上一处</button><button disabled={!matches.length} onClick={()=>navigate(1)}>下一处</button>
          <button disabled={!matches.length} onClick={()=>replace(false)}>替换</button><button disabled={!matches.length} onClick={()=>setConfirmReplace(true)}>全部替换</button>
        </div>
        {confirmReplace && <p><button onClick={()=>replace(true)}>确认替换 {matches.length} 处</button> <button onClick={()=>setConfirmReplace(false)}>取消</button></p>}
      </>}
      {panel === 'history' && <>
        <button onClick={backup}>创建恢复点</button><p aria-live="polite">{message}</p>
        <small>此浏览器最多保留 30 个版本。</small>
        {preview ? <>
          <p>{preview.name}</p><pre className="max-h-48 overflow-auto whitespace-pre-wrap">{new DOMParser().parseFromString(preview.html,'text/html').body.textContent}</pre>
          <button onClick={()=>setPreview(null)}>返回列表</button> <button onClick={()=>{onRestore(preview);setPanel(null);}}>恢复此版本</button>
        </> : <div className="draft-list">{drafts.map(d=><button key={d.id} onClick={()=>setPreview(d)}><strong>{d.name}</strong><small>{new Date(d.time).toLocaleString('zh-CN')}</small></button>)}</div>}
      </>}
    </section>}
  </div>;
}
