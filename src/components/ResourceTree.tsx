import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, ChevronsUp, FileCode, FilePlus, FileText, FileUp, Folder, FolderOpen, Image, Plus, RefreshCcw, Search, Video, X } from 'lucide-react';
import type { ResourceItem } from '../types';
import type { Draft } from '../utils/drafts';
import { useDrafts } from './WorkspaceTools';

function organizeResources(resources: ResourceItem[]) {
  const root: ResourceItem[] = [];
  const folders = new Map<string, ResourceItem>();
  function folderAt(path: string): ResourceItem[] {
    if (!path) return root;
    const existing = folders.get(path);
    if (existing) return existing.children!;
    const slash = path.lastIndexOf('/');
    const parent = folderAt(slash < 0 ? '' : path.slice(0, slash));
    const children: ResourceItem[] = [];
    const folder: ResourceItem = { id: path, relativePath: path, name: path.slice(slash + 1), type: 'folder', children };
    folders.set(path, folder);
    parent.push(folder);
    return children;
  }
  function add(items: ResourceItem[]) {
    for (const item of items) {
      const path = item.relativePath;
      if (item.type === 'folder') {
        folderAt(path);
        if (item.children) add(item.children);
      } else {
        const slash = path.lastIndexOf('/');
        folderAt(slash < 0 ? '' : path.slice(0, slash)).push(item);
      }
    }
  }
  const collator = new Intl.Collator('zh-CN', { numeric: true, sensitivity: 'base' });
  function sort(items: ResourceItem[]) {
    items.sort((a, b) => Number(b.type === 'folder') - Number(a.type === 'folder') || collator.compare(a.name, b.name));
    for (const item of items) if (item.children) sort(item.children);
  }
  add(resources);
  sort(root);
  return root;
}

type ResourceTreeProps = {
  resources: ResourceItem[];
  directoryName: string | null;
  activeId: string | null;
  documentName: string;
  documentId: string;
  onRestore: (draft: Draft) => void;
  onOpenFile: () => void;
  onOpenDirectory: () => void;
  onRefresh?: () => void;
  onNew: () => void;
  onSelect: (item: ResourceItem) => void;
  onInsertMedia: (item: ResourceItem) => void;
};

export function ResourceTree({ resources, directoryName, activeId, documentName, documentId, onRestore, onOpenFile, onOpenDirectory, onRefresh, onNew, onSelect, onInsertMedia }: ResourceTreeProps) {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [draftsOpen, setDraftsOpen] = useState(true);
  const drafts = useDrafts();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'file' | 'media'>('all');
  const tree = useMemo(() => organizeResources(resources), [resources]);
  const query = search.trim().toLowerCase();
  const filtering = Boolean(query || filter !== 'all');
  const isMedia = (item: ResourceItem) => item.type === 'image' || item.type === 'video';
  function filterTree(items: ResourceItem[]): ResourceItem[] {
    return items.flatMap(item => {
      const matches = item.relativePath.toLowerCase().includes(query) || item.name.toLowerCase().includes(query);
      if (item.type !== 'folder') {
        return matches && (filter === 'all' || (filter === 'media' ? isMedia(item) : item.type === 'file')) ? [item] : [];
      }
      const children = filterTree(item.children ?? []);
      return children.length || (matches && filter === 'all') ? [{ ...item, children }] : [];
    });
  }

  function renderItems(items: ResourceItem[]) {
    return <ul className="resource-branches">
      {items.map(item => {
        const folder = item.type === 'folder';
        const open = folder && (filtering || expanded.has(item.id));
        const Icon = folder ? (open ? FolderOpen : Folder) : item.type === 'image' ? Image : item.type === 'video' ? Video : item.type === 'code' ? FileCode : FileText;
        const Chevron = open ? ChevronDown : ChevronRight;
        return <li key={item.id}>
          <div className="resource-row">
            <button type="button" className="resource-entry" title={item.relativePath}
              aria-expanded={folder ? open : undefined} aria-current={!folder && activeId === item.id ? 'true' : undefined}
              disabled={(folder && filtering) || item.type === 'code' || item.type === 'other'}
              onClick={() => {
                if (!folder) { onSelect(item); return; }
                setExpanded(previous => {
                  const next = new Set(previous);
                  if (next.has(item.id)) next.delete(item.id);
                  else next.add(item.id);
                  return next;
                });
              }}>
              {folder ? <Chevron size={13} /> : <span className="resource-chevron-space" />}
              <Icon size={15} />
              <span className="resource-name">{item.name}</span>
            </button>
            {isMedia(item) && <button type="button" className="resource-insert" aria-label={`插入 ${item.name}`} title="插入到文档" onClick={() => onInsertMedia(item)}><Plus size={14} /></button>}
          </div>
          {open && Boolean(item.children?.length) && renderItems(item.children!)}
        </li>;
      })}
    </ul>;
  }

  const visibleItems = filtering ? filterTree(tree) : tree;
  const seenDocuments = new Set([documentId]);
  const browserDrafts = drafts.filter(draft => {
    if (seenDocuments.has(draft.documentId)) return false;
    seenDocuments.add(draft.documentId);
    return filter !== 'media' && draft.name.toLowerCase().includes(query);
  });
  const currentIsLocal = Boolean(activeId && resources.some(function containsActive(item): boolean {
    return item.id === activeId && item.type === 'file' || Boolean(item.children?.some(containsActive));
  }));
  const showCurrent = !currentIsLocal && filter !== 'media' && documentName.toLowerCase().includes(query);
  const showDrafts = showCurrent || browserDrafts.length > 0;
  const showDraftRows = draftsOpen || filtering;
  return <section className="resource-tree" aria-label="文件树">
    <div className="resource-toolbar">
      <button type="button" aria-label="新建文档" title="新建文档" onClick={onNew}><FilePlus size={16} /></button>
      <button type="button" aria-label="打开文件" title="打开文件" onClick={onOpenFile}><FileUp size={16} /></button>
      <button type="button" aria-label="打开本地文件夹" title="打开本地文件夹" onClick={onOpenDirectory}><FolderOpen size={16} /></button>
      {onRefresh && <button type="button" aria-label="刷新文件夹" title="刷新文件夹" onClick={onRefresh}><RefreshCcw size={15} /></button>}
      <button type="button" aria-label="折叠所有文件夹" title="折叠所有文件夹" disabled={filtering || (!expanded.size && !(showDrafts && draftsOpen))} onClick={() => { setExpanded(new Set()); setDraftsOpen(false); }}><ChevronsUp size={16} /></button>
    </div>
    <div className="resource-search">
      <Search size={14} />
      <input aria-label="搜索文件名或路径" placeholder="搜索文件名或路径" value={search} onChange={event => setSearch(event.target.value)} />
      {search && <button type="button" aria-label="清除搜索" onClick={() => setSearch('')}><X size={14} /></button>}
      <select aria-label="资源类型" value={filter} onChange={event => setFilter(event.target.value as typeof filter)}>
        <option value="all">全部</option><option value="file">文档</option><option value="media">媒体</option>
      </select>
    </div>
    <div className="resource-scroll">
      {(directoryName || visibleItems.length > 0) && <>
        <div className="resource-root" title={directoryName ?? '本地文件'}><Folder size={14} /><span className="resource-name">{directoryName ?? '本地文件'}</span></div>
        {visibleItems.length > 0 && renderItems(visibleItems)}
        {directoryName && !filtering && !visibleItems.length && <p className="resource-empty">此文件夹中暂无支持的资源</p>}
      </>}
      {showDrafts && <ul className="resource-branches"><li>
        <div className="resource-row">
          <button type="button" className="resource-entry" aria-expanded={showDraftRows} disabled={filtering} onClick={() => setDraftsOpen(value => !value)}>
            {showDraftRows ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            <Folder size={15} /><span className="resource-name">浏览器文档</span>
          </button>
        </div>
        {showDraftRows && <ul className="resource-branches">
          {showCurrent && <li><div className="resource-entry" aria-current="true" title={documentName}><FileText size={15} /><span className="resource-name">{documentName}</span></div></li>}
          {browserDrafts.map(draft => <li key={draft.documentId}>
            <button type="button" className="resource-entry resource-draft" title={draft.name} onClick={() => onRestore(draft)}><FileText size={15} /><span className="resource-name">{draft.name}</span></button>
          </li>)}
        </ul>}
      </li></ul>}
      {filtering && !showDrafts && !visibleItems.length && <p className="resource-empty">没有匹配的文件</p>}
    </div>
  </section>;
}
