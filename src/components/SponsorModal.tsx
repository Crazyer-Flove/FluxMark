import React, { useEffect, useRef, useState } from 'react';
import { X, Heart, RotateCw } from 'lucide-react';

interface SponsorModalProps { isOpen: boolean; onClose: () => void; showToast?: (msg: string) => void; }
export const SponsorModal: React.FC<SponsorModalProps> = ({ isOpen, onClose }) => {
  const [method, setMethod] = useState<'wechat' | 'alipay'>('wechat');
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const dialogRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    dialogRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); }
      if (e.key !== 'Tab') return;
      const items = dialogRef.current?.querySelectorAll<HTMLButtonElement>('button');
      if (!items?.length) return;
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', handleKey);
    return () => { document.removeEventListener('keydown', handleKey); previous?.focus(); };
  }, [isOpen, onClose]);
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[2500] bg-black/40 flex items-center justify-center p-5" onClick={onClose}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="support-title" className="support-dialog w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)] p-6 text-[var(--text-primary)] max-h-[90dvh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-5">
          <h2 id="support-title" className="text-base font-semibold flex items-center gap-2"><Heart size={18} />支持 FluxMark</h2>
          <button onClick={onClose} aria-label="关闭赞赏窗口" className="p-2 rounded-lg hover:bg-[var(--bg-secondary)]"><X size={18} /></button>
        </div>
        <p className="text-sm leading-relaxed text-[var(--text-secondary)]">如果 FluxMark 对你有所帮助，欢迎请作者喝杯咖啡，支持持续更新。</p>
        <div className="flex gap-1 p-1 rounded-lg bg-[var(--bg-secondary)] my-5" aria-label="支付方式">
          {(['wechat', 'alipay'] as const).map(m => (
            <button key={m} aria-pressed={method === m} onClick={() => { setMethod(m); setFailed(false); }} className={'flex-1 rounded-md py-2 text-sm ' + (method === m ? 'bg-[var(--bg-primary)] font-medium' : 'text-[var(--text-secondary)]')}>{m === 'wechat' ? '微信' : '支付宝'}</button>
          ))}
        </div>
        <div className="bg-white rounded-xl p-3 aspect-square flex items-center justify-center">
          {failed ? <button onClick={() => { setAttempt(n => n + 1); setFailed(false); }} className="text-neutral-700 text-sm flex items-center gap-2"><RotateCw size={16} />图片加载失败，点击重试</button> :
            <img key={method + attempt} src={'/' + (method === 'wechat' ? 'wechat' : 'alipay') + '-qr.jpg' + (attempt ? '?retry=' + attempt : '')} alt={method === 'wechat' ? '作者微信赞赏码' : '作者支付宝收款码'} className="w-full h-full object-contain" onError={() => setFailed(true)} />}
        </div>
        <p className="text-xs text-center text-[var(--text-secondary)] mt-4 leading-relaxed">扫码后自行输入金额，请核对收款人。<br />感谢每一份支持。</p>
      </div>
    </div>
  );
};
