import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Coffee, X, Check, Copy, Sparkles, QrCode, ShieldCheck, Gift, RotateCw, AlertTriangle, Image as ImageIcon } from 'lucide-react';

// =========================================================================
// 💡 自定义二维码图片设置：
// 您可以将自己的微信/支付宝收款码图片（例如 wechat-qr.png, alipay-qr.png）
// 放到 /public 目录下，并在下方修改图片路径，例如:
// const CUSTOM_WECHAT_QR = '/wechat-qr.png';
// const CUSTOM_ALIPAY_QR = '/alipay-qr.png';
// 或使用网络图片 URL，留空则显示极简矢量示范二维码。
// =========================================================================
const CUSTOM_WECHAT_QR = '/wechat-qr.jpg'; // 例如: '/wechat-qr.jpg' 或图片Base64/链接
const CUSTOM_ALIPAY_QR = '/alipay-qr.jpg'; // 例如: '/alipay-qr.jpg' 或图片Base64/链接

interface SponsorModalProps {
  isOpen: boolean;
  onClose: () => void;
  showToast?: (msg: string) => void;
}

export const SponsorModal: React.FC<SponsorModalProps> = ({ isOpen, onClose, showToast }) => {
  const [payMethod, setPayMethod] = useState<'wechat' | 'alipay'>('wechat');
  const [selectedAmount, setSelectedAmount] = useState<number>(10);
  const [copied, setCopied] = useState<boolean>(false);

  const [customWechatUploaded, setCustomWechatUploaded] = useState<string | null>(null);
  const [customAlipayUploaded, setCustomAlipayUploaded] = useState<string | null>(null);
  const [imgErrorMap, setImgErrorMap] = useState<Record<string, boolean>>({});
  const [imgLoadingMap, setImgLoadingMap] = useState<Record<string, boolean>>({});

  if (!isOpen) return null;

  const activeWechatQr = customWechatUploaded || CUSTOM_WECHAT_QR;
  const activeAlipayQr = customAlipayUploaded || CUSTOM_ALIPAY_QR;

  const currentQrImage = payMethod === 'wechat' ? activeWechatQr : activeAlipayQr;
  const isCurrentImgFailed = !!(currentQrImage && imgErrorMap[currentQrImage]);
  const isCurrentImgLoading = !!(currentQrImage && imgLoadingMap[currentQrImage]);

  const handleRetryLoad = () => {
    if (currentQrImage) {
      setImgErrorMap(prev => ({ ...prev, [currentQrImage]: false }));
      setImgLoadingMap(prev => ({ ...prev, [currentQrImage]: true }));
    }
  };

  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const result = evt.target?.result as string;
        if (payMethod === 'wechat') {
          setCustomWechatUploaded(result);
          setImgErrorMap(prev => ({ ...prev, [result]: false }));
          setImgLoadingMap(prev => ({ ...prev, [result]: false }));
          if (showToast) showToast('✅ 微信收款二维码图片更新成功！');
        } else {
          setCustomAlipayUploaded(result);
          setImgErrorMap(prev => ({ ...prev, [result]: false }));
          setImgLoadingMap(prev => ({ ...prev, [result]: false }));
          if (showToast) showToast('✅ 支付宝收款二维码图片更新成功！');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCopyNote = () => {
    const text = `感谢您对 FluxMark 的支持与认可！赞赏金额：¥${selectedAmount} 元。让我们一起把这款编辑器打造得更好！`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    if (showToast) showToast('❤️ 赞赏致谢词已复制到剪贴板！');
    setTimeout(() => setCopied(false), 2000);
  };

  const amounts = [
    { value: 5, label: '¥5', title: '赞赏鼓励' },
    { value: 10, label: '¥10', title: '请喝咖啡 ☕' },
    { value: 20, label: '¥20', title: '深度支持' },
    { value: 50, label: '¥50', title: '慷慨资助 🚀' },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 z-[2500] flex items-center justify-center p-4 sm:p-6 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', duration: 0.3 }}
          className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden text-slate-800 my-auto"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 p-6 text-white relative overflow-hidden">
            <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl border border-white/25 text-white shadow-inner">
                  <Heart size={26} className="fill-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                    赏赞与支持 FluxMark
                  </h2>
                  <p className="text-xs text-rose-100/90 mt-0.5">
                    独立开发与持续更新离不开您的支持与鼓励
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-full text-white/80 hover:text-white transition-colors cursor-pointer"
                title="关闭"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Message Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-50 to-orange-50/60 border border-rose-100 flex items-start gap-3">
              <div className="p-2 bg-rose-500/10 text-rose-600 rounded-xl shrink-0 mt-0.5">
                <Coffee size={18} />
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                FluxMark 是一款完全免费、无广告的极简智能编辑器。如果它提升了您的写作、教学或创作效率，欢迎请作者喝杯咖啡！您的每一分赏赞都将用于服务器运行与新功能研发。
              </p>
            </div>

            {/* Select Amount */}
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5 block">
                选择赞赏支持金额
              </label>
              <div className="grid grid-cols-4 gap-2.5">
                {amounts.map((amt) => {
                  const isSelected = selectedAmount === amt.value;
                  return (
                    <button
                      key={amt.value}
                      onClick={() => setSelectedAmount(amt.value)}
                      className={`p-3 rounded-2xl border flex flex-col items-center justify-center transition-all cursor-pointer relative ${
                        isSelected
                          ? 'border-rose-500 bg-rose-50/70 text-rose-600 shadow-sm ring-2 ring-rose-500/20 font-bold'
                          : 'border-slate-200 hover:border-slate-300 bg-slate-50/50 text-slate-700 hover:bg-white'
                      }`}
                    >
                      <span className="text-base font-extrabold">{amt.label}</span>
                      <span className="text-[10px] text-slate-400 font-normal mt-0.5">{amt.title}</span>
                      {isSelected && (
                        <div className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white rounded-full p-0.5 shadow-sm">
                          <Check size={10} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                选择支付方式
              </label>
              <div className="grid grid-cols-2 gap-3">
                {/* WeChat Pay Option */}
                <button
                  onClick={() => setPayMethod('wechat')}
                  className={`p-3.5 rounded-2xl border flex items-center justify-center gap-2.5 font-bold text-sm transition-all cursor-pointer ${
                    payMethod === 'wechat'
                      ? 'border-[#07C160] bg-[#07C160]/10 text-[#07C160] ring-2 ring-[#07C160]/20 shadow-sm'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="w-5 h-5 rounded-full bg-[#07C160] flex items-center justify-center text-white text-[10px] font-black">
                    微
                  </div>
                  <span>微信支付 (WeChat)</span>
                </button>

                {/* Alipay Option */}
                <button
                  onClick={() => setPayMethod('alipay')}
                  className={`p-3.5 rounded-2xl border flex items-center justify-center gap-2.5 font-bold text-sm transition-all cursor-pointer ${
                    payMethod === 'alipay'
                      ? 'border-[#1677FF] bg-[#1677FF]/10 text-[#1677FF] ring-2 ring-[#1677FF]/20 shadow-sm'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="w-5 h-5 rounded-full bg-[#1677FF] flex items-center justify-center text-white text-[10px] font-black">
                    支
                  </div>
                  <span>支付宝 (Alipay)</span>
                </button>
              </div>
            </div>

            {/* QR Code Display Card */}
            <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
              <div className="relative group">
                <div
                  className={`p-3 bg-white rounded-2xl shadow-md border-2 transition-all flex items-center justify-center w-48 h-48 overflow-hidden relative ${
                    payMethod === 'wechat' ? 'border-[#07C160]' : 'border-[#1677FF]'
                  }`}
                >
                  {currentQrImage && !isCurrentImgFailed ? (
                    <img
                      key={currentQrImage}
                      src={currentQrImage}
                      alt={`${payMethod === 'wechat' ? '微信' : '支付宝'}收款二维码`}
                      className="w-full h-full object-contain rounded-xl"
                      onError={() => {
                        if (currentQrImage) {
                          setImgErrorMap(prev => ({ ...prev, [currentQrImage]: true }));
                          setImgLoadingMap(prev => ({ ...prev, [currentQrImage]: false }));
                        }
                      }}
                      onLoad={() => {
                        if (currentQrImage) {
                          setImgLoadingMap(prev => ({ ...prev, [currentQrImage]: false }));
                        }
                      }}
                    />
                  ) : (
                    /* Generated QR Code SVG fallback with clear notice */
                    <div className="w-full h-full flex flex-col items-center justify-center relative">
                      <svg
                        width="160"
                        height="160"
                        viewBox="0 0 160 160"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-40 h-40 opacity-90"
                      >
                        {/* Background */}
                        <rect width="160" height="160" rx="8" fill="white" />
                        
                        {/* Outer finder patterns */}
                        <rect x="10" y="10" width="40" height="40" rx="6" fill={payMethod === 'wechat' ? '#07C160' : '#1677FF'} />
                        <rect x="16" y="16" width="28" height="28" rx="3" fill="white" />
                        <rect x="22" y="22" width="16" height="16" rx="2" fill={payMethod === 'wechat' ? '#07C160' : '#1677FF'} />

                        <rect x="110" y="10" width="40" height="40" rx="6" fill={payMethod === 'wechat' ? '#07C160' : '#1677FF'} />
                        <rect x="116" y="16" width="28" height="28" rx="3" fill="white" />
                        <rect x="122" y="22" width="16" height="16" rx="2" fill={payMethod === 'wechat' ? '#07C160' : '#1677FF'} />

                        <rect x="10" y="110" width="40" height="40" rx="6" fill={payMethod === 'wechat' ? '#07C160' : '#1677FF'} />
                        <rect x="16" y="116" width="28" height="28" rx="3" fill="white" />
                        <rect x="22" y="122" width="16" height="16" rx="2" fill={payMethod === 'wechat' ? '#07C160' : '#1677FF'} />

                        {/* Matrix dots */}
                        <g fill="#1E293B">
                          <rect x="58" y="12" width="8" height="8" rx="1.5" />
                          <rect x="70" y="12" width="8" height="8" rx="1.5" />
                          <rect x="86" y="12" width="16" height="8" rx="1.5" />
                          <rect x="58" y="24" width="16" height="8" rx="1.5" />
                          <rect x="80" y="24" width="8" height="8" rx="1.5" />
                          <rect x="94" y="24" width="8" height="8" rx="1.5" />
                          <rect x="62" y="36" width="8" height="8" rx="1.5" />
                          <rect x="76" y="36" width="16" height="8" rx="1.5" />

                          <rect x="12" y="58" width="8" height="16" rx="1.5" />
                          <rect x="24" y="62" width="12" height="8" rx="1.5" />
                          <rect x="42" y="58" width="8" height="8" rx="1.5" />
                          <rect x="54" y="58" width="16" height="8" rx="1.5" />
                          <rect x="74" y="58" width="8" height="8" rx="1.5" />
                          <rect x="86" y="58" width="16" height="16" rx="1.5" />
                          <rect x="106" y="58" width="12" height="8" rx="1.5" />
                          <rect x="124" y="58" width="8" height="16" rx="1.5" />
                          <rect x="136" y="58" width="12" height="8" rx="1.5" />

                          <rect x="12" y="80" width="16" height="8" rx="1.5" />
                          <rect x="34" y="78" width="8" height="16" rx="1.5" />
                          <rect x="48" y="80" width="8" height="8" rx="1.5" />
                          <rect x="60" y="74" width="16" height="8" rx="1.5" />
                          <rect x="108" y="76" width="8" height="16" rx="1.5" />
                          <rect x="120" y="80" width="16" height="8" rx="1.5" />
                          <rect x="140" y="78" width="8" height="12" rx="1.5" />

                          <rect x="58" y="94" width="8" height="8" rx="1.5" />
                          <rect x="70" y="94" width="16" height="8" rx="1.5" />
                          <rect x="90" y="94" width="8" height="16" rx="1.5" />
                          <rect x="104" y="94" width="16" height="8" rx="1.5" />
                          <rect x="126" y="94" width="8" height="8" rx="1.5" />
                          <rect x="138" y="94" width="12" height="8" rx="1.5" />

                          <rect x="58" y="112" width="16" height="8" rx="1.5" />
                          <rect x="80" y="112" width="8" height="8" rx="1.5" />
                          <rect x="92" y="112" width="16" height="16" rx="1.5" />
                          <rect x="114" y="112" width="8" height="8" rx="1.5" />
                          <rect x="126" y="112" width="16" height="8" rx="1.5" />

                          <rect x="58" y="126" width="8" height="16" rx="1.5" />
                          <rect x="72" y="128" width="16" height="8" rx="1.5" />
                          <rect x="114" y="126" width="16" height="8" rx="1.5" />
                          <rect x="136" y="126" width="12" height="16" rx="1.5" />

                          <rect x="62" y="144" width="16" height="8" rx="1.5" />
                          <rect x="84" y="144" width="12" height="8" rx="1.5" />
                          <rect x="102" y="144" width="8" height="8" rx="1.5" />
                          <rect x="116" y="144" width="16" height="8" rx="1.5" />
                        </g>

                        {/* Center Brand Badge Insert */}
                        <rect x="62" y="62" width="36" height="36" rx="10" fill="white" stroke="#E2E8F0" strokeWidth="2" />
                        {payMethod === 'wechat' ? (
                          <g transform="translate(68, 68)">
                            <circle cx="12" cy="12" r="11" fill="#07C160" />
                            <path d="M9 10C9 8.3 10.8 7 13 7C15.2 7 17 8.3 17 10C17 11.7 15.2 13 13 13C12.4 13 11.8 12.8 11.3 12.5L9.5 13L10 11.5C9.4 11.1 9 10.6 9 10Z" fill="white" />
                          </g>
                        ) : (
                          <g transform="translate(68, 68)">
                            <circle cx="12" cy="12" r="11" fill="#1677FF" />
                            <text x="12" y="16" fontSize="13" fontWeight="bold" fill="white" textAnchor="middle">支</text>
                          </g>
                        )}
                      </svg>
                    </div>
                  )}
                </div>
              </div>

              {/* Notice when image is failed to load */}
              {isCurrentImgFailed && (
                <div className="w-full max-w-sm p-2.5 rounded-xl bg-amber-50 border border-amber-200/80 text-[11px] text-amber-800 flex items-center justify-between gap-2 shadow-2xs">
                  <div className="flex items-center gap-1.5 leading-snug">
                    <AlertTriangle size={15} className="text-amber-600 shrink-0" />
                    <span>自定义{payMethod === 'wechat' ? '微信' : '支付宝'}图片未加载成功，已自动展示示范二维码。</span>
                  </div>
                  <button
                    onClick={handleRetryLoad}
                    className="shrink-0 px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    title="重试加载"
                  >
                    <RotateCw size={11} />
                    <span>重试</span>
                  </button>
                </div>
              )}

              {/* QR Scan Instructions */}
              <div className="flex flex-col items-center gap-1.5">
                <p className="text-sm font-bold text-slate-800 flex items-center justify-center gap-1.5">
                  <QrCode size={16} className={payMethod === 'wechat' ? 'text-[#07C160]' : 'text-[#1677FF]'} />
                  请使用 {payMethod === 'wechat' ? '微信' : '支付宝'} 扫描二维码赞赏 <span className="text-rose-600 font-extrabold">¥{selectedAmount}</span>
                </p>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-1">
              <button
                onClick={handleCopyNote}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all text-xs font-bold flex items-center gap-2 cursor-pointer"
              >
                {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                <span>{copied ? '已复制致谢词' : '复制致谢留言'}</span>
              </button>

              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-rose-500 text-white hover:bg-rose-600 font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <Heart size={14} className="fill-white" />
                <span>收下这份心意</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
