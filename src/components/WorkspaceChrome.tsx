import React, {useEffect, useRef, useState} from 'react';
import {PanelLeft, ChevronDown, ArrowUpRight, Sparkles, Monitor, Check, X, FileText, MoreHorizontal} from 'lucide-react';
interface Choice {id:string;name:string;bgHex:string;}
interface Action {label:string;run:()=>void;}
interface Props {
 name:string; status:string; sidebar:boolean; ai:boolean; theme:string; themes:Choice[];
 font:string;fonts:{id:string;name:string}[];
 onName:(v:string)=>void;onSidebar:()=>void;onAI:()=>void;onPresent:()=>void;
 onTheme:(v:string)=>void;onFont:(v:string)=>void;onSave:()=>void;
 fileActions:Action[];exportActions:Action[];helpActions:Action[];settings:boolean;setSettings:(open:boolean)=>void;
}
function Menu({label,actions,icon}:{label:string;actions:Action[];icon:React.ReactNode}) {
 const [open,setOpen]=useState(false);const ref=useRef<HTMLDivElement>(null);
 useEffect(()=>{const h=(e:MouseEvent)=>{if(!ref.current?.contains(e.target as Node))setOpen(false);};const k=(e:KeyboardEvent)=>{if(e.key==='Escape')setOpen(false);};document.addEventListener('mousedown',h);document.addEventListener('keydown',k);return()=>{document.removeEventListener('mousedown',h);document.removeEventListener('keydown',k);};},[]);
 return <div className="chrome-menu" ref={ref}><button aria-label={label} aria-expanded={open} onClick={()=>setOpen(!open)}>{icon}<span>{label}</span><ChevronDown size={12}/></button>{open&&<div className="chrome-popover" aria-label={label}>{actions.map(a=><button key={a.label} onClick={()=>{setOpen(false);a.run();}}>{a.label}</button>)}</div>}</div>;
}
export function WorkspaceChrome(p:Props) {
 const {settings,setSettings}=p;const dialog=useRef<HTMLDivElement>(null);
 useEffect(()=>{if(!settings)return;const previous=document.activeElement as HTMLElement;dialog.current?.querySelector<HTMLElement>('button')?.focus();const h=(e:KeyboardEvent)=>{if(e.key==='Escape')setSettings(false);if(e.key==='Tab'){const list=dialog.current?.querySelectorAll<HTMLElement>('button,input,select');if(!list?.length)return;const first=list[0],last=list[list.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}};window.addEventListener('keydown',h);return()=>{window.removeEventListener('keydown',h);previous?.focus();};},[settings,setSettings]);
 return <><header className="chrome-header">
   <div className="chrome-brand"><button onClick={p.onSidebar} aria-label={p.sidebar?'收起侧边栏':'展开侧边栏'}><PanelLeft size={18}/></button><img className="chrome-monogram" src="/fluxmark.svg" alt="" width={25} height={25}/><strong>FluxMark</strong></div>
   <div className="chrome-document"><FileText size={15}/><input aria-label="文档名称" value={p.name} onChange={e=>p.onName(e.target.value)} spellCheck={false}/><span className="chrome-status" title={p.status}><span/>{p.status}</span></div>
   <div className="chrome-actions"><Menu label="文件" actions={p.fileActions} icon={<MoreHorizontal size={17}/>}/><button onClick={p.onAI} aria-pressed={p.ai} aria-label="AI 助手" title="AI 助手"><Sparkles size={17}/></button><button onClick={p.onPresent} className="chrome-present" aria-label="放映模式"><Monitor size={16}/><span>演示</span></button><Menu label="导出" actions={p.exportActions} icon={<ArrowUpRight size={16}/>}/><button className="chrome-save" onClick={p.onSave}>保存</button></div>
 </header>
 {settings&&<div className="chrome-modal-overlay" onClick={()=>setSettings(false)}><div ref={dialog} role="dialog" aria-modal="true" aria-labelledby="appearance-title" className="chrome-settings" onClick={e=>e.stopPropagation()}>
   <div className="chrome-settings-heading"><div><span className="eyebrow">WORKSPACE</span><h2 id="appearance-title">外观与设置</h2></div><button onClick={()=>setSettings(false)} aria-label="关闭设置"><X size={18}/></button></div>
   <section><h3>界面主题</h3><p>找到适合此刻的写作氛围。</p><div className="theme-swatches">{p.themes.map(t=><button key={t.id} aria-pressed={p.theme===t.id} onClick={()=>p.onTheme(t.id)}><div style={{background:t.bgHex}}><i/><i/><i/>{p.theme===t.id&&<Check size={15}/>}</div><span>{t.name}</span></button>)}</div></section>
   <section><h3>正文字体</h3><select aria-label="正文字体" value={p.font} onChange={e=>p.onFont(e.target.value)}>{p.fonts.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select><p>仅调整文档阅读与编辑区域，界面保持统一。</p></section>
   <section><h3>帮助与支持</h3><div className="settings-links">{p.helpActions.map(a=><button key={a.label} onClick={()=>{setSettings(false);a.run();}}>{a.label}<ArrowUpRight size={14}/></button>)}</div></section>
   <div className="settings-note">FluxMark · 本地优先的写作工作区</div>
 </div></div>}
 </>;
}
