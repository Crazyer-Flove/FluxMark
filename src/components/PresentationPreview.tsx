import React, {useEffect, useRef} from 'react';
import {ArrowUpRight, Layers3, Play, X} from 'lucide-react';
import {getPresentationLayout} from '../utils/presentationLayout';

interface Props {
  slides: string[];
  onClose: () => void;
  onStart: () => void;
  onJump: (index: number) => void;
}

export function PresentationPreview({slides, onClose, onStart, onJump}: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);
  return <dialog ref={dialog} className="presentation-preview" aria-labelledby="presentation-preview-title"
    onCancel={event => { event.preventDefault(); onClose(); }}>
    <header>
      <div className="presentation-preview-heading">
        <span className="presentation-preview-icon"><Layers3 size={20} /></span>
        <div><h2 id="presentation-preview-title">演示预览</h2><p>{slides.length} 页 · 按文档顶层分隔线划分</p></div>
      </div>
      <button aria-label="关闭预览" onClick={onClose}><X size={18}/></button>
    </header>
    <div className="presentation-preview-list">
      {slides.map((html, index) => {
        const body = new DOMParser().parseFromString(html, 'text/html').body;
        const layout = getPresentationLayout(html);
        const title = body.querySelector('h1,h2,h3')?.textContent || body.textContent?.trim() || '未命名幻灯片';
        return <button key={index} onClick={() => onJump(index)} title="跳回原文">
          <small>{String(index + 1).padStart(2, '0')}</small>
          <strong>{layout === 'empty' ? '空白页' : title.slice(0, 70)}</strong>
          {layout === 'dense' && <span>内容较多，可能需要滚动</span>}
          <ArrowUpRight size={15} aria-hidden="true" />
        </button>;
      })}
    </div>
    <footer><button onClick={onClose}>返回写作</button><button className="ui-primary" onClick={onStart}><Play size={16}/>开始放映</button></footer>
  </dialog>;
}
