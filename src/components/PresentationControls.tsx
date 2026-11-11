import React, {useState} from 'react';
import {ChevronLeft, ChevronRight, X, MousePointer2, Pencil, Eraser, Target, Grid2X2, Timer, Palette, UserCheck, Trash2, EyeOff} from 'lucide-react';

type Tool = 'select' | 'pen' | 'eraser' | 'laser';
interface Props {
  slides: string[]; index: number; tool: Tool; editing: boolean; name: string;
  onSlide: (n: number) => void; onTool: (t: Tool) => void; onEdit: () => void;
  onExit: () => void; onClear: () => void; onTimer: () => void; onBackground: () => void;
  onPicker: () => void; onColor: (c: string) => void; onSize: (n: number) => void;
  onAdd: () => void; onDelete: () => void;
  fit: boolean; onFit: () => void;
}
export function PresentationControls(p: Props) {
  const [overview, setOverview] = useState(false);
  const [blackout, setBlackout] = useState(false);
  const [more, setMore] = useState(false);
  const title = (html: string) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return (doc.querySelector('h1,h2,h3')?.textContent || doc.body.textContent || '空白幻灯片').slice(0,70);
  };
  return <>
    {blackout && <button className="presentation-blackout" onClick={()=>setBlackout(false)} aria-label="恢复放映">点击恢复放映</button>}
    <header className="presentation-header">
      <div><span className="presentation-label">演示</span><span className="presentation-name">{p.name}</span></div>
      <div className="presentation-actions">
        <button onClick={()=>setOverview(v=>!v)} aria-pressed={overview}><Grid2X2 size={16}/>总览</button>
        <button onClick={p.onFit} aria-pressed={p.fit}>{p.fit ? '适应屏幕' : '阅读模式'}</button>
        {p.editing && <button onClick={p.onEdit}>完成编辑</button>}
        <button onClick={p.onExit} aria-label="退出放映"><X size={18}/><span>退出</span></button>
      </div>
    </header>
    {overview && <div className="slide-overview" role="dialog" aria-label="幻灯片总览" onKeyDown={e=>{e.stopPropagation();if(e.key==='Escape')setOverview(false);}}>
      <div className="slide-overview-heading"><h2>幻灯片总览 · {p.slides.length} 页</h2><button onClick={()=>setOverview(false)} aria-label="关闭总览"><X size={20}/></button></div>
      <div className="slide-overview-grid">{p.slides.map((html,i)=><button key={i} aria-current={i===p.index ? 'page' : undefined} onClick={()=>{p.onSlide(i);setOverview(false);}}><small>{String(i+1).padStart(2,'0')}</small><strong>{title(html)}</strong></button>)}</div>
    </div>}
    <div className="presentation-dock" role="toolbar" aria-label="演示工具">
      <button disabled={p.index===0} onClick={()=>p.onSlide(p.index-1)} aria-label="上一页"><ChevronLeft size={19}/></button>
      <span className="slide-number">{p.index+1}<span> / {p.slides.length}</span></span>
      <button disabled={p.index===p.slides.length-1} onClick={()=>p.onSlide(p.index+1)} aria-label="下一页"><ChevronRight size={19}/></button>
      <i/>
      {([{id:'select',label:'浏览',icon:MousePointer2},{id:'laser',label:'激光笔',icon:Target},{id:'pen',label:'画笔',icon:Pencil},{id:'eraser',label:'橡皮擦',icon:Eraser}] as const).map(t=><button key={t.id} onClick={()=>p.onTool(t.id)} aria-label={t.label} title={t.label} aria-pressed={p.tool===t.id}><t.icon size={18}/></button>)}
      <i/><button onClick={p.onTimer} aria-label="倒计时" title="倒计时"><Timer size={18}/></button>
      <button onClick={()=>setMore(v=>!v)} aria-expanded={more}>更多</button>
      {more && <div className="presentation-more">
        <span>标注颜色与笔宽</span><div className="presentation-colors">{['#ef4444','#f59e0b','#22c55e','#3b82f6','#ffffff','#202020'].map(c=><button key={c} aria-label={'画笔颜色 '+c} style={{background:c}} onClick={()=>p.onColor(c)}/>)}<select aria-label="笔宽" defaultValue="3" onChange={e=>p.onSize(Number(e.target.value))}><option value="3">细</option><option value="6">中</option><option value="12">粗</option></select></div>
        <button onClick={p.onClear}><Trash2 size={16}/>清空本页标注</button>
        <button onClick={p.onBackground}><Palette size={16}/>背景与转场</button>
        <button onClick={p.onPicker}><UserCheck size={16}/>随机点名</button>
        <button onClick={()=>{p.onEdit();setMore(false);}}>{p.editing ? '完成编辑' : '编辑本页'}</button>
        <button onClick={()=>{setBlackout(true);setMore(false);}}><EyeOff size={16}/>黑屏休息</button>
        <button onClick={p.onAdd}>新增幻灯片</button>
        <button onClick={p.onDelete}>删除当前页…</button>
      </div>}
    </div>
    <div className="presentation-progress" aria-hidden="true"><span style={{width:((p.index+1)/p.slides.length*100)+'%'}}/></div>
  </>;
}
